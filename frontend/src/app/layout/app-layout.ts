import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ConnectivityService } from '../core/connectivity.service';
import { errorMessage, initials } from '../core/format';
import { I18nService } from '../core/i18n.service';
import type { TranslationKey } from '../core/i18n';
import { OfflineQueueService } from '../core/offline-queue.service';
import { SessionService } from '../core/session.service';
import { ToastService } from '../core/toast.service';
import { VehicleStore } from '../core/vehicle-store.service';
import { IconComponent, type IconName } from '../shared/icon/icon';
import { LanguageToggleComponent } from '../shared/i18n/language-toggle';
import { TranslatePipe } from '../shared/i18n/translate.pipe';
import { LogoComponent } from '../shared/logo/logo';
import { QuickAddSheetComponent } from '../shared/quick-add-sheet/quick-add-sheet';
import { SyncBannerComponent } from '../shared/sync-banner/sync-banner';
import { ThemeToggleComponent } from '../shared/theme-toggle/theme-toggle';
import { VehicleSwitcherComponent } from '../shared/vehicle-switcher/vehicle-switcher';

interface NavItem {
  labelKey: TranslationKey;
  path: string;
  icon: IconName;
}

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IconComponent,
    LanguageToggleComponent,
    LogoComponent,
    QuickAddSheetComponent,
    SyncBannerComponent,
    ThemeToggleComponent,
    TranslatePipe,
    VehicleSwitcherComponent,
  ],
  templateUrl: './app-layout.html',
})
export class AppLayoutComponent implements OnInit {
  readonly store = inject(VehicleStore);
  readonly session = inject(SessionService);
  readonly queue = inject(OfflineQueueService);
  readonly connectivity = inject(ConnectivityService);
  readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly quickAdd = signal(false);
  readonly initials = computed(() => initials(this.session.user()?.displayName));

  readonly navItems: NavItem[] = [
    { labelKey: 'layout.navHome', path: '/app/dashboard', icon: 'home' },
    { labelKey: 'layout.navFuel', path: '/app/fuel', icon: 'fuel' },
    { labelKey: 'layout.navMaintenance', path: '/app/services', icon: 'wrench' },
    { labelKey: 'layout.navStats', path: '/app/stats', icon: 'chart' },
    { labelKey: 'layout.navGarage', path: '/app/garage', icon: 'garage' },
  ];

  ngOnInit(): void {
    this.store.load().subscribe({
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
    void this.queue.flush();
  }

  logout(): void {
    if (this.queue.pendingCount() > 0) {
      const confirmed = window.confirm(
        this.i18n.t('layout.logoutConfirm', { count: this.queue.pendingCount() }),
      );
      if (!confirmed) return;
    }
    this.auth.logout();
  }
}
