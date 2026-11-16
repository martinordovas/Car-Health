import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin, of, catchError } from 'rxjs';
import {
  categoryLabel,
  categoryTone,
  dateMedium,
  decimal,
  errorMessage,
  km,
  money,
  performedByLabel,
  remainingDays,
  remainingKm,
  ruleName,
  statusLabel,
  statusTone,
} from '../../core/format';
import { I18nService } from '../../core/i18n.service';
import { MaintenanceService } from '../../core/maintenance.service';
import type { MaintenanceRule, ServiceRecord } from '../../core/models';
import { OfflineQueueService } from '../../core/offline-queue.service';
import { ServiceRecordService } from '../../core/service-record.service';
import { ToastService } from '../../core/toast.service';
import { VehicleStore } from '../../core/vehicle-store.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state';
import { IconComponent } from '../../shared/icon/icon';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { PageHeaderComponent } from '../../shared/page-header/page-header';

type Tab = 'plan' | 'history';

@Component({
  selector: 'app-maintenance-page',
  imports: [RouterLink, IconComponent, PageHeaderComponent, EmptyStateComponent, TranslatePipe],
  templateUrl: './maintenance-page.html',
})
export class MaintenancePageComponent {
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly i18n = inject(I18nService);
  private readonly serviceRecordService = inject(ServiceRecordService);
  private readonly queue = inject(OfflineQueueService);
  private readonly toast = inject(ToastService);
  readonly store = inject(VehicleStore);

  readonly vehicleName = computed(
    () => this.store.selected()?.name ?? this.i18n.t('common.yourCar'),
  );
  readonly rules = signal<MaintenanceRule[]>([]);
  readonly records = signal<ServiceRecord[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly tab = signal<Tab>('plan');
  readonly expanded = signal<Set<number>>(new Set());
  private currentVehicleId: number | null = null;

  protected readonly money = money;
  protected readonly km = km;
  protected readonly decimal = decimal;
  protected readonly categoryLabel = categoryLabel;
  protected readonly categoryTone = categoryTone;
  protected readonly performedByLabel = performedByLabel;
  protected readonly ruleName = ruleName;
  protected readonly statusLabel = statusLabel;
  protected readonly statusTone = statusTone;
  protected readonly remainingKm = remainingKm;
  protected readonly remainingDays = remainingDays;
  protected readonly dateMedium = dateMedium;

  readonly displayRecords = computed(() => {
    const vehicle = this.store.selected();
    if (!vehicle) return [];
    const pending = this.queue
      .itemsFor(vehicle.id, 'service')
      .map((item) => item.preview as ServiceRecord);
    return [...pending, ...this.records()].sort((a, b) => b.date.localeCompare(a.date));
  });

  readonly totalSpent = computed(() =>
    this.displayRecords().reduce((sum, record) => sum + record.totalCost, 0),
  );
  readonly overdueCount = computed(
    () => this.rules().filter((rule) => rule.status === 'OVERDUE').length,
  );
  readonly soonCount = computed(
    () => this.rules().filter((rule) => rule.status === 'DUE_SOON').length,
  );
  readonly nextRule = computed(
    () =>
      this.rules().find((rule) => rule.status === 'OVERDUE' || rule.status === 'DUE_SOON') ??
      this.rules()[0] ??
      null,
  );

  constructor() {
    effect(() => {
      const vehicle = this.store.selected();
      this.queue.version();
      if (!vehicle) {
        this.rules.set([]);
        this.records.set([]);
        return;
      }
      untracked(() => this.load(vehicle.id));
    });
  }

  load(vehicleId: number): void {
    this.currentVehicleId = vehicleId;
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      rules: this.maintenanceService.list(vehicleId).pipe(catchError(() => of([]))),
      records: this.serviceRecordService.list(vehicleId),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ rules, records }) => {
          this.rules.set(rules);
          this.records.set(records);
        },
        error: (error: unknown) => {
          this.error.set(errorMessage(error));
          this.toast.error(errorMessage(error));
        },
      });
  }

  retry(): void {
    if (this.currentVehicleId) this.load(this.currentVehicleId);
  }

  toggleRecord(id: number): void {
    this.expanded.update((set) => {
      const copy = new Set(set);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  isExpanded(id: number): boolean {
    return this.expanded().has(id);
  }

  progress(rule: MaintenanceRule): number {
    const vehicle = this.store.selected();
    if (!vehicle || !rule.intervalKm) return 0;
    const base = rule.lastServiceOdometer ?? rule.baselineOdometer ?? 0;
    const target = base + rule.intervalKm;
    return Math.min(100, Math.max(0, ((vehicle.currentOdometer - base) / (target - base)) * 100));
  }

  recordIcon(record: ServiceRecord): 'wrench' | 'shield' | 'sparkles' | 'file-text' {
    switch (record.category) {
      case 'CORRECTIVE':
        return 'wrench';
      case 'LEGAL':
        return 'file-text';
      case 'MODIFICATION':
        return 'sparkles';
      default:
        return 'shield';
    }
  }

  partsCount(record: ServiceRecord): number {
    return record.parts?.length ?? 0;
  }
}
