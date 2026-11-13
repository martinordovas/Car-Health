import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        @if (eyebrow()) {
          <p class="eyebrow mb-2">{{ eyebrow() }}</p>
        }
        <h1 class="text-[1.75rem] font-bold tracking-[-0.04em] sm:text-[2.15rem]">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="mt-2 max-w-xl text-sm text-muted">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <ng-content />
      </div>
    </header>
  `,
})
export class PageHeaderComponent {
  readonly eyebrow = input<string>('');
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
