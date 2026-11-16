import { Component, HostListener, OnDestroy, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon';
import { TranslatePipe } from '../i18n/translate.pipe';

@Component({
  selector: 'app-modal',
  imports: [IconComponent, TranslatePipe],
  template: `
    <div class="sheet-backdrop fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6" (click)="closed.emit()">
      <div
        class="sheet-panel safe-bottom max-h-[92dvh] w-full overflow-y-auto p-5 sm:modal-panel sm:max-w-lg sm:p-6"
        role="dialog"
        aria-modal="true"
        (click)="$event.stopPropagation()"
      >
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold tracking-[-0.035em]">{{ title() }}</h2>
            @if (subtitle()) {
              <p class="mt-1 text-sm text-muted">{{ subtitle() }}</p>
            }
          </div>
          <button class="icon-btn -mr-1 -mt-1 shrink-0" type="button" (click)="closed.emit()" [attr.aria-label]="'common.close' | t">
            <app-icon name="x" [size]="19" />
          </button>
        </div>
        <ng-content />
      </div>
    </div>
  `,
})
export class ModalComponent implements OnDestroy {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly closed = output<void>();

  constructor() {
    document.body.style.overflow = 'hidden';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}
