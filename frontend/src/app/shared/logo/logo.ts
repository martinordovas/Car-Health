import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  template: `
    <a routerLink="/app/dashboard" class="inline-flex items-center gap-2.5" aria-label="Car Health, ir al inicio">
      <span
        class="grid size-10 shrink-0 place-items-center rounded-[13px] shadow-[0_8px_22px_-12px_rgba(20,61,43,0.8)]"
        [class]="inverse() ? 'bg-accent text-accent-ink' : 'bg-brand text-accent'"
      >
        <svg [attr.width]="compact() ? 22 : 24" [attr.height]="compact() ? 22 : 24" viewBox="0 0 24 24" fill="none">
          <path d="M5.5 19c1-4.5 1.5-7.5 5-10s4.5-3.4 5.5-4.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <path d="M10 20c.8-3.5 1.3-6 4.2-8.2 2.8-2.2 3.9-2.9 4.8-4.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".5" />
          <circle cx="17.5" cy="17" r="2.5" fill="currentColor" />
        </svg>
      </span>
      @if (!markOnly()) {
        <span class="flex flex-col leading-none">
          <span
            class="font-extrabold tracking-[-0.05em]"
            [class]="(compact() ? 'text-[16px]' : 'text-[18px]') + (inverse() ? ' text-white' : ' text-ink')"
          >
            carhealth<span [class]="inverse() ? 'text-accent' : 'text-accent'">.</span>
          </span>
          @if (!compact()) {
            <span
              class="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em]"
              [class]="inverse() ? 'text-white/45' : 'text-faint'"
            >
              tu garaje, en orden
            </span>
          }
        </span>
      }
    </a>
  `,
})
export class LogoComponent {
  readonly compact = input(false);
  readonly markOnly = input(false);
  readonly inverse = input(false);
}
