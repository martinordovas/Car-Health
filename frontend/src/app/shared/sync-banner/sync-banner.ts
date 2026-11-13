import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConnectivityService } from '../../core/connectivity.service';
import { OfflineQueueService } from '../../core/offline-queue.service';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-sync-banner',
  imports: [RouterLink, IconComponent],
  template: `
    @if (connectivity.degraded()) {
      <div class="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-info/20 bg-info-soft px-4 py-3 text-info">
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-info/10">
          <app-icon name="cloud-off" [size]="16" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold">No llegamos al servidor</p>
          <p class="text-[11px] opacity-80">Estás viendo la última copia guardada en este dispositivo.</p>
        </div>
        <button type="button" class="btn btn-sm bg-info/10 text-info" (click)="queue.flush()" [disabled]="queue.syncing()">
          <app-icon name="refresh" [size]="14" [class.spin-slow]="queue.syncing()" />
          Reintentar
        </button>
      </div>
    } @else if (!connectivity.online()) {
      <div class="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-warning">
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-warning/10">
          <app-icon name="cloud-off" [size]="16" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold">Estás sin conexión</p>
          <p class="text-[11px] opacity-80">
            Puedes consultar tus datos guardados y apuntar repostajes.
            @if (queue.pendingCount() > 0) {
              {{ queue.pendingCount() }} {{ queue.pendingCount() === 1 ? 'cambio se enviará' : 'cambios se enviarán' }} al volver.
            }
          </p>
        </div>
        @if (queue.pendingCount() > 0) {
          <span class="chip bg-warning/10 text-warning">
            <app-icon name="clock" [size]="12" />
            {{ queue.pendingCount() }} pendientes
          </span>
        }
      </div>
    } @else if (queue.syncing()) {
      <div class="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5 text-muted">
        <app-icon name="sync" [size]="16" class="spin-slow text-brand dark:text-accent" />
        <p class="text-xs font-semibold">Sincronizando tus cambios pendientes…</p>
      </div>
    } @else if (queue.pendingCount() > 0) {
      <div class="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-accent/25 text-accent-ink dark:text-accent">
          <app-icon name="sync" [size]="16" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold">Tienes cambios esperando</p>
          <p class="text-[11px] text-muted">Se enviarán automáticamente al recuperar la conexión.</p>
        </div>
        <button type="button" class="btn btn-sm btn-surface" (click)="queue.flush()" [disabled]="queue.syncing()">Sincronizar ahora</button>
      </div>
    } @else if (queue.failedCount() > 0) {
      <div class="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-danger">
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-danger/10">
          <app-icon name="alert-triangle" [size]="16" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold">{{ queue.failedCount() }} {{ queue.failedCount() === 1 ? 'cambio no se pudo sincronizar' : 'cambios no se pudieron sincronizar' }}</p>
          <p class="text-[11px] opacity-80">Revisa los pendientes en tu garaje para reintentarlos o descartarlos.</p>
        </div>
        <a routerLink="/app/garage" class="btn btn-sm bg-danger/10 text-danger">Revisar</a>
      </div>
    }
  `,
})
export class SyncBannerComponent {
  readonly connectivity = inject(ConnectivityService);
  readonly queue = inject(OfflineQueueService);
}
