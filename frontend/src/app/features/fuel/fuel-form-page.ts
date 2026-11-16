import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap } from 'rxjs';
import {
  decimal,
  errorMessage,
  km,
  liters as formatLiters,
  money,
  nowInputDateTime,
  price,
} from '../../core/format';
import { ConnectivityService } from '../../core/connectivity.service';
import { FuelService } from '../../core/fuel.service';
import { I18nService } from '../../core/i18n.service';
import type { FuelLog } from '../../core/models';
import { PlaceSearchService, type PlaceSuggestion } from '../../core/place-search.service';
import { VehicleStore } from '../../core/vehicle-store.service';
import { DateTimePickerComponent } from '../../shared/datetime-picker/datetime-picker';
import { IconComponent } from '../../shared/icon/icon';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { PageHeaderComponent } from '../../shared/page-header/page-header';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-fuel-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DateTimePickerComponent,
    IconComponent,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './fuel-form-page.html',
})
export class FuelFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly fuelService = inject(FuelService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  private readonly places = inject(PlaceSearchService);
  readonly store = inject(VehicleStore);
  readonly connectivity = inject(ConnectivityService);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly logs = signal<FuelLog[]>([]);
  readonly vehicleName = computed(
    () => this.store.selected()?.name ?? this.i18n.t('common.yourCar'),
  );
  readonly suggestions = signal<PlaceSuggestion[]>([]);
  readonly searchingLocation = signal(false);
  readonly locating = signal(false);
  readonly locationOpen = signal(false);
  readonly locationError = signal<string | null>(null);
  private readonly locationCoords = signal<{ lat: number; lon: number } | null>(null);
  private suppressLocationSearch = false;

  readonly form = this.fb.group({
    date: [nowInputDateTime(), [Validators.required]],
    odometer: [0, [Validators.required, Validators.min(1)]],
    stationName: ['', [Validators.maxLength(100)]],
    stationLocation: ['', [Validators.maxLength(160)]],
    liters: [null as number | null, [Validators.required, Validators.min(0.01)]],
    pricePerLiter: [null as number | null, [Validators.required, Validators.min(0.001)]],
    fullTank: [true],
    boardComputerAvg: [null as number | null],
  });

  private readonly formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  private currentVehicleId: number | null = null;

  protected readonly money = money;
  protected readonly price = price;
  protected readonly km = km;
  protected readonly decimal = decimal;
  protected readonly liters = formatLiters;

  readonly formLiters = computed(() => {
    this.formValues();
    return Number(this.form.controls.liters.value ?? 0);
  });

  readonly formPrice = computed(() => {
    this.formValues();
    return Number(this.form.controls.pricePerLiter.value ?? 0);
  });

  readonly total = computed(() => {
    const liters = this.formLiters();
    const priceValue = this.formPrice();
    return liters > 0 && priceValue > 0 ? liters * priceValue : 0;
  });

  readonly reference = computed(() => {
    this.i18n.locale();
    this.formValues();
    const vehicle = this.store.selected();
    const logs = this.logs();
    if (!vehicle) return null;
    const stationLocation = (this.form.controls.stationLocation.value ?? '').trim().toLowerCase();
    const stationName = (this.form.controls.stationName.value ?? '').trim().toLowerCase();
    const station = stationLocation || stationName;
    const sameStation = station
      ? logs.filter((log) => {
          const value = (log.stationLocation || log.stationName || '').trim().toLowerCase();
          return value === station;
        })
      : [];
    if (sameStation.length > 0) {
      const litersSum = sameStation.reduce((sum, log) => sum + log.liters, 0);
      const weighted = sameStation.reduce((sum, log) => sum + log.pricePerLiter * log.liters, 0);
      if (litersSum > 0) {
        return {
          value: weighted / litersSum,
          type: 'STATION_AVERAGE' as const,
          label:
            this.form.controls.stationName.value ||
            this.form.controls.stationLocation.value ||
            this.i18n.t('fuel.form.referenceThisStation'),
        };
      }
    }
    if (logs.length > 0) {
      const latest = [...logs].sort((a, b) => b.date.localeCompare(a.date))[0];
      return {
        value: latest.pricePerLiter,
        type: 'PREVIOUS_FILL' as const,
        label: this.i18n.t('fuel.form.referenceLastFill'),
      };
    }
    return null;
  });

  readonly estimate = computed(() => {
    this.formValues();
    const reference = this.reference();
    const current = Number(this.form.controls.pricePerLiter.value ?? 0);
    const liters = Number(this.form.controls.liters.value ?? 0);
    if (!reference || current <= 0 || liters <= 0) return null;
    const difference = reference.value - current;
    const amount = difference > 0 ? difference * liters : 0;
    const percent = (difference / reference.value) * 100;
    return {
      amount,
      percent,
      cheaper: difference > 0,
      label:
        reference.type === 'STATION_AVERAGE'
          ? this.i18n.t('fuel.form.referenceStationAverage', { station: reference.label })
          : reference.label,
    };
  });

  constructor() {
    this.form.controls.stationLocation.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((value) => {
          const query = value?.trim() ?? '';
          if (this.suppressLocationSearch || query.length < 3 || !this.connectivity.online()) {
            this.suggestions.set([]);
            this.searchingLocation.set(false);
            return of<PlaceSuggestion[]>([]);
          }
          this.searchingLocation.set(true);
          this.locationError.set(null);
          return this.places.search(query, this.locationCoords()).pipe(
            catchError(() => {
              this.locationError.set(this.i18n.t('fuel.form.locationErrorSearch'));
              return of<PlaceSuggestion[]>([]);
            }),
            finalize(() => this.searchingLocation.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((places) => {
        this.suggestions.set(places);
        this.locationOpen.set(places.length > 0);
      });

    effect(() => {
      const vehicle = this.store.selected();
      if (!vehicle) return;
      if (this.form.controls.odometer.pristine) {
        this.form.controls.odometer.setValue(vehicle.currentOdometer);
      }
      if (vehicle.id !== this.currentVehicleId) {
        this.currentVehicleId = vehicle.id;
        untracked(() => this.loadLogs(vehicle.id));
      }
    });
  }

  useCurrentLocation(): void {
    if (this.locating()) return;
    this.locationError.set(null);

    if (!this.connectivity.online()) {
      this.locationError.set(this.i18n.t('fuel.form.locationErrorOffline'));
      return;
    }
    if (!('geolocation' in navigator)) {
      this.locationError.set(this.i18n.t('fuel.form.locationErrorNoGeo'));
      return;
    }

    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        this.locationCoords.set(coords);
        this.places
          .reverse(coords.lat, coords.lon)
          .pipe(finalize(() => this.locating.set(false)))
          .subscribe({
            next: (place) => {
              if (place) {
                this.selectLocation(place);
              } else {
                this.locationError.set(this.i18n.t('fuel.form.locationErrorGeocode'));
              }
            },
            error: () => {
              this.locationError.set(this.i18n.t('fuel.form.locationErrorAddress'));
            },
          });
      },
      (geoError) => {
        this.locating.set(false);
        this.locationError.set(
          geoError.code === geoError.PERMISSION_DENIED
            ? this.i18n.t('fuel.form.locationErrorPermission')
            : this.i18n.t('fuel.form.locationErrorGeneric'),
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  selectLocation(place: PlaceSuggestion): void {
    this.suppressLocationSearch = true;
    this.form.controls.stationLocation.setValue(place.label);
    if (!this.form.controls.stationName.value?.trim()) {
      this.form.controls.stationName.setValue(place.name);
    }
    this.locationCoords.set({ lat: place.lat, lon: place.lon });
    this.suggestions.set([]);
    this.locationOpen.set(false);
    this.locationError.set(null);
    window.setTimeout(() => {
      this.suppressLocationSearch = false;
    }, 600);
  }

  onLocationBlur(): void {
    window.setTimeout(() => this.locationOpen.set(false), 180);
  }

  onLocationFocus(): void {
    if (this.suggestions().length > 0) {
      this.locationOpen.set(true);
    }
  }

  submit(): void {
    if (this.saving()) return;
    this.error.set(null);
    const vehicle = this.store.selected();
    if (!vehicle) {
      this.error.set(this.i18n.t('fuel.form.noCarError'));
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const odometer = Number(value.odometer);
    if (odometer < vehicle.currentOdometer) {
      this.error.set(
        this.i18n.t('fuel.form.validationBelowCurrent', { km: km(vehicle.currentOdometer) }),
      );
      this.form.controls.odometer.setErrors({ belowCurrent: true });
      return;
    }

    this.saving.set(true);
    this.fuelService
      .create(vehicle.id, {
        date: value.date ?? nowInputDateTime(),
        odometer,
        liters: Number(value.liters),
        pricePerLiter: Number(value.pricePerLiter),
        totalCost: null,
        stationName: value.stationName?.trim() || null,
        stationLocation: value.stationLocation?.trim() || null,
        fullTank: value.fullTank ?? true,
        boardComputerAvg: value.boardComputerAvg ? Number(value.boardComputerAvg) : null,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (log) => {
          if (log.pending) {
            this.toast.info(this.i18n.t('fuel.form.toastSavedOffline'));
          } else if (log.savings?.savingsAmount && log.savings.savingsAmount > 0) {
            this.toast.success(
              this.i18n.t('fuel.form.toastSavings', {
                percent: decimal(Math.abs(log.savings.percentCheaper)),
                amount: money(log.savings.savingsAmount),
              }),
            );
          } else {
            this.toast.success(this.i18n.t('fuel.form.toastRegistered'));
          }
          void this.router.navigate(['/app/fuel']);
        },
        error: (error: unknown) => {
          this.error.set(errorMessage(error));
          this.toast.error(errorMessage(error));
        },
      });
  }

  toggleFullTank(): void {
    this.form.controls.fullTank.setValue(!this.form.controls.fullTank.value);
  }

  fieldError(name: string): string | null {
    const control = this.form.get(name);
    if (!control || !(control.touched || control.dirty) || !control.invalid) return null;
    if (control.errors?.['required']) return this.i18n.t('fuel.form.validationRequired');
    if (control.errors?.['min']) return this.i18n.t('fuel.form.validationValue');
    if (control.errors?.['maxlength']) return this.i18n.t('fuel.form.validationTooLong');
    if (control.errors?.['belowCurrent']) return this.i18n.t('fuel.form.validationBelow');
    return this.i18n.t('fuel.form.validationReview');
  }

  private loadLogs(vehicleId: number): void {
    this.fuelService.list(vehicleId).subscribe({
      next: (logs) => this.logs.set(logs),
      error: () => this.logs.set([]),
    });
  }
}
