import { Component, input } from '@angular/core';
import { IconComponent, type IconName } from '../icon/icon';

type Tone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-stat-card',
  imports: [IconComponent],
  template: `
    <div class="card card-hover h-full p-5">
      <div class="flex items-start justify-between gap-3">
        <p class="min-w-0 break-words text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{{ label() }}</p>
        <span class="grid size-9 shrink-0 place-items-center rounded-xl" [class]="iconClass()">
          <app-icon [name]="icon()" [size]="17" />
        </span>
      </div>
      <p class="metric-value mt-4 text-[1.65rem] leading-none">{{ value() }}</p>
      @if (hint()) {
        <p class="mt-2 text-xs leading-relaxed text-muted">{{ hint() }}</p>
      }
    </div>
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly hint = input<string>('');
  readonly icon = input<IconName>('chart');
  readonly tone = input<Tone>('brand');

  iconClass(): string {
    return {
      brand: 'bg-brand-soft text-brand dark:text-accent',
      accent: 'bg-accent/25 text-accent-ink dark:text-accent',
      success: 'bg-success-soft text-success',
      warning: 'bg-warning-soft text-warning',
      danger: 'bg-danger-soft text-danger',
      info: 'bg-info-soft text-info',
      neutral: 'bg-surface-soft text-muted',
    }[this.tone()];
  }
}
