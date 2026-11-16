import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConnectivityService } from './connectivity.service';
import { errorMessage, isNetworkError } from './format';
import { I18nService } from './i18n.service';
import type { MutationKind, QueuedMutation } from './models';
import { OfflineStoreService } from './offline-store.service';
import { SessionService } from './session.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(OfflineStoreService);
  private readonly session = inject(SessionService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);

  private readonly state = signal<QueuedMutation[]>([]);
  private flushing = false;

  readonly items = this.state.asReadonly();
  readonly syncing = signal(false);
  readonly version = signal(0);
  readonly pendingCount = computed(() => {
    const userId = this.session.userId();
    return this.state().filter((item) => item.status === 'pending' && (userId === null || item.userId === userId)).length;
  });
  readonly failedCount = computed(() => {
    const userId = this.session.userId();
    return this.state().filter((item) => item.status === 'failed' && (userId === null || item.userId === userId)).length;
  });
  readonly totalCount = computed(() => this.pendingCount() + this.failedCount());

  constructor() {
    void this.load();
    window.addEventListener('online', () => {
      window.setTimeout(() => void this.flush(), 600);
    });
  }

  itemsFor(vehicleId: number, kind: MutationKind, includeFailed = false): QueuedMutation[] {
    const userId = this.session.userId();
    return this.state()
      .filter((item) => item.vehicleId === vehicleId && item.kind === kind)
      .filter((item) => userId === null || item.userId === userId)
      .filter((item) => includeFailed || item.status === 'pending')
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  visibleMutations(): QueuedMutation[] {
    const userId = this.session.userId();
    return this.state()
      .filter((item) => userId === null || item.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async enqueue(input: {
    id: string;
    kind: MutationKind;
    vehicleId: number;
    url: string;
    body: unknown;
    preview: QueuedMutation['preview'];
    label: string;
  }): Promise<void> {
    const userId = this.session.userId();
    if (userId === null) {
      throw new Error(this.i18n.t('errors.loginRequired'));
    }
    const item: QueuedMutation = {
      ...input,
      userId,
      method: 'POST',
      createdAt: Date.now(),
      status: 'pending',
    };
    this.state.update((items) => [...items, item]);
    await this.store.addMutation(item);
    this.version.update((value) => value + 1);
  }

  async flush(): Promise<void> {
    if (this.flushing || !this.connectivity.online()) return;
    const userId = this.session.userId();
    if (userId === null || this.session.token() === null) return;

    this.flushing = true;
    this.syncing.set(true);
    let synced = 0;
    let failed = 0;

    try {
      const pending = this.state()
        .filter((item) => item.userId === userId && item.status === 'pending')
        .sort((a, b) => a.createdAt - b.createdAt);

      for (const item of pending) {
        try {
          await firstValueFrom(this.http.post(item.url, item.body));
          this.state.update((items) => items.filter((candidate) => candidate.id !== item.id));
          await this.store.removeMutation(item.id);
          synced++;
          this.version.update((value) => value + 1);
        } catch (error) {
          if (isNetworkError(error)) {
            this.connectivity.markDegraded();
            break;
          }
          const message = errorMessage(error);
          const updated: QueuedMutation = { ...item, status: 'failed', error: message };
          this.state.update((items) => items.map((candidate) => (candidate.id === item.id ? updated : candidate)));
          await this.store.addMutation(updated);
          failed++;
        }
      }
    } finally {
      this.flushing = false;
      this.syncing.set(false);
      this.version.update((value) => value + 1);
    }

    if (synced > 0) {
      this.toast.success(this.i18n.plural('sync.toastSynced', synced));
    }
    if (failed > 0) {
      this.toast.error(this.i18n.plural('sync.toastFailed', failed));
    }
  }

  async retry(id: string): Promise<void> {
    const item = this.state().find((candidate) => candidate.id === id);
    if (!item) return;
    const updated: QueuedMutation = { ...item, status: 'pending', error: undefined };
    this.state.update((items) => items.map((candidate) => (candidate.id === id ? updated : candidate)));
    await this.store.addMutation(updated);
    this.version.update((value) => value + 1);
    await this.flush();
  }

  async discard(id: string): Promise<void> {
    this.state.update((items) => items.filter((item) => item.id !== id));
    await this.store.removeMutation(id);
    this.version.update((value) => value + 1);
  }

  private async load(): Promise<void> {
    const items = await this.store.getMutations();
    this.state.set(items);
    if (items.some((item) => item.status === 'pending') && this.connectivity.online()) {
      window.setTimeout(() => void this.flush(), 1000);
    }
  }
}
