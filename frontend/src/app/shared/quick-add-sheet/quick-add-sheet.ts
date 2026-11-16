import { Component, HostListener, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VehicleStore } from '../../core/vehicle-store.service';
import { IconComponent } from '../icon/icon';
import { TranslatePipe } from '../i18n/translate.pipe';

@Component({
  selector: 'app-quick-add-sheet',
  imports: [RouterLink, IconComponent, TranslatePipe],
  template: `
    <div class="sheet-backdrop fixed inset-0 z-[90] flex items-end justify-center" (click)="closed.emit()">
      <div class="sheet-panel safe-bottom w-full max-w-lg p-5 pb-8" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
        <div class="mx-auto mb-5 h-1 w-10 rounded-full bg-line"></div>
        <div class="mb-5 flex items-start justify-between">
          <div>
            <p class="eyebrow mb-1.5">{{ 'quickAdd.eyebrow' | t }}</p>
            <h2 class="text-xl font-bold">{{ 'quickAdd.title' | t }}</h2>
          </div>
          <button
            class="icon-btn -mr-1 -mt-1"
            type="button"
            (click)="closed.emit()"
            [attr.aria-label]="'common.close' | t"
          >
            <app-icon name="x" [size]="18" />
          </button>
        </div>

        @if (store.selected()) {
          <div class="grid gap-3">
            <a
              routerLink="/app/fuel/new"
              class="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/30 hover:bg-surface-soft"
              (click)="closed.emit()"
            >
              <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-accent-ink">
                <app-icon name="fuel" [size]="23" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-bold">{{ 'quickAdd.fuelTitle' | t }}</span>
                <span class="mt-0.5 block text-xs text-muted">{{
                  'quickAdd.fuelDescription' | t
                }}</span>
              </span>
              <app-icon name="arrow-right" [size]="18" class="shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
            </a>
            <a
              routerLink="/app/services/new"
              class="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/30 hover:bg-surface-soft"
              (click)="closed.emit()"
            >
              <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-accent">
                <app-icon name="wrench" [size]="22" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-bold">{{ 'quickAdd.maintenanceTitle' | t }}</span>
                <span class="mt-0.5 block text-xs text-muted">{{
                  'quickAdd.maintenanceDescription' | t
                }}</span>
              </span>
              <app-icon name="arrow-right" [size]="18" class="shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
            </a>
          </div>
          <p class="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-medium text-faint">
            <app-icon name="cloud-off" [size]="12" />
            {{ 'quickAdd.offlineHint' | t }}
          </p>
        } @else {
          <div class="rounded-2xl border border-dashed border-line bg-surface-soft p-6 text-center">
            <p class="text-sm font-semibold">{{ 'quickAdd.addCarTitle' | t }}</p>
            <p class="mt-1 text-xs text-muted">{{ 'quickAdd.addCarDescription' | t }}</p>
            <a routerLink="/app/garage" class="btn btn-primary btn-sm mt-4" (click)="closed.emit()">{{
              'quickAdd.goGarage' | t
            }}</a>
          </div>
        }
      </div>
    </div>
  `,
})
export class QuickAddSheetComponent {
  readonly store = inject(VehicleStore);
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
