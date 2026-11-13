import { Injectable, computed, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  private readonly state = signal<Toast[]>([]);
  readonly toasts = this.state.asReadonly();
  readonly hasToasts = computed(() => this.state().length > 0);

  show(message: string, type: ToastType = 'info', duration = 4200): void {
    const id = ++this.counter;
    this.state.update((toasts) => [...toasts, { id, message, type }]);
    window.setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error', 5500);
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  dismiss(id: number): void {
    this.state.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
