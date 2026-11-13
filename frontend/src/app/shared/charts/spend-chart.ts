import { Component, computed, input } from '@angular/core';
import type { MonthlyPoint } from '../../core/models';
import { money } from '../../core/format';

interface BarPoint {
  label: string;
  total: number;
  height: number;
  fuelPct: number;
  servicePct: number;
}

@Component({
  selector: 'app-spend-chart',
  template: `
    <div class="flex h-48 items-end gap-1.5 sm:gap-2.5">
      @for (point of points(); track point.label + $index) {
        <div class="group flex h-full min-w-0 flex-1 flex-col justify-end">
          <div class="relative flex h-full flex-col justify-end">
            <div
              class="relative w-full overflow-hidden rounded-t-[5px] bg-surface-strong transition-all duration-500"
              [style.height.%]="point.height"
              [attr.title]="point.label + ': ' + money(point.total)"
            >
              @if (point.total > 0) {
                <div class="absolute inset-x-0 top-0 bg-accent" [style.height.%]="point.fuelPct"></div>
                <div class="absolute inset-x-0 bottom-0 bg-brand" [style.height.%]="point.servicePct"></div>
              }
            </div>
            <div
              class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[10px] font-semibold text-canvas opacity-0 shadow-float transition-opacity group-hover:opacity-100"
            >
              {{ money(point.total) }}
            </div>
          </div>
          <span class="mt-2 overflow-hidden text-center text-[9px] font-semibold uppercase tracking-[0.02em] text-faint">{{ point.label }}</span>
        </div>
      }
    </div>
    <div class="mt-4 flex items-center gap-4 text-[11px] font-medium text-muted">
      <span class="inline-flex items-center gap-1.5"><span class="size-2 rounded-full bg-accent"></span>Combustible</span>
      <span class="inline-flex items-center gap-1.5"><span class="size-2 rounded-full bg-brand"></span>Mantenimiento</span>
    </div>
  `,
})
export class SpendChartComponent {
  readonly data = input<MonthlyPoint[]>([]);
  protected readonly money = money;

  readonly points = computed<BarPoint[]>(() => {
    const data = this.data();
    const max = Math.max(...data.map((point) => point.totalSpent), 1);
    return data.map((point) => {
      const total = point.totalSpent;
      const height = total > 0 ? Math.max((total / max) * 100, 3) : 1.5;
      const fuelPct = total > 0 ? (point.fuelSpent / total) * 100 : 0;
      const servicePct = total > 0 ? (point.serviceSpent / total) * 100 : 0;
      return {
        label: point.label,
        total,
        height,
        fuelPct,
        servicePct,
      };
    });
  });
}
