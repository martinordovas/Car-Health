import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  consumption,
  dateMedium,
  decimal,
  errorMessage,
  km,
  liters as formatLiters,
  money,
  price,
} from '../../core/format';
import { FuelService } from '../../core/fuel.service';
import type { FuelLog } from '../../core/models';
import { OfflineQueueService } from '../../core/offline-queue.service';
import { ToastService } from '../../core/toast.service';
import { VehicleStore } from '../../core/vehicle-store.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state';
import { IconComponent } from '../../shared/icon/icon';
import { PageHeaderComponent } from '../../shared/page-header/page-header';

interface MonthGroup {
  key: string;
  label: string;
  total: number;
  logs: FuelLog[];
}

@Component({
  selector: 'app-fuel-list-page',
  imports: [RouterLink, IconComponent, PageHeaderComponent, EmptyStateComponent],
  templateUrl: './fuel-list-page.html',
})
export class FuelListPageComponent {
  private readonly fuelService = inject(FuelService);
  readonly store = inject(VehicleStore);
  private readonly queue = inject(OfflineQueueService);
  private readonly toast = inject(ToastService);

  readonly logs = signal<FuelLog[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  private currentVehicleId: number | null = null;

  protected readonly money = money;
  protected readonly price = price;
  protected readonly km = km;
  protected readonly decimal = decimal;
  protected readonly consumption = consumption;
  protected readonly dateMedium = dateMedium;
  protected readonly formatLiters = formatLiters;

  readonly displayLogs = computed(() => {
    const vehicle = this.store.selected();
    if (!vehicle) return [];
    const pending = this.queue
      .itemsFor(vehicle.id, 'fuel')
      .map((item) => item.preview as FuelLog)
      .sort((a, b) => b.date.localeCompare(a.date));
    return [...pending, ...this.logs()].sort((a, b) => b.date.localeCompare(a.date));
  });

  readonly groups = computed<MonthGroup[]>(() => {
    const groups = new Map<string, MonthGroup>();
    const formatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
    for (const log of this.displayLogs()) {
      const date = new Date(log.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      let group = groups.get(key);
      if (!group) {
        const label = formatter.format(date);
        group = { key, label: label.charAt(0).toUpperCase() + label.slice(1), total: 0, logs: [] };
        groups.set(key, group);
      }
      group.logs.push(log);
      group.total += log.totalCost;
    }
    return [...groups.values()];
  });

  readonly totalSpent = computed(() => this.displayLogs().reduce((sum, log) => sum + log.totalCost, 0));
  readonly totalLiters = computed(() => this.displayLogs().reduce((sum, log) => sum + log.liters, 0));
  readonly totalSavings = computed(() =>
    this.displayLogs().reduce((sum, log) => sum + (log.savings?.savingsAmount ?? 0), 0),
  );
  readonly avgPrice = computed(() => {
    const liters = this.totalLiters();
    return liters > 0 ? this.totalSpent() / liters : null;
  });
  readonly avgConsumption = computed(() => {
    const values = this.displayLogs()
      .map((log) => log.consumption)
      .filter((value): value is number => value !== null && value !== undefined);
    if (!values.length) return null;
    return values.slice(0, 6).reduce((sum, value) => sum + value, 0) / Math.min(values.length, 6);
  });
  readonly pendingCount = computed(() => this.queue.itemsFor(this.store.selected()?.id ?? 0, 'fuel').length);

  constructor() {
    effect(() => {
      const vehicle = this.store.selected();
      this.queue.version();
      if (!vehicle) {
        this.logs.set([]);
        return;
      }
      if (vehicle.id === this.currentVehicleId) {
        // Los cambios en la cola ya actualizan la lista mediante displayLogs.
      }
      untracked(() => this.load(vehicle.id));
    });
  }

  load(vehicleId: number): void {
    this.currentVehicleId = vehicleId;
    this.loading.set(true);
    this.error.set(null);
    this.fuelService
      .list(vehicleId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (logs) => this.logs.set(logs),
        error: (error: unknown) => {
          this.error.set(errorMessage(error));
          this.toast.error(errorMessage(error));
        },
      });
  }

  retry(): void {
    if (this.currentVehicleId) this.load(this.currentVehicleId);
  }

  savingsLabel(log: FuelLog): string | null {
    if (!log.savings || log.savings.savingsAmount <= 0) return null;
    return `Ahorro ${money(log.savings.savingsAmount)}`;
  }
}
