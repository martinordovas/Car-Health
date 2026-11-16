import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  categoryLabel,
  consumption,
  dateShort,
  decimal,
  errorMessage,
  money,
  price,
  moneyCompact,
} from '../../core/format';
import { I18nService } from '../../core/i18n.service';
import type { ServiceCategory, StationStats, VehicleStats } from '../../core/models';
import { OfflineQueueService } from '../../core/offline-queue.service';
import { StatsService } from '../../core/stats.service';
import { ToastService } from '../../core/toast.service';
import { VehicleStore } from '../../core/vehicle-store.service';
import { DonutChartComponent, type DonutSegment } from '../../shared/charts/donut-chart';
import { LineChartComponent, type LinePoint } from '../../shared/charts/line-chart';
import { SpendChartComponent } from '../../shared/charts/spend-chart';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state';
import { IconComponent } from '../../shared/icon/icon';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { PageHeaderComponent } from '../../shared/page-header/page-header';
import { StatCardComponent } from '../../shared/stat-card/stat-card';

@Component({
  selector: 'app-stats-page',
  imports: [
    RouterLink,
    IconComponent,
    PageHeaderComponent,
    StatCardComponent,
    SpendChartComponent,
    LineChartComponent,
    DonutChartComponent,
    EmptyStateComponent,
    TranslatePipe,
  ],
  templateUrl: './stats-page.html',
})
export class StatsPageComponent {
  private readonly statsService = inject(StatsService);
  private readonly i18n = inject(I18nService);
  private readonly queue = inject(OfflineQueueService);
  private readonly toast = inject(ToastService);
  readonly store = inject(VehicleStore);
  readonly vehicleName = computed(
    () => this.store.selected()?.name ?? this.i18n.t('common.yourCar'),
  );

  readonly stats = signal<VehicleStats | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  private currentVehicleId: number | null = null;

  protected readonly money = money;
  protected readonly moneyCompact = moneyCompact;
  protected readonly consumption = consumption;
  protected readonly price = price;
  protected readonly decimal = decimal;
  protected readonly dateShort = dateShort;
  protected readonly categoryLabel = categoryLabel;

  private readonly categoryColors: Record<ServiceCategory, string> = {
    PREVENTIVE: 'var(--ch-brand)',
    CORRECTIVE: 'var(--ch-danger)',
    LEGAL: 'var(--ch-warning)',
    MODIFICATION: 'var(--ch-info)',
  };

  readonly hasData = computed(() => {
    const totals = this.stats()?.totals;
    return !!totals && (totals.fillCount > 0 || totals.serviceCount > 0);
  });

  readonly avgMonthly = computed(() => {
    const monthly = this.stats()?.monthly ?? [];
    const sum = monthly.reduce((total, month) => total + month.totalSpent, 0);
    return sum / 12;
  });

  readonly consumptionData = computed<LinePoint[]>(() => {
    this.i18n.locale();
    return (this.stats()?.consumption ?? []).map((point) => ({
      label: dateShort(point.date),
      value: point.value,
    }));
  });

  readonly priceData = computed<LinePoint[]>(() => {
    this.i18n.locale();
    return (this.stats()?.prices ?? []).map((point) => ({
      label: dateShort(point.date),
      value: point.value,
    }));
  });

  readonly categorySegments = computed<DonutSegment[]>(() => {
    this.i18n.locale();
    return (this.stats()?.categories ?? []).map((category) => ({
      label: categoryLabel(category.category),
      value: category.total,
      color: this.categoryColors[category.category] ?? 'var(--ch-faint)',
    }));
  });

  readonly stationsByPrice = computed<StationStats[]>(() =>
    [...(this.stats()?.stations ?? [])].sort((a, b) => a.avgPrice - b.avgPrice),
  );

  readonly bestSavingsStation = computed(() =>
    [...(this.stats()?.stations ?? [])].sort((a, b) => b.totalSavings - a.totalSavings)[0] ?? null,
  );

  readonly servicePercent = computed(() => {
    const totals = this.stats()?.totals;
    if (!totals || totals.totalSpent <= 0) return 0;
    return (totals.serviceSpent / totals.totalSpent) * 100;
  });

  constructor() {
    effect(() => {
      const vehicle = this.store.selected();
      this.queue.version();
      if (!vehicle) {
        this.stats.set(null);
        return;
      }
      untracked(() => this.load(vehicle.id));
    });
  }

  load(vehicleId: number): void {
    this.currentVehicleId = vehicleId;
    this.loading.set(true);
    this.error.set(null);
    this.statsService
      .get(vehicleId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: (error: unknown) => {
          this.error.set(errorMessage(error));
          this.toast.error(errorMessage(error));
        },
      });
  }

  retry(): void {
    if (this.currentVehicleId) this.load(this.currentVehicleId);
  }
}
