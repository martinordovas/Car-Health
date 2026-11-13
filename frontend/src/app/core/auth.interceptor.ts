import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { OfflineStoreService } from './offline-store.service';
import { SessionService } from './session.service';
import { ToastService } from './toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const store = inject(OfflineStoreService);
  const toast = inject(ToastService);

  const isPublicAuth =
    req.url.includes('/auth/login') || req.url.includes('/auth/register');
  const token = session.token();

  const request =
    token && !isPublicAuth
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isPublicAuth) {
        const hadSession = session.token() !== null;
        session.clear();
        void store.clearResponses();
        if (hadSession) {
          toast.info('Tu sesión ha caducado. Vuelve a iniciar sesión.');
          void router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    }),
  );
};
