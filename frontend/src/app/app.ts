import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConnectivityService } from './core/connectivity.service';
import { I18nService } from './core/i18n.service';
import { OfflineQueueService } from './core/offline-queue.service';
import { ThemeService } from './core/theme.service';
import { ToastHostComponent } from './shared/toast-host/toast-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHostComponent],
  template: `
    <router-outlet />
    <app-toast-host />
  `,
})
export class App {
  private readonly connectivity = inject(ConnectivityService);
  private readonly i18n = inject(I18nService);
  private readonly queue = inject(OfflineQueueService);
  private readonly theme = inject(ThemeService);
}
