import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { DashboardService } from '../../core/dashboard.service';
import {
  categoryLabel,
  consumption,
  dateMedium,
  dateShort,
  decimal,
  errorMessage,
  fuelName,
  km,
  money,
  price,
  remainingDays,
  remainingKm,
  ruleName,
  statusLabel,
  statusTone,
} from '../../core/format';
import { I18nService } from '../../core/i18n.service';
import { localeTag } from '../../core/i18n';
import type { Dashboard, MaintenanceRule, VehicleStats } from '../../core/models';
import { StatsService } from '../../core/stats.service';
import { OfflineQueueService } from '../../core/offline-queue.service';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';
import { VehicleStore } from '../../core/vehicle-store.service';
import { SpendChartComponent } from '../../shared/charts/spend-chart';
import { IconComponent } from '../../shared/icon/icon';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { StatCardComponent } from '../../shared/stat-card/stat-card';
import { VehicleVisualComponent } from '../../shared/vehicle-visual/vehicle-visual';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    RouterLink,
    IconComponent,
    StatCardComponent,
    SpendChartComponent,
    TranslatePipe,
    VehicleVisualComponent,
  ],
  templateUrl: './dashboard-page.html',
})
export class DashboardPageComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly statsService = inject(StatsService);
  private readonly toast = inject(ToastService);
  readonly store = inject(VehicleStore);
  readonly session = inject(SessionService);
  readonly i18n = inject(I18nService);
  private readonly queue = inject(OfflineQueueService);

  readonly dashboard = signal<Dashboard | null>(null);
  readonly stats = signal<VehicleStats | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  private currentVehicleId: number | null = null;

  protected readonly money = money;
  protected readonly km = km;
  protected readonly consumption = consumption;
  protected readonly dateMedium = dateMedium;
  protected readonly dateShort = dateShort;
  protected readonly statusTone = statusTone;
  protected readonly statusLabel = statusLabel;
  protected readonly remainingKm = remainingKm;
  protected readonly remainingDays = remainingDays;
  protected readonly categoryLabel = categoryLabel;
  protected readonly fuelName = fuelName;
  protected readonly decimal = decimal;
  protected readonly price = price;
  protected readonly ruleName = ruleName;

  readonly greeting = computed(() => {
    this.i18n.locale();
    const hour = new Date().getHours();
    if (hour < 6) return this.i18n.t('dashboard.greetingNight');
    if (hour < 14) return this.i18n.t('dashboard.greetingMorning');
    return this.i18n.t('dashboard.greetingAfternoon');
  });

  readonly today = computed(() => {
    const tag = localeTag(this.i18n.locale());
    return new Intl.DateTimeFormat(tag, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
  });

  readonly totalFuelSpent = computed(() => this.stats()?.totals.fuelSpent ?? 0);
  readonly totalServiceSpent = computed(() => this.stats()?.totals.serviceSpent ?? 0);
  readonly bestStation = computed(() => this.stats()?.stations?.[0] ?? null);
  readonly nextMaintenance = computed(
    () => this.dashboard()?.upcomingMaintenance?.slice(0, 3) ?? [],
  );

  constructor() {
    effect(() => {
      const vehicleId = this.store.selectedId();
      this.queue.version();
      if (vehicleId === null) {
        this.dashboard.set(null);
        this.stats.set(null);
        return;
      }
      untracked(() => this.load(vehicleId));
    });
  }

  load(vehicleId: number): void {
    this.currentVehicleId = vehicleId;
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      dashboard: this.dashboardService.get(vehicleId),
      stats: this.statsService.get(vehicleId).pipe(catchError(() => of(null))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ dashboard, stats }) => {
          this.dashboard.set(dashboard);
          this.stats.set(stats);
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

  progress(rule: MaintenanceRule): number {
    const vehicle = this.dashboard()?.vehicle;
    if (!vehicle || rule.intervalKm === null || rule.intervalKm === undefined) return 0;
    const base = rule.lastServiceOdometer ?? rule.baselineOdometer ?? 0;
    const target = base + rule.intervalKm;
    if (target <= base) return 0;
    return Math.min(100, Math.max(0, ((vehicle.currentOdometer - base) / (target - base)) * 100));
  }

  ruleHint(rule: MaintenanceRule): string {
    if (rule.remainingKm !== null && rule.remainingKm !== undefined) {
      return remainingKm(rule.remainingKm);
    }
    return remainingDays(rule.remainingDays);
  }

  activityIcon(type: 'FUEL' | 'SERVICE'): 'fuel' | 'wrench' {
    return type === 'FUEL' ? 'fuel' : 'wrench';
  }
}
