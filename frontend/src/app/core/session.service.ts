import { Injectable, computed, signal } from '@angular/core';
import type { AuthResponse, User } from './models';

const TOKEN_KEY = 'ch-token';
const USER_KEY = 'ch-user';

function readUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly tokenState = signal<string | null>(this.readToken());
  private readonly userState = signal<User | null>(readUser());

  readonly token = this.tokenState.asReadonly();
  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenState() !== null);
  readonly userId = computed(() => this.userState()?.id ?? null);
  readonly firstName = computed(() => {
    const name = this.userState()?.displayName?.trim();
    if (!name) return '';
    return name.split(/\s+/)[0];
  });

  save(response: AuthResponse): void {
    this.tokenState.set(response.token);
    this.userState.set(response.user);
    try {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch {
      // El token sigue disponible en memoria aunque el almacenamiento esté bloqueado.
    }
  }

  updateUser(user: User): void {
    this.userState.set(user);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Ignorar almacenamiento no disponible.
    }
  }

  clear(): void {
    this.tokenState.set(null);
    this.userState.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignorar.
    }
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
}
