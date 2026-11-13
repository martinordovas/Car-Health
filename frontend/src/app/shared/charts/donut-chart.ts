import { Component, computed, input } from '@angular/core';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-donut-chart',
  template: `
    <div class="relative size-40 shrink-0">
      <div class="absolute inset-0 rounded-full" [style.background]="gradient()"></div>
      <div class="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-surface">
        <span class="metric-value text-xl">{{ centerValue() }}</span>
        @if (centerLabel()) {
          <span class="mt-0.5 text-center text-[9px] font-bold uppercase tracking-[0.1em] text-faint">{{ centerLabel() }}</span>
        }
      </div>
    </div>
  `,
})
export class DonutChartComponent {
  readonly segments = input<DonutSegment[]>([]);
  readonly centerValue = input('');
  readonly centerLabel = input('');

  readonly gradient = computed(() => {
    const segments = this.segments().filter((segment) => segment.value > 0);
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    if (total <= 0) {
      return 'conic-gradient(var(--ch-surface-strong) 0 100%)';
    }
    let cursor = 0;
    const stops: string[] = [];
    for (const segment of segments) {
      const next = cursor + (segment.value / total) * 100;
      stops.push(`${segment.color} ${cursor.toFixed(2)}% ${next.toFixed(2)}%`);
      cursor = next;
    }
    return `conic-gradient(${stops.join(', ')})`;
  });
}
