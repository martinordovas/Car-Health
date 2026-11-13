import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ConnectivityService } from '../core/connectivity.service';
import { errorMessage, initials } from '../core/format';
import { OfflineQueueService } from '../core/offline-queue.service';
import { SessionService } from '../core/session.service';
import { ToastService } from '../core/toast.service';
import { VehicleStore } from '../core/vehicle-store.service';
import { IconComponent, type IconName } from '../shared/icon/icon';
import { LogoComponent } from '../shared/logo/logo';
import { QuickAddSheetComponent } from '../shared/quick-add-sheet/quick-add-sheet';
import { SyncBannerComponent } from '../shared/sync-banner/sync-banner';
import { ThemeToggleComponent } from '../shared/theme-toggle/theme-toggle';
import { VehicleSwitcherComponent } from '../shared/vehicle-switcher/vehicle-switcher';

interface NavItem {
  label: string;
  shortLabel: string;
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
    LogoComponent,
    QuickAddSheetComponent,
    SyncBannerComponent,
    ThemeToggleComponent,
    VehicleSwitcherComponent,
  ],
  templateUrl: './app-layout.html',
})
export class AppLayoutComponent implements OnInit {
  readonly store = inject(VehicleStore);
  readonly session = inject(SessionService);
  readonly queue = inject(OfflineQueueService);
  readonly connectivity = inject(ConnectivityService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly quickAdd = signal(false);
  readonly initials = computed(() => initials(this.session.user()?.displayName));

  readonly navItems: NavItem[] = [
    { label: 'Inicio', shortLabel: 'Inicio', path: '/app/dashboard', icon: 'home' },
    { label: 'Repostajes', shortLabel: 'Repostar', path: '/app/fuel', icon: 'fuel' },
    { label: 'Mantenimiento', shortLabel: 'Taller', path: '/app/services', icon: 'wrench' },
    { label: 'Estadísticas', shortLabel: 'Gráficas', path: '/app/stats', icon: 'chart' },
    { label: 'Mi garaje', shortLabel: 'Garaje', path: '/app/garage', icon: 'garage' },
  ];

  readonly mobileNav = this.navItems.slice(0, 4);

  ngOnInit(): void {
    this.store.load().subscribe({
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
    void this.queue.flush();
  }

  logout(): void {
    if (this.queue.pendingCount() > 0) {
      const confirmed = window.confirm(
        `Tienes ${this.queue.pendingCount()} cambio(s) sin sincronizar. Permanecerán guardados en este dispositivo y se enviarán la próxima vez que entres con esta cuenta. ¿Cerrar sesión?`,
      );
      if (!confirmed) return;
    }
    this.auth.logout();
  }
}
