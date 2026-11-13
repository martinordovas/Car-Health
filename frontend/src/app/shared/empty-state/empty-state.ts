import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div class="relative mb-5 grid size-16 place-items-center rounded-3xl bg-brand-soft text-brand dark:text-accent">
        <span class="absolute -right-1 -top-1 size-3 rounded-full bg-accent"></span>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <path d="M5 17H3v-4l2-5h14l2 5v4h-2" />
          <path d="M3 13h18M7 17h10" />
          <circle cx="7.5" cy="17.5" r="2" />
          <circle cx="16.5" cy="17.5" r="2" />
        </svg>
      </div>
      <h3 class="text-lg font-bold">{{ title() }}</h3>
      @if (description()) {
        <p class="mt-2 max-w-sm text-sm text-muted">{{ description() }}</p>
      }
      <div class="mt-5">
        <ng-content />
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
