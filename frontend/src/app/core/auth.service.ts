import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import type { AuthResponse, User } from './models';
import { OfflineStoreService } from './offline-store.service';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly store = inject(OfflineStoreService);
  private readonly router = inject(Router);
  private readonly base = `${environment.apiUrl}/auth`;

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, { email, password }).pipe(
      tap((response) => {
        void this.store.clearResponses();
        this.session.save(response);
      }),
    );
  }

  register(email: string, password: string, displayName: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/register`, { email, password, displayName })
      .pipe(
        tap((response) => {
          void this.store.clearResponses();
          this.session.save(response);
        }),
      );
  }

  updateProfile(displayName: string): Observable<User> {
    return this.http
      .patch<User>(`${this.base}/me`, { displayName })
      .pipe(tap((user) => this.session.updateUser(user)));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.base}/change-password`, { currentPassword, newPassword });
  }

  logout(redirect = true): void {
    this.session.clear();
    void this.store.clearResponses();
    if (redirect) {
      void this.router.navigate(['/login']);
    }
  }
}
