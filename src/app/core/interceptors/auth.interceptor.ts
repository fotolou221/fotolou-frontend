import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, of, shareReplay, switchMap, throwError } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

let isRefreshing = false;
let refreshObservable: Observable<string | null> | null = null;

/**
 * Intercepteur HTTP pour :
 * 1. Injecter le token JWT Access Token (15 min) dans toutes les requêtes protégées.
 * 2. Intercepter les erreurs 401 Unauthorized et rafraîchir silencieusement le token
 *    avec le Refresh Token (45 jours) sans redemander de validation par SMS.
 * 3. Rejouer la requête d'origine avec le nouvel Access Token.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isBrowser = typeof window !== 'undefined';
  const token = isBrowser ? localStorage.getItem('fotolou_jwt_token') : null;

  // Ne pas altérer les endpoints d'authentification ni le refresh
  const isAuthOrRefresh =
    req.url.includes('/api/auth/otp/') ||
    req.url.includes('/api/auth/refresh') ||
    req.url.includes('/api/authenticate');

  let authReq = req;
  if (token && !isAuthOrRefresh) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  const httpBackend = inject(HttpBackend);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si 401 Unauthorized et qu'on a un refresh token disponible en local
      if (error.status === 401 && !isAuthOrRefresh && isBrowser) {
        const refreshToken = localStorage.getItem('fotolou_refresh_token');

        if (refreshToken) {
          if (!isRefreshing) {
            isRefreshing = true;
            // Utilisation d'un HttpClient direct sur HttpBackend pour éviter tout cycle d'interception
            const rawHttp = new HttpClient(httpBackend);

            refreshObservable = rawHttp
              .post<any>(`${API_CONFIG.baseUrl}/auth/refresh`, {
                refresh_token: refreshToken
              })
              .pipe(
                switchMap((res) => {
                  isRefreshing = false;
                  const newToken = res.id_token || res.token;
                  const newRefresh = res.refresh_token || res.refreshToken || refreshToken;

                  if (newToken) {
                    localStorage.setItem('fotolou_jwt_token', newToken);
                  }
                  if (newRefresh) {
                    localStorage.setItem('fotolou_refresh_token', newRefresh);
                  }
                  return of(newToken);
                }),
                catchError((refreshErr) => {
                  isRefreshing = false;
                  refreshObservable = null;
                  console.warn('[authInterceptor] Refresh token expiré ou révoqué (45 jours écoulés) :', refreshErr);
                  localStorage.removeItem('fotolou_jwt_token');
                  localStorage.removeItem('fotolou_refresh_token');
                  return throwError(() => refreshErr);
                }),
                shareReplay(1)
              );
          }

          return refreshObservable!.pipe(
            switchMap((newToken) => {
              if (newToken) {
                const retriedReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`
                  }
                });
                return next(retriedReq);
              }
              return throwError(() => error);
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
};
