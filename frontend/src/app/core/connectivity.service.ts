import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  readonly online = signal(typeof navigator === 'undefined' ? true : navigator.onLine);
  readonly degraded = signal(false);
  readonly offline = computed(() => !this.online() || this.degraded());
  readonly label = computed(() => {
    if (!this.online()) return 'Sin conexión';
    if (this.degraded()) return 'Servidor no disponible';
    return 'En línea';
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.online.set(true);
        this.degraded.set(false);
      });
      window.addEventListener('offline', () => {
        this.online.set(false);
      });
    }
  }

  markReachable(): void {
    this.degraded.set(false);
  }

  markDegraded(): void {
    this.degraded.set(true);
  }
}
