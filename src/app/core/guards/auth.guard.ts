import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../../features/auth/auth-session.service';

/**
 * Route guard for Client space:
 * Ensures the user has an active session and token, and is not a Coiffeur.
 * Unauthenticated users are redirected to login with return redirect.
 */
export const clientAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthSessionService);
  const router = inject(Router);

  const token = typeof window !== 'undefined' ? localStorage.getItem('fotolou_jwt_token') : null;
  const user = auth.currentUser();

  if (!token || !user || user.id === 'guest') {
    return router.createUrlTree(['/auth/login'], { queryParams: { redirect: '/client/home' } });
  }

  if (user && user.role === 'coiffeur') {
    return router.createUrlTree(['/coiffeur/home']);
  }

  return true;
};

/**
 * Route guard for Coiffeur space:
 * Ensures the user is authenticated and possesses the 'coiffeur' role.
 * Unauthorized clients are redirected to client home; guests to login.
 */
export const coiffeurAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthSessionService);
  const router = inject(Router);

  const token = typeof window !== 'undefined' ? localStorage.getItem('fotolou_jwt_token') : null;
  const user = auth.currentUser();

  if (!token || !user || user.id === 'guest') {
    return router.createUrlTree(['/auth/login'], { queryParams: { redirect: '/coiffeur/home' } });
  }

  if (user && user.role !== 'coiffeur') {
    return router.createUrlTree(['/client/home']);
  }

  return true;
};

/**
 * Route guard for Boutique / Shop space:
 * Ensures the user has an active session and token.
 * Open to BOTH Clients and Coiffeurs!
 * Unauthenticated users are redirected to login with return redirect.
 */
export const shopAuthGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthSessionService);
  const router = inject(Router);

  const token = typeof window !== 'undefined' ? localStorage.getItem('fotolou_jwt_token') : null;
  const user = auth.currentUser();

  if (!token || !user || user.id === 'guest') {
    return router.createUrlTree(['/auth/login'], { queryParams: { redirect: state.url || '/client/boutique' } });
  }

  return true;
};

