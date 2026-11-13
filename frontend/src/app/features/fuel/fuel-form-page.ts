import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  dateMedium,
  decimal,
  errorMessage,
  km,
  money,
  nowInputDateTime,
  price,
} from '../../core/format';
import { FuelService } from '../../core/fuel.service';
import type { FuelLog } from '../../core/models';
import { VehicleStore } from '../../core/vehicle-store.service';
import { IconComponent } from '../../shared/icon/icon';
import { PageHeaderComponent } from '../../shared/page-header/page-header';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-fuel-form-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, PageHeaderComponent],
  templateUrl: './fuel-form-page.html',
})
export class FuelFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly fuelService = inject(FuelService);
  private readonly toast = inject(ToastService);
  readonly store = inject(VehicleStore);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly logs = signal<FuelLog[]>([]);

  readonly form = this.fb.group({
    date: [nowInputDateTime(), [Validators.required]],
    odometer: [0, [Validators.required, Validators.min(1)]],
    stationName: [''],
    stationLocation: [''],
    liters: [null as number | null, [Validators.required, Validators.min(0.01)]],
    pricePerLiter: [null as number | null, [Validators.required, Validators.min(0.001)]],
    fullTank: [true],
    boardComputerAvg: [null as number | null],
  });

  private readonly formValues = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  private currentVehicleId: number | null = null;

  protected readonly money = money;
  protected readonly price = price;
  protected readonly km = km;
  protected readonly decimal = decimal;
  protected readonly dateMedium = dateMedium;

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
          label: this.form.controls.stationName.value || this.form.controls.stationLocation.value || 'esta gasolinera',
        };
      }
    }
    if (logs.length > 0) {
      const latest = [...logs].sort((a, b) => b.date.localeCompare(a.date))[0];
      return { value: latest.pricePerLiter, type: 'PREVIOUS_FILL' as const, label: 'tu último repostaje' };
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
      label: reference.type === 'STATION_AVERAGE' ? `tu media en ${reference.label}` : reference.label,
    };
  });

  constructor() {
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

  submit(): void {
    if (this.saving()) return;
    this.error.set(null);
    const vehicle = this.store.selected();
    if (!vehicle) {
      this.error.set('Añade un coche antes de registrar un repostaje.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const odometer = Number(value.odometer);
    if (odometer < vehicle.currentOdometer) {
      this.error.set(`El odómetro no puede ser inferior al actual: ${km(vehicle.currentOdometer)}.`);
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
            this.toast.info('Repostaje guardado en el dispositivo. Se sincronizará al volver online.');
          } else if (log.savings?.savingsAmount && log.savings.savingsAmount > 0) {
            this.toast.success(log.savings.message);
          } else {
            this.toast.success('Repostaje registrado. Ya estamos calculando consumo y ahorro.');
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
    if (control.errors?.['required']) return 'Este campo es obligatorio.';
    if (control.errors?.['min']) return 'Introduce un valor válido.';
    if (control.errors?.['belowCurrent']) return 'El odómetro no puede bajar del actual.';
    return 'Revisa este campo.';
  }

  private loadLogs(vehicleId: number): void {
    this.fuelService.list(vehicleId).subscribe({
      next: (logs) => this.logs.set(logs),
      error: () => this.logs.set([]),
    });
  }
}
