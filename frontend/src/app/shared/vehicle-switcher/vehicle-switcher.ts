import { Component, HostListener, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { km } from '../../core/format';
import { VehicleStore } from '../../core/vehicle-store.service';
import { IconComponent } from '../../shared/icon/icon';
import { TranslatePipe } from '../i18n/translate.pipe';

@Component({
  selector: 'app-vehicle-switcher',
  imports: [RouterLink, IconComponent, TranslatePipe],
  template: `
    <div class="relative" (click)="$event.stopPropagation()">
      @if (store.selected(); as vehicle) {
        <button
          type="button"
          class="flex max-w-[230px] items-center gap-2.5 rounded-full border border-line bg-surface py-1.5 pe-3 ps-1.5 text-left transition hover:border-brand/30 hover:bg-surface-soft active:scale-[0.98] sm:max-w-[270px]"
          (click)="toggle()"
          [attr.aria-expanded]="open()"
          aria-haspopup="listbox"
        >
          <span
            class="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand dark:text-accent"
          >
            <app-icon name="car" [size]="17" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-xs font-bold leading-tight">{{ vehicle.name }}</span>
            <span class="hidden truncate text-[10px] leading-tight text-faint sm:block">
              {{ vehicle.licensePlate || vehicle.brand + ' ' + vehicle.model }}
            </span>
          </span>
          <app-icon
            name="chevron-down"
            [size]="14"
            class="shrink-0 text-faint transition-transform"
            [class.rotate-180]="open()"
          />
        </button>
      } @else {
        <a routerLink="/app/garage" class="btn btn-surface btn-sm">
          <app-icon name="plus" [size]="15" />
          <span class="hidden sm:inline">{{ 'vehicleSwitcher.add' | t }}</span>
          <span class="sm:hidden">{{ 'vehicleSwitcher.addShort' | t }}</span>
        </a>
      }

      @if (open() || closing()) {
        <div
          class="menu-popover absolute left-0 top-[calc(100%+8px)] z-50 w-[290px] max-w-[calc(100vw-5rem)] origin-top-left overflow-hidden rounded-2xl border border-line bg-surface shadow-float"
          [class.is-closing]="closing()"
          [attr.aria-hidden]="closing() ? 'true' : null"
          [attr.inert]="closing() ? '' : null"
          role="listbox"
        >
          <div class="flex items-center justify-between px-4 pb-2 pt-3.5">
            <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">
              {{ 'vehicleSwitcher.yourGarage' | t }}
            </p>
            <span class="chip chip-neutral">{{ store.vehicles().length }}</span>
          </div>
          <div class="menu-list max-h-72 overflow-y-auto px-2 pb-2">
            @for (vehicle of store.vehicles(); track vehicle.id) {
              <button
                type="button"
                class="menu-item flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-surface-soft"
                (click)="select(vehicle.id)"
                role="option"
                [attr.aria-selected]="vehicle.id === store.selected()?.id"
              >
                <span
                  class="grid size-9 shrink-0 place-items-center rounded-xl"
                  [class]="
                    vehicle.id === store.selected()?.id
                      ? 'bg-brand text-accent'
                      : 'bg-surface-soft text-muted'
                  "
                >
                  <app-icon name="car" [size]="17" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-xs font-bold">{{ vehicle.name }}</span>
                  <span class="block truncate text-[10px] text-faint"
                    >{{ vehicle.licensePlate || vehicle.model }} ·
                    {{ km(vehicle.currentOdometer) }}</span
                  >
                </span>
                @if (vehicle.id === store.selected()?.id) {
                  <app-icon name="check" [size]="15" class="text-brand dark:text-accent" />
                }
              </button>
            }
          </div>
          <div class="border-t border-line p-2">
            <a
              routerLink="/app/garage"
              class="menu-item flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-muted transition hover:bg-surface-soft hover:text-ink"
              (click)="close()"
            >
              <app-icon name="garage" [size]="16" />
              {{ 'vehicleSwitcher.manage' | t }}
              <app-icon name="chevron-right" [size]="14" class="ms-auto" />
            </a>
          </div>
        </div>
      }
    </div>
  `,
})
export class VehicleSwitcherComponent implements OnDestroy {
  readonly store = inject(VehicleStore);
  readonly open = signal(false);
  readonly closing = signal(false);
  protected readonly km = km;
  private closeTimer: ReturnType<typeof window.setTimeout> | null = null;

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.closing.set(true);
    if (this.closeTimer) window.clearTimeout(this.closeTimer);
    this.closeTimer = window.setTimeout(() => {
      this.closing.set(false);
      this.closeTimer = null;
    }, 140);
  }

  toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    if (this.closeTimer) window.clearTimeout(this.closeTimer);
    this.closing.set(false);
    this.open.set(true);
  }

  select(id: number): void {
    this.store.select(id);
    this.close();
  }

  ngOnDestroy(): void {
    if (this.closeTimer) window.clearTimeout(this.closeTimer);
  }
}
