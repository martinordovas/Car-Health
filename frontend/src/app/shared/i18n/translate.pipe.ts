import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/i18n.service';
import type { TranslationKey, TranslationParams } from '../../core/i18n';

@Pipe({
  name: 't',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: TranslationKey, params?: TranslationParams): string {
    this.i18n.locale();
    return this.i18n.t(key, params);
  }
}
