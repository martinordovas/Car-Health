import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n.service';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-language-toggle',
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-line bg-surface px-2 text-[10px] font-extrabold text-ink transition hover:border-brand/30 active:scale-95 dark:text-accent sm:hidden"
      (click)="i18n.toggle()"
      [attr.title]="i18n.switchLabel()"
      [attr.aria-label]="i18n.switchLabel()"
    >
      {{ i18n.isEnglish() ? 'EN' : 'ES' }}
    </button>

    <div
      class="hidden h-9 items-center gap-0.5 rounded-full border border-line bg-surface p-0.5 sm:inline-flex"
      role="group"
      [attr.aria-label]="i18n.t('language.switch')"
    >
      <app-icon name="languages" [size]="14" class="mx-1.5 text-faint" />
      <button
        type="button"
        class="rounded-full px-2 py-1 text-[10px] font-extrabold transition active:scale-95"
        [class]="
          !i18n.isEnglish()
            ? 'bg-ink text-canvas dark:bg-accent dark:text-accent-ink'
            : 'text-faint hover:text-ink dark:hover:text-accent'
        "
        [attr.aria-pressed]="!i18n.isEnglish()"
        [attr.title]="i18n.t('language.spanish')"
        (click)="i18n.set('es')"
      >
        ES
      </button>
      <button
        type="button"
        class="rounded-full px-2 py-1 text-[10px] font-extrabold transition active:scale-95"
        [class]="
          i18n.isEnglish()
            ? 'bg-ink text-canvas dark:bg-accent dark:text-accent-ink'
            : 'text-faint hover:text-ink dark:hover:text-accent'
        "
        [attr.aria-pressed]="i18n.isEnglish()"
        [attr.title]="i18n.t('language.english')"
        (click)="i18n.set('en')"
      >
        EN
      </button>
    </div>
  `,
})
export class LanguageToggleComponent {
  readonly i18n = inject(I18nService);
}
