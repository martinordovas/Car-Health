import { Component, computed, inject, input, signal } from '@angular/core';
import { consumption, price } from '../../core/format';
import { I18nService } from '../../core/i18n.service';
import { TranslatePipe } from '../i18n/translate.pipe';

export interface LinePoint {
  label: string;
  value: number;
}

interface ChartGeometry {
  line: string;
  area: string;
  points: { x: number; y: number; value: number; label: string }[];
  minLabel: string;
  maxLabel: string;
  firstLabel: string;
  middleLabel: string;
  lastLabel: string;
  hasData: boolean;
}

@Component({
  selector: 'app-line-chart',
  imports: [TranslatePipe],
  template: `
    @if (geometry().hasData) {
      <div class="relative">
        <div
          class="pointer-events-none absolute inset-y-0 -left-1 flex flex-col justify-between py-1 text-[9px] font-medium text-faint"
        >
          <span>{{ geometry().maxLabel }}</span>
          <span>{{ geometry().minLabel }}</span>
        </div>
        <div class="relative ml-7">
          <svg
            class="h-auto w-full cursor-crosshair touch-pan-y"
            viewBox="0 0 600 210"
            role="img"
            [attr.aria-label]="ariaLabel() || ('charts.defaultAria' | t)"
            (pointerdown)="selectNearest($event)"
            (pointermove)="selectNearest($event)"
            (click)="selectNearest($event)"
            (pointerleave)="hidePoint($event)"
            (pointercancel)="hidePoint($event)"
          >
            <defs>
              <linearGradient [attr.id]="fillId" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" [attr.stop-color]="strokeColor()" stop-opacity=".2" />
                <stop offset="100%" [attr.stop-color]="strokeColor()" stop-opacity="0" />
              </linearGradient>
            </defs>
            @for (line of [0, 52, 104, 156]; track line) {
              <line
                x1="0"
                [attr.y1]="line + 18"
                x2="600"
                [attr.y2]="line + 18"
                stroke="var(--ch-line)"
                stroke-width="1"
                stroke-dasharray="3 5"
              />
            }
            @if (activePoint(); as point) {
              <line
                [attr.x1]="point.x"
                y1="18"
                [attr.x2]="point.x"
                y2="185"
                stroke="var(--ch-line)"
                stroke-width="1"
                stroke-dasharray="3 5"
              />
            }
            <path [attr.d]="geometry().area" [attr.fill]="'url(#' + fillId + ')'" />
            <path
              [attr.d]="geometry().line"
              fill="none"
              [attr.stroke]="strokeColor()"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
            />
            @for (point of geometry().points; track $index) {
              <circle
                [attr.cx]="point.x"
                [attr.cy]="point.y"
                r="4"
                fill="var(--ch-surface)"
                [attr.stroke]="strokeColor()"
                stroke-width="2"
                vector-effect="non-scaling-stroke"
              />
            }
            @if (activePoint(); as point) {
              <circle
                [attr.cx]="point.x"
                [attr.cy]="point.y"
                r="7"
                fill="var(--ch-surface)"
                [attr.stroke]="strokeColor()"
                stroke-width="2.5"
                vector-effect="non-scaling-stroke"
              />
            }
          </svg>

          @if (activePoint(); as point) {
            <div
              class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl border border-white/10 bg-ink px-2.5 py-1.5 text-canvas shadow-float"
              [style.left.%]="(point.x / 600) * 100"
              [style.top.%]="(point.y / 210) * 100"
              aria-live="polite"
            >
              <p class="text-[9px] font-semibold uppercase tracking-[0.06em] text-canvas/65">
                {{ point.label }}
              </p>
              <p class="tabular text-xs font-bold">{{ formatValue(point.value) }}</p>
            </div>
          }
        </div>
        <div class="ml-7 mt-2 flex justify-between text-[9px] font-medium text-faint">
          <span>{{ geometry().firstLabel }}</span>
          <span>{{ geometry().middleLabel }}</span>
          <span>{{ geometry().lastLabel }}</span>
        </div>
      </div>
    } @else {
      <div
        class="flex h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface-soft text-center"
      >
        <p class="text-sm font-semibold text-muted">{{ 'charts.noDataTitle' | t }}</p>
        <p class="mt-1 text-xs text-faint">{{ 'charts.noDataDescription' | t }}</p>
      </div>
    }
  `,
})
export class LineChartComponent {
  private readonly i18n = inject(I18nService);
  readonly data = input<LinePoint[]>([]);
  readonly kind = input<'consumption' | 'price'>('consumption');
  readonly ariaLabel = input('');
  readonly fillId = `line-${Math.random().toString(36).slice(2, 8)}`;

  protected readonly geometry = computed<ChartGeometry>(() => {
    this.i18n.locale();
    const points = this.data().filter((point) => Number.isFinite(point.value));
    if (points.length === 0) {
      return {
        line: '',
        area: '',
        points: [],
        minLabel: '',
        maxLabel: '',
        firstLabel: '',
        middleLabel: '',
        lastLabel: '',
        hasData: false,
      };
    }
    const width = 600;
    const top = 24;
    const bottom = 185;
    const values = points.map((point) => point.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      min = min * 0.9;
      max = max * 1.1 || 1;
    }
    const padding = (max - min) * 0.12;
    min = Math.max(0, min - padding);
    max = max + padding;
    const scaleY = (value: number) => bottom - ((value - min) / (max - min)) * (bottom - top);
    const settled = points.map((point, index) => ({
      x: points.length === 1 ? width / 2 : (index / (points.length - 1)) * width,
      y: scaleY(point.value),
      value: point.value,
      label: point.label,
    }));
    const line = settled
      .map(
        (point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
      )
      .join(' ');
    const area = `${line} L ${settled[settled.length - 1].x.toFixed(1)} ${bottom} L ${settled[0].x.toFixed(1)} ${bottom} Z`;
    const labelFor = (index: number) => points[index]?.label ?? '';
    return {
      line,
      area,
      points: settled,
      minLabel: this.formatValue(min),
      maxLabel: this.formatValue(max),
      firstLabel: labelFor(0),
      middleLabel: labelFor(Math.floor((points.length - 1) / 2)),
      lastLabel: labelFor(points.length - 1),
      hasData: true,
    };
  });

  protected readonly strokeColor = computed(() =>
    this.kind() === 'consumption' ? 'var(--ch-chart-1)' : 'var(--ch-chart-2)',
  );

  private readonly activeIndex = signal<number | null>(null);

  protected readonly activePoint = computed(() => {
    const index = this.activeIndex();
    return index === null ? null : (this.geometry().points[index] ?? null);
  });

  protected selectNearest(event: PointerEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;

    const x = ((event.clientX - rect.left) / rect.width) * 600;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    this.geometry().points.forEach((point, index) => {
      const distance = Math.abs(point.x - x);
      if (distance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    });
    this.activeIndex.set(nearestIndex);
  }

  protected hidePoint(event: PointerEvent): void {
    // En móvil, pointerleave también se dispara al levantar el dedo.
    // Mantenemos el dato visible hasta que el usuario toque otro punto.
    if (event.pointerType !== 'mouse') return;
    this.activeIndex.set(null);
  }

  protected formatValue(value: number): string {
    return this.kind() === 'consumption' ? consumption(value) : price(value);
  }
}
