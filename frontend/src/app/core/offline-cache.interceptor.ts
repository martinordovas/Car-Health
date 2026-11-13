import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, of, switchMap, tap, throwError } from 'rxjs';
import { ConnectivityService } from './connectivity.service';
import { OfflineStoreService } from './offline-store.service';
import { SessionService } from './session.service';
import { isNetworkError } from './format';

export const offlineCacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET' || !req.url.includes('/api/') || req.url.includes('/dossier.pdf')) {
    return next(req);
  }

  const store = inject(OfflineStoreService);
  const session = inject(SessionService);
  const connectivity = inject(ConnectivityService);
  const key = `${session.userId() ?? 'anon'}:${req.urlWithParams}`;

  const cachedResponse = () =>
    from(store.getResponse(key)).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(
            new HttpResponse({
              body: cached.body,
              status: 200,
              statusText: 'OK (caché local)',
              url: req.url,
            }),
          );
        }
        return throwError(
          () => new HttpErrorResponse({ status: 0, statusText: 'Sin conexión', url: req.url }),
        );
      }),
    );

  if (!connectivity.online()) {
    return cachedResponse();
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        connectivity.markReachable();
        void store.putResponse(key, event.body);
      }
    }),
    catchError((error: unknown) => {
      if (!isNetworkError(error)) {
        return throwError(() => error);
      }
      connectivity.markDegraded();
      return cachedResponse();
    }),
  );
};
