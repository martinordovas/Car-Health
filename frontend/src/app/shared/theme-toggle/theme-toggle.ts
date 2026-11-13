import { Component, inject } from '@angular/core';
import { ThemeService } from '../../core/theme.service';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-theme-toggle',
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="icon-btn relative overflow-hidden"
      (click)="theme.toggle()"
      [attr.aria-label]="theme.dark() ? 'Activar modo claro' : 'Activar modo oscuro'"
      [attr.title]="theme.dark() ? 'Modo claro' : 'Modo oscuro'"
    >
      <span class="transition-transform duration-300" [class.rotate-[360deg]]="!theme.dark()">
        <app-icon [name]="theme.dark() ? 'sun' : 'moon'" [size]="18" />
      </span>
    </button>
  `,
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
