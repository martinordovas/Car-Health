import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VehicleStore } from '../../core/vehicle-store.service';
import { IconComponent } from '../../shared/icon/icon';

@Component({
  selector: 'app-vehicle-switcher',
  imports: [RouterLink, IconComponent],
  template: `
    <div class="relative" (click)="$event.stopPropagation()">
      @if (store.selected(); as vehicle) {
        <button
          type="button"
          class="flex max-w-[230px] items-center gap-2.5 rounded-full border border-line bg-surface py-1.5 pe-3 ps-1.5 text-left transition hover:border-brand/30 hover:bg-surface-soft sm:max-w-[270px]"
          (click)="toggle()"
          [attr.aria-expanded]="open()"
          aria-haspopup="listbox"
        >
          <span class="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand dark:text-accent">
            <app-icon name="car" [size]="17" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-xs font-bold leading-tight">{{ vehicle.name }}</span>
            <span class="hidden truncate text-[10px] leading-tight text-faint sm:block">
              {{ vehicle.licensePlate || vehicle.brand + ' ' + vehicle.model }}
            </span>
          </span>
          <app-icon name="chevron-down" [size]="14" class="shrink-0 text-faint transition-transform" [class.rotate-180]="open()" />
        </button>
      } @else {
        <a routerLink="/app/garage" class="btn btn-surface btn-sm">
          <app-icon name="plus" [size]="15" />
          <span class="hidden sm:inline">Añadir coche</span>
          <span class="sm:hidden">Coche</span>
        </a>
      }

      @if (open()) {
        <div
          class="absolute right-0 top-[calc(100%+8px)] z-50 w-[290px] overflow-hidden rounded-2xl border border-line bg-surface shadow-float animate-[scaleIn_160ms_ease-out]"
          role="listbox"
        >
          <div class="flex items-center justify-between px-4 pb-2 pt-3.5">
            <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">Tu garaje</p>
            <span class="chip chip-neutral">{{ store.vehicles().length }}</span>
          </div>
          <div class="max-h-72 overflow-y-auto px-2 pb-2">
            @for (vehicle of store.vehicles(); track vehicle.id) {
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-surface-soft"
                (click)="select(vehicle.id)"
                role="option"
                [attr.aria-selected]="vehicle.id === store.selected()?.id"
              >
                <span class="grid size-9 shrink-0 place-items-center rounded-xl" [class]="vehicle.id === store.selected()?.id ? 'bg-brand text-accent' : 'bg-surface-soft text-muted'">
                  <app-icon name="car" [size]="17" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-xs font-bold">{{ vehicle.name }}</span>
                  <span class="block truncate text-[10px] text-faint">{{ vehicle.licensePlate || vehicle.model }} · {{ vehicle.currentOdometer.toLocaleString('es-ES') }} km</span>
                </span>
                @if (vehicle.id === store.selected()?.id) {
                  <app-icon name="check" [size]="15" class="text-brand dark:text-accent" />
                }
              </button>
            }
          </div>
          <div class="border-t border-line p-2">
            <a routerLink="/app/garage" class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-muted transition hover:bg-surface-soft hover:text-ink" (click)="close()">
              <app-icon name="garage" [size]="16" />
              Gestionar garaje
              <app-icon name="chevron-right" [size]="14" class="ms-auto" />
            </a>
          </div>
        </div>
      }
    </div>
  `,
})
export class VehicleSwitcherComponent {
  readonly store = inject(VehicleStore);
  readonly open = signal(false);

  @HostListener('document:click')
  close(): void {
    this.open.set(false);
  }

  toggle(): void {
    this.open.update((value) => !value);
  }

  select(id: number): void {
    this.store.select(id);
    this.close();
  }
}
