import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { I18nService } from './i18n.service';
import { OfflineStoreService } from './offline-store.service';
import { SessionService } from './session.service';
import { ToastService } from './toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const store = inject(OfflineStoreService);
  const toast = inject(ToastService);
  const i18n = inject(I18nService);

  const isApiRequest = req.url.startsWith(environment.apiUrl) || req.url.startsWith('/api/');
  const isPublicAuth =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/verify-email') ||
    req.url.includes('/auth/resend-verification');
  const token = session.token();

  const headers: Record<string, string> = { 'Accept-Language': i18n.locale() };
  if (token && isApiRequest && !isPublicAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const request = isApiRequest ? req.clone({ setHeaders: headers }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest &&
        !isPublicAuth
      ) {
        const hadSession = session.token() !== null;
        session.clear();
        void store.clearResponses();
        if (hadSession) {
          toast.info(i18n.t('errors.sessionExpired'));
          void router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    }),
  );
};
