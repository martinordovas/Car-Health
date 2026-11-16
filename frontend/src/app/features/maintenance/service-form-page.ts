import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { errorMessage, money, ruleName, todayInputDate, km } from '../../core/format';
import { I18nService } from '../../core/i18n.service';
import { MaintenanceService } from '../../core/maintenance.service';
import type {
  MaintenanceRule,
  PartInput,
  PerformedBy,
  ServiceCategory,
  ServiceRecordInput,
} from '../../core/models';
import { ServiceRecordService } from '../../core/service-record.service';
import { ToastService } from '../../core/toast.service';
import { VehicleStore } from '../../core/vehicle-store.service';
import { IconComponent } from '../../shared/icon/icon';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { PageHeaderComponent } from '../../shared/page-header/page-header';

interface CategoryOption {
  value: ServiceCategory;
  label: string;
  hint: string;
}

@Component({
  selector: 'app-service-form-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, PageHeaderComponent, TranslatePipe],
  templateUrl: './service-form-page.html',
})
export class ServiceFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly i18n = inject(I18nService);
  private readonly serviceRecordService = inject(ServiceRecordService);
  private readonly toast = inject(ToastService);
  readonly store = inject(VehicleStore);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly rules = signal<MaintenanceRule[]>([]);
  readonly vehicleName = computed(
    () => this.store.selected()?.name ?? this.i18n.t('common.yourCar'),
  );

  readonly categories = computed<CategoryOption[]>(() => {
    this.i18n.locale();
    return [
      {
        value: 'PREVENTIVE',
        label: this.i18n.t('serviceForm.categoryPreventive'),
        hint: this.i18n.t('serviceForm.categoryPreventiveHint'),
      },
      {
        value: 'CORRECTIVE',
        label: this.i18n.t('serviceForm.categoryCorrective'),
        hint: this.i18n.t('serviceForm.categoryCorrectiveHint'),
      },
      {
        value: 'MODIFICATION',
        label: this.i18n.t('serviceForm.categoryModification'),
        hint: this.i18n.t('serviceForm.categoryModificationHint'),
      },
      {
        value: 'LEGAL',
        label: this.i18n.t('serviceForm.categoryLegal'),
        hint: this.i18n.t('serviceForm.categoryLegalHint'),
      },
    ];
  });

  readonly performedByOptions = computed<{ value: PerformedBy; label: string; hint: string }[]>(
    () => {
      this.i18n.locale();
      return [
        {
          value: 'DIY',
          label: this.i18n.t('serviceForm.diy'),
          hint: this.i18n.t('serviceForm.diyHint'),
        },
        {
          value: 'WORKSHOP',
          label: this.i18n.t('serviceForm.workshop'),
          hint: this.i18n.t('serviceForm.workshopHint'),
        },
      ];
    },
  );

  protected readonly money = money;
  protected readonly km = km;
  protected readonly ruleName = ruleName;

  private readonly queryParams = this.route.snapshot.queryParamMap;
  private readonly preselectedRuleId = Number(this.queryParams.get('ruleId')) || null;

  readonly form = this.fb.group({
    title: [this.queryParams.get('title') ?? '', [Validators.required, Validators.maxLength(140)]],
    date: [todayInputDate(), [Validators.required]],
    odometer: [0, [Validators.required, Validators.min(0)]],
    category: ['PREVENTIVE' as ServiceCategory, [Validators.required]],
    ruleId: [this.preselectedRuleId as number | null],
    performedBy: ['WORKSHOP' as PerformedBy, [Validators.required]],
    laborCost: [0, [Validators.required, Validators.min(0)]],
    notes: ['', [Validators.maxLength(2000)]],
    invoiceFilePath: ['', [Validators.maxLength(500)]],
    parts: this.fb.array([]),
  });

  private readonly formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  private currentVehicleId: number | null = null;

  readonly partsCost = computed(() => {
    this.formValues();
    return this.partGroups().reduce((sum, group) => {
      const quantity = Number(group.get('quantity')?.value ?? 0);
      const unitPrice = Number(group.get('unitPrice')?.value ?? 0);
      return sum + quantity * unitPrice;
    }, 0);
  });

  readonly laborCost = computed(() => {
    this.formValues();
    return Number(this.form.controls.laborCost.value ?? 0);
  });

  readonly total = computed(() => this.laborCost() + this.partsCost());

  readonly selectedRule = computed(() => {
    this.formValues();
    const id = this.form.controls.ruleId.value;
    return this.rules().find((rule) => rule.id === Number(id)) ?? null;
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
        untracked(() => this.loadRules(vehicle.id));
      }
    });
  }

  addPart(): void {
    const group = this.fb.group({
      partName: ['', [Validators.required, Validators.maxLength(140)]],
      oemReference: ['', [Validators.maxLength(80)]],
      brand: ['', [Validators.maxLength(60)]],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
    });
    (this.form.controls.parts as FormArray).push(group);
  }

  removePart(index: number): void {
    (this.form.controls.parts as FormArray).removeAt(index);
  }

  partGroups(): FormGroup[] {
    return (this.form.controls.parts as FormArray).controls as FormGroup[];
  }

  lineTotal(index: number): number {
    const group = this.partGroups()[index];
    if (!group) return 0;
    return Number(group.get('quantity')?.value ?? 0) * Number(group.get('unitPrice')?.value ?? 1);
  }

  partError(index: number, field: string): string | null {
    const control = this.partGroups()[index]?.get(field);
    if (!control || !(control.touched || control.dirty) || !control.invalid) return null;
    if (control.errors?.['required']) return this.i18n.t('garage.errorFieldRequired');
    if (control.errors?.['min']) return this.i18n.t('common.invalidValue');
    return this.i18n.t('common.reviewField');
  }

  setPerformedBy(value: PerformedBy): void {
    this.form.controls.performedBy.setValue(value);
  }

  setCategory(value: ServiceCategory): void {
    this.form.controls.category.setValue(value);
  }

  categoryIcon(
    value: ServiceCategory | null | undefined,
  ): 'shield' | 'wrench' | 'sparkles' | 'file-text' {
    switch (value) {
      case 'CORRECTIVE':
        return 'wrench';
      case 'MODIFICATION':
        return 'sparkles';
      case 'LEGAL':
        return 'file-text';
      default:
        return 'shield';
    }
  }

  applyRule(): void {
    const rule = this.rules().find(
      (candidate) => candidate.id === Number(this.form.controls.ruleId.value),
    );
    if (!rule) return;
    if (!(this.form.controls.title.value ?? '').trim()) {
      this.form.controls.title.setValue(ruleName(rule.name));
    }
    this.form.controls.category.setValue(rule.category);
  }

  fieldError(name: string): string | null {
    const control = this.form.get(name);
    if (!control || !(control.touched || control.dirty) || !control.invalid) return null;
    if (control.errors?.['required']) return this.i18n.t('common.required');
    if (control.errors?.['min']) return this.i18n.t('common.invalidValue');
    if (control.errors?.['maxlength']) return this.i18n.t('common.tooLong');
    return this.i18n.t('common.reviewField');
  }

  submit(): void {
    if (this.saving()) return;
    this.error.set(null);
    const vehicle = this.store.selected();
    if (!vehicle) {
      this.error.set(this.i18n.t('serviceForm.noVehicle'));
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(this.i18n.t('serviceForm.reviewFields'));
      return;
    }

    const value = this.form.getRawValue();
    const parts: PartInput[] = this.partGroups()
      .filter((group) => String(group.get('partName')?.value ?? '').trim().length > 0)
      .map((group) => ({
        partName: String(group.get('partName')?.value).trim(),
        oemReference: String(group.get('oemReference')?.value ?? '').trim() || null,
        brand: String(group.get('brand')?.value ?? '').trim() || null,
        quantity: Number(group.get('quantity')?.value ?? 1),
        unitPrice: Number(group.get('unitPrice')?.value ?? 0),
      }));

    const input: ServiceRecordInput = {
      date: value.date ?? todayInputDate(),
      odometer: Number(value.odometer),
      category: value.category as ServiceCategory,
      title: (value.title ?? '').trim(),
      ruleId: value.ruleId ? Number(value.ruleId) : null,
      totalCost: null,
      laborCost: Number(value.laborCost ?? 0),
      performedBy: value.performedBy as PerformedBy,
      notes: (value.notes ?? '').trim() || null,
      invoiceFilePath: (value.invoiceFilePath ?? '').trim() || null,
      parts,
    };

    this.saving.set(true);
    this.serviceRecordService
      .create(vehicle.id, input)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (record) => {
          if (record.pending) {
            this.toast.info(this.i18n.t('serviceForm.toastSavedOffline'));
          } else {
            this.toast.success(this.i18n.t('serviceForm.toastRegistered'));
          }
          void this.router.navigate(['/app/services']);
        },
        error: (error: unknown) => {
          this.error.set(errorMessage(error));
          this.toast.error(errorMessage(error));
        },
      });
  }

  private loadRules(vehicleId: number): void {
    this.maintenanceService.list(vehicleId).subscribe({
      next: (rules) => {
        this.rules.set(rules);
        if (this.preselectedRuleId && !rules.some((rule) => rule.id === this.preselectedRuleId)) {
          this.form.controls.ruleId.setValue(null);
        }
        if (this.preselectedRuleId) this.applyRule();
      },
      error: () => this.rules.set([]),
    });
  }
}
