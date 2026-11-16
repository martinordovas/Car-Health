import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConnectivityService } from '../../core/connectivity.service';
import { OfflineQueueService } from '../../core/offline-queue.service';
import { IconComponent } from '../icon/icon';
import { TranslatePipe } from '../i18n/translate.pipe';

@Component({
  selector: 'app-sync-banner',
  imports: [RouterLink, IconComponent, TranslatePipe],
  template: `
    @if (connectivity.degraded()) {
      <div class="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-info/20 bg-info-soft px-4 py-3 text-info">
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-info/10">
          <app-icon name="cloud-off" [size]="16" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold">{{ 'sync.serverTitle' | t }}</p>
          <p class="text-[11px] opacity-80">{{ 'sync.serverDescription' | t }}</p>
        </div>
        <button
          type="button"
          class="btn btn-sm bg-info/10 text-info"
          (click)="queue.flush()"
          [disabled]="queue.syncing()"
        >
          <app-icon name="refresh" [size]="14" [class.spin-slow]="queue.syncing()" />
          {{ 'sync.retry' | t }}
        </button>
      </div>
    } @else if (!connectivity.online()) {
      <div class="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-warning">
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-warning/10">
          <app-icon name="cloud-off" [size]="16" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold">{{ 'sync.offlineTitle' | t }}</p>
          <p class="text-[11px] opacity-80">
            {{ 'sync.offlineDescription' | t }}
            @if (queue.pendingCount() > 0) {
              {{
                (queue.pendingCount() === 1
                  ? 'sync.pendingSentence.one'
                  : 'sync.pendingSentence.other'
                ) | t: { count: queue.pendingCount() }
              }}
            }
          </p>
        </div>
        @if (queue.pendingCount() > 0) {
          <span class="chip bg-warning/10 text-warning">
            <app-icon name="clock" [size]="12" />
            {{ 'sync.pendingChip' | t: { count: queue.pendingCount() } }}
          </span>
        }
      </div>
    } @else if (queue.syncing()) {
      <div class="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5 text-muted">
        <app-icon name="sync" [size]="16" class="spin-slow text-brand dark:text-accent" />
        <p class="text-xs font-semibold">{{ 'sync.syncing' | t }}</p>
      </div>
    } @else if (queue.pendingCount() > 0) {
      <div class="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-accent/25 text-accent-ink dark:text-accent">
          <app-icon name="sync" [size]="16" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold">{{ 'sync.waitingTitle' | t }}</p>
          <p class="text-[11px] text-muted">{{ 'sync.waitingDescription' | t }}</p>
        </div>
        <button
          type="button"
          class="btn btn-sm btn-surface"
          (click)="queue.flush()"
          [disabled]="queue.syncing()"
        >
          {{ 'sync.syncNow' | t }}
        </button>
      </div>
    } @else if (queue.failedCount() > 0) {
      <div class="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-danger">
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-danger/10">
          <app-icon name="alert-triangle" [size]="16" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold">
            {{
              (queue.failedCount() === 1 ? 'sync.failedTitle.one' : 'sync.failedTitle.other')
                | t: { count: queue.failedCount() }
            }}
          </p>
          <p class="text-[11px] opacity-80">{{ 'sync.failedDescription' | t }}</p>
        </div>
        <a routerLink="/app/garage" class="btn btn-sm bg-danger/10 text-danger">{{
          'sync.review' | t
        }}</a>
      </div>
    }
  `,
})
export class SyncBannerComponent {
  readonly connectivity = inject(ConnectivityService);
  readonly queue = inject(OfflineQueueService);
}
