import { Component, inject } from '@angular/core';
import { IconComponent } from '../icon/icon';
import { TranslatePipe } from '../i18n/translate.pipe';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toast-host',
  imports: [IconComponent, TranslatePipe],
  template: `
    <div class="pointer-events-none fixed inset-x-0 bottom-[calc(92px+env(safe-area-inset-bottom))] z-[120] flex flex-col items-center gap-2 px-4 md:bottom-6">
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-float animate-[fadeUp_220ms_ease-out]"
          role="status"
        >
          <span class="grid size-8 shrink-0 place-items-center rounded-full" [class]="toneClass(toast.type)">
            <app-icon [name]="iconName(toast.type)" [size]="16" />
          </span>
          <p class="min-w-0 flex-1 text-sm font-medium leading-snug text-ink">{{ toast.message }}</p>
          <button class="icon-btn size-8 shrink-0" type="button" (click)="toasts.dismiss(toast.id)" [attr.aria-label]="'common.close' | t">
            <app-icon name="x" [size]="15" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  readonly toasts = inject(ToastService);

  toneClass(type: 'success' | 'error' | 'info'): string {
    return type === 'success' ? 'bg-success-soft text-success' : type === 'error' ? 'bg-danger-soft text-danger' : 'bg-info-soft text-info';
  }

  iconName(type: 'success' | 'error' | 'info'): 'check-circle' | 'alert-triangle' | 'info' {
    return type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';
  }
}
