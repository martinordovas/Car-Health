import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ConnectivityService } from '../../core/connectivity.service';
import { DossierService } from '../../core/dossier.service';
import { I18nService } from '../../core/i18n.service';
import {
  dateMedium,
  dateTime,
  errorMessage,
  fuelName,
  initials,
  km,
  money,
} from '../../core/format';
import type { FuelType, QueuedMutation, Vehicle, VehicleInput } from '../../core/models';
import { OfflineQueueService } from '../../core/offline-queue.service';
import { SessionService } from '../../core/session.service';
import { ThemeService } from '../../core/theme.service';
import { ToastService } from '../../core/toast.service';
import { VehicleStore } from '../../core/vehicle-store.service';
import { IconComponent } from '../../shared/icon/icon';
import { LanguageToggleComponent } from '../../shared/i18n/language-toggle';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { ModalComponent } from '../../shared/modal/modal';
import { PageHeaderComponent } from '../../shared/page-header/page-header';
import { VehicleVisualComponent } from '../../shared/vehicle-visual/vehicle-visual';

@Component({
  selector: 'app-garage-page',
  imports: [
    ReactiveFormsModule,
    IconComponent,
    LanguageToggleComponent,
    PageHeaderComponent,
    ModalComponent,
    TranslatePipe,
    VehicleVisualComponent,
  ],
  templateUrl: './garage-page.html',
})
export class GaragePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dossier = inject(DossierService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  readonly store = inject(VehicleStore);
  readonly session = inject(SessionService);
  readonly queue = inject(OfflineQueueService);
  readonly connectivity = inject(ConnectivityService);
  readonly theme = inject(ThemeService);

  readonly modalOpen = signal(false);
  readonly editing = signal<Vehicle | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly downloading = signal<number | null>(null);
  readonly profileName = signal(this.session.user()?.displayName ?? '');
  readonly profileSaving = signal(false);
  readonly passwordOpen = signal(false);
  readonly passwordSaving = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly photoProcessing = signal(false);
  readonly photoError = signal<string | null>(null);

  readonly fuelTypes = computed<{ value: FuelType; label: string }[]>(() => {
    this.i18n.locale();
    return [
      { value: 'GASOLINE_95', label: this.i18n.t('labels.fuelType.GASOLINE_95') },
      { value: 'GASOLINE_98', label: this.i18n.t('labels.fuelType.GASOLINE_98') },
      { value: 'DIESEL', label: this.i18n.t('labels.fuelType.DIESEL') },
      { value: 'HYBRID', label: this.i18n.t('labels.fuelType.HYBRID') },
      { value: 'PLUG_IN_HYBRID', label: this.i18n.t('labels.fuelType.PLUG_IN_HYBRID') },
      { value: 'ELECTRIC', label: this.i18n.t('labels.fuelType.ELECTRIC') },
      { value: 'LPG', label: this.i18n.t('labels.fuelType.LPG') },
      { value: 'OTHER', label: this.i18n.t('labels.fuelType.OTHER') },
    ];
  });

  protected readonly initials = initials;
  protected readonly km = km;
  protected readonly money = money;
  protected readonly fuelName = fuelName;
  protected readonly dateMedium = dateMedium;
  protected readonly dateTime = dateTime;

  readonly form = this.fb.group({
    nickname: [''],
    brand: ['', [Validators.required, Validators.maxLength(60)]],
    model: ['', [Validators.required, Validators.maxLength(80)]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(1950), Validators.max(2100)]],
    currentOdometer: [0, [Validators.required, Validators.min(0)]],
    licensePlate: ['', [Validators.maxLength(20)]],
    fuelType: ['GASOLINE_95' as FuelType, [Validators.required]],
    color: ['', [Validators.maxLength(32)]],
    engineCode: ['', [Validators.maxLength(40)]],
    vin: ['', [Validators.maxLength(40)]],
    purchaseDate: [''],
    purchasePrice: [null as number | null],
    photoData: [''],
  });

  readonly passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  readonly otherVehicles = computed(() => this.store.vehicles());
  readonly queueItems = computed(() => this.queue.visibleMutations());

  openAdd(): void {
    this.editing.set(null);
    this.formError.set(null);
    this.photoError.set(null);
    this.form.reset({
      nickname: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      currentOdometer: 0,
      licensePlate: '',
      fuelType: 'GASOLINE_95',
      color: '',
      engineCode: '',
      vin: '',
      purchaseDate: '',
      purchasePrice: null,
      photoData: '',
    });
    this.modalOpen.set(true);
  }

  openEdit(vehicle: Vehicle): void {
    this.editing.set(vehicle);
    this.formError.set(null);
    this.photoError.set(null);
    this.form.reset({
      nickname: vehicle.nickname ?? '',
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      currentOdometer: vehicle.currentOdometer,
      licensePlate: vehicle.licensePlate ?? '',
      fuelType: vehicle.fuelType,
      color: vehicle.color ?? '',
      engineCode: vehicle.engineCode ?? '',
      vin: vehicle.vin ?? '',
      purchaseDate: vehicle.purchaseDate ?? '',
      purchasePrice: vehicle.purchasePrice ?? null,
      photoData: vehicle.photoData ?? '',
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.formError.set(null);
    this.photoError.set(null);
  }

  saveVehicle(): void {
    if (this.saving()) return;
    if (!this.connectivity.online()) {
      this.formError.set(this.i18n.t('garage.errorOfflineVehicle'));
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const input: VehicleInput = {
      brand: (value.brand ?? '').trim(),
      model: (value.model ?? '').trim(),
      year: Number(value.year),
      nickname: (value.nickname ?? '').trim() || null,
      currentOdometer: Number(value.currentOdometer),
      licensePlate: (value.licensePlate ?? '').trim() || null,
      fuelType: value.fuelType as FuelType,
      color: (value.color ?? '').trim() || null,
      engineCode: (value.engineCode ?? '').trim() || null,
      vin: (value.vin ?? '').trim() || null,
      purchaseDate: value.purchaseDate || null,
      purchasePrice: value.purchasePrice ? Number(value.purchasePrice) : null,
      photoData: value.photoData || null,
    };
    this.saving.set(true);
    this.formError.set(null);
    const editing = this.editing();
    const request = editing ? this.store.update(editing.id, input) : this.store.create(input);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (vehicle) => {
        this.modalOpen.set(false);
        this.toast.success(
          editing
            ? this.i18n.t('garage.toastUpdated')
            : this.i18n.t('garage.toastCreated', { vehicle: vehicle.name }),
        );
      },
      error: (error: unknown) => {
        this.formError.set(errorMessage(error));
      },
    });
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.photoError.set(null);
    if (!file.type.startsWith('image/')) {
      this.photoError.set(this.i18n.t('garage.errorPhotoType'));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      this.photoError.set(this.i18n.t('garage.errorPhotoSize'));
      return;
    }

    this.photoProcessing.set(true);
    try {
      const photo = await this.optimizePhoto(file);
      this.form.controls.photoData.setValue(photo);
    } catch (error) {
      this.photoError.set(
        error instanceof Error ? error.message : this.i18n.t('garage.errorPhotoProcess'),
      );
    } finally {
      this.photoProcessing.set(false);
    }
  }

  removePhoto(): void {
    this.form.controls.photoData.setValue('');
    this.photoError.set(null);
  }

  private async optimizePhoto(file: File): Promise<string> {
    const source = await this.readFile(file);
    const image = await this.loadImage(source);
    const maxWidth = 1600;
    const maxHeight = 1100;
    const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error(this.i18n.t('garage.errorPhotoBrowser'));
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let quality = 0.86;
    let result = canvas.toDataURL('image/jpeg', quality);
    while (result.length > 900_000 && quality > 0.45) {
      quality -= 0.08;
      result = canvas.toDataURL('image/jpeg', quality);
    }
    if (result.length > 1_000_000) {
      throw new Error(this.i18n.t('garage.errorPhotoBig'));
    }
    return result;
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error(this.i18n.t('garage.errorPhotoRead')));
      reader.readAsDataURL(file);
    });
  }

  private loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(this.i18n.t('garage.errorPhotoInvalid')));
      image.src = source;
    });
  }

  deleteVehicle(): void {
    const vehicle = this.editing();
    if (!vehicle) return;
    const confirmed = window.confirm(
      this.i18n.t('garage.confirmDelete', { vehicle: vehicle.name }),
    );
    if (!confirmed) return;
    this.saving.set(true);
    this.store
      .remove(vehicle.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.modalOpen.set(false);
          this.toast.success(this.i18n.t('garage.toastDeleted'));
          if (!this.store.hasVehicles()) {
            void this.router.navigate(['/app/garage']);
          }
        },
        error: (error: unknown) => this.formError.set(errorMessage(error)),
      });
  }

  fieldError(name: string): string | null {
    const control = this.form.get(name);
    if (!control || !(control.touched || control.dirty) || !control.invalid) return null;
    if (control.errors?.['required']) return this.i18n.t('garage.errorFieldRequired');
    if (control.errors?.['min'] || control.errors?.['max']) {
      return this.i18n.t('garage.errorFieldRange');
    }
    if (control.errors?.['maxlength']) return this.i18n.t('garage.errorFieldLong');
    return this.i18n.t('garage.errorFieldReview');
  }

  updateProfileName(event: Event): void {
    this.profileName.set((event.target as HTMLInputElement).value);
  }

  saveProfile(): void {
    const name = this.profileName().trim();
    if (name.length < 1) {
      this.toast.error(this.i18n.t('garage.errorNameEmpty'));
      return;
    }
    this.profileSaving.set(true);
    this.auth
      .updateProfile(name)
      .pipe(finalize(() => this.profileSaving.set(false)))
      .subscribe({
        next: () => this.toast.success(this.i18n.t('garage.toastProfile')),
        error: (error: unknown) => this.toast.error(errorMessage(error)),
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const value = this.passwordForm.getRawValue();
    if (value.newPassword !== value.confirmPassword) {
      this.passwordError.set(this.i18n.t('garage.errorPasswords'));
      return;
    }
    this.passwordSaving.set(true);
    this.passwordError.set(null);
    this.auth
      .changePassword(value.currentPassword ?? '', value.newPassword ?? '')
      .pipe(finalize(() => this.passwordSaving.set(false)))
      .subscribe({
        next: () => {
          this.passwordOpen.set(false);
          this.passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
          this.toast.success(this.i18n.t('garage.toastPassword'));
        },
        error: (error: unknown) => this.passwordError.set(errorMessage(error)),
      });
  }

  downloadDossier(vehicle: Vehicle): void {
    if (!this.connectivity.online()) {
      this.toast.error(this.i18n.t('garage.errorDossierOffline'));
      return;
    }
    this.downloading.set(vehicle.id);
    this.dossier
      .download(vehicle.id, vehicle.licensePlate)
      .pipe(finalize(() => this.downloading.set(null)))
      .subscribe({
        error: (error: unknown) => this.toast.error(errorMessage(error)),
      });
  }

  queueDate(createdAt: number): string {
    return dateTime(new Date(createdAt).toISOString());
  }

  syncNow(): void {
    void this.queue.flush();
  }

  retryQueueItem(item: QueuedMutation): void {
    void this.queue.retry(item.id);
  }

  discardQueueItem(item: QueuedMutation): void {
    const confirmed = window.confirm(this.i18n.t('garage.confirmDiscard'));
    if (!confirmed) return;
    void this.queue.discard(item.id);
    this.toast.info(this.i18n.t('garage.toastDiscarded'));
  }

  logout(): void {
    if (this.queue.pendingCount() > 0) {
      const confirmed = window.confirm(this.i18n.t('garage.confirmLogout'));
      if (!confirmed) return;
    }
    this.auth.logout();
  }
}
