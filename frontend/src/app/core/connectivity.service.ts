import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly checkIntervalMs = 10_000;
  private readonly checkTimeoutMs = 5_000;

  readonly online = signal(typeof navigator === 'undefined' ? true : navigator.onLine);
  readonly degraded = signal(false);
  readonly checking = signal(true);
  readonly offline = computed(() => !this.online() || this.degraded());
  readonly label = computed(() => {
    if (this.degraded()) return 'Servidor no disponible';
    if (!this.online()) return 'Sin conexión';
    if (this.checking()) return 'Comprobando…';
    return 'En línea';
  });

  private checkInFlight = false;

  constructor() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.online.set(true);
      this.degraded.set(false);
      void this.checkNow();
    });
    window.addEventListener('offline', () => {
      this.online.set(false);
      this.degraded.set(false);
      this.checking.set(false);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void this.checkNow();
      }
    });
    window.addEventListener('focus', () => {
      void this.checkNow();
    });

    window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void this.checkNow();
      }
    }, this.checkIntervalMs);

    void this.checkNow();
  }

  /**
   * Comprueba la API con fetch directo para no pasar por los interceptores
   * (el interceptor offline podría devolver una respuesta cacheada y ocultar
   * que no hay conexión real).
   */
  async checkNow(): Promise<void> {
    if (this.checkInFlight) return;
    this.checkInFlight = true;
    this.checking.set(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), this.checkTimeoutMs);

    try {
      const response = await fetch(`${environment.apiUrl}/health?ts=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      const payload = (await response.json()) as { status?: string };
      if (!response.ok || payload.status !== 'ok') {
        throw new Error(`Healthcheck ${response.status}`);
      }
      this.online.set(true);
      this.degraded.set(false);
    } catch {
      this.online.set(false);
      this.degraded.set(typeof navigator === 'undefined' ? true : navigator.onLine);
    } finally {
      window.clearTimeout(timeout);
      this.checking.set(false);
      this.checkInFlight = false;
    }
  }

  markReachable(): void {
    this.online.set(true);
    this.degraded.set(false);
    this.checking.set(false);
  }

  markDegraded(): void {
    this.online.set(false);
    this.degraded.set(typeof navigator === 'undefined' ? true : navigator.onLine);
    this.checking.set(false);
  }
}
