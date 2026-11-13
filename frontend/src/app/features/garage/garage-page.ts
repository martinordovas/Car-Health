import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ConnectivityService } from '../../core/connectivity.service';
import { DossierService } from '../../core/dossier.service';
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
import { ModalComponent } from '../../shared/modal/modal';
import { PageHeaderComponent } from '../../shared/page-header/page-header';
import { VehicleVisualComponent } from '../../shared/vehicle-visual/vehicle-visual';

@Component({
  selector: 'app-garage-page',
  imports: [ReactiveFormsModule, IconComponent, PageHeaderComponent, ModalComponent, VehicleVisualComponent],
  templateUrl: './garage-page.html',
})
export class GaragePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dossier = inject(DossierService);
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

  readonly fuelTypes: { value: FuelType; label: string }[] = [
    { value: 'GASOLINE_95', label: 'Gasolina 95' },
    { value: 'GASOLINE_98', label: 'Gasolina 98' },
    { value: 'DIESEL', label: 'Diésel' },
    { value: 'HYBRID', label: 'Híbrido' },
    { value: 'PLUG_IN_HYBRID', label: 'Híbrido enchufable' },
    { value: 'ELECTRIC', label: 'Eléctrico' },
    { value: 'LPG', label: 'GLP' },
    { value: 'OTHER', label: 'Otro' },
  ];

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
    });
    this.modalOpen.set(true);
  }

  openEdit(vehicle: Vehicle): void {
    this.editing.set(vehicle);
    this.formError.set(null);
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
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.formError.set(null);
  }

  saveVehicle(): void {
    if (this.saving()) return;
    if (!this.connectivity.online()) {
      this.formError.set('Necesitas conexión para crear o editar un vehículo. El resto de registros sí funcionan offline.');
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
    };
    this.saving.set(true);
    this.formError.set(null);
    const editing = this.editing();
    const request = editing ? this.store.update(editing.id, input) : this.store.create(input);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (vehicle) => {
        this.modalOpen.set(false);
        this.toast.success(editing ? 'Coche actualizado.' : `${vehicle.name} ya está en tu garaje.`);
      },
      error: (error: unknown) => {
        this.formError.set(errorMessage(error));
      },
    });
  }

  deleteVehicle(): void {
    const vehicle = this.editing();
    if (!vehicle) return;
    const confirmed = window.confirm(
      `¿Eliminar ${vehicle.name}? Se borrarán también todos sus repostajes y mantenimientos. Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    this.saving.set(true);
    this.store
      .remove(vehicle.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.modalOpen.set(false);
          this.toast.success('Vehículo eliminado.');
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
    if (control.errors?.['required']) return 'Obligatorio.';
    if (control.errors?.['min'] || control.errors?.['max']) return 'Valor fuera de rango.';
    if (control.errors?.['maxlength']) return 'Demasiado largo.';
    return 'Revisa este campo.';
  }

  updateProfileName(event: Event): void {
    this.profileName.set((event.target as HTMLInputElement).value);
  }

  saveProfile(): void {
    const name = this.profileName().trim();
    if (name.length < 1) {
      this.toast.error('El nombre no puede estar vacío.');
      return;
    }
    this.profileSaving.set(true);
    this.auth
      .updateProfile(name)
      .pipe(finalize(() => this.profileSaving.set(false)))
      .subscribe({
        next: () => this.toast.success('Perfil actualizado.'),
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
      this.passwordError.set('Las contraseñas nuevas no coinciden.');
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
          this.toast.success('Contraseña actualizada.');
        },
        error: (error: unknown) => this.passwordError.set(errorMessage(error)),
      });
  }

  downloadDossier(vehicle: Vehicle): void {
    if (!this.connectivity.online()) {
      this.toast.error('Necesitas conexión para descargar el dossier PDF.');
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
    const confirmed = window.confirm('¿Descartar este cambio pendiente? No se enviará al servidor.');
    if (!confirmed) return;
    void this.queue.discard(item.id);
    this.toast.info('Cambio descartado.');
  }

  logout(): void {
    if (this.queue.pendingCount() > 0) {
      const confirmed = window.confirm('Tienes cambios pendientes. Se guardarán en este dispositivo y se sincronizarán al volver a entrar. ¿Cerrar sesión?');
      if (!confirmed) return;
    }
    this.auth.logout();
  }
}
