import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../../features/auth/auth-session.service';

function hasLinkedSalon(user: { salonId?: number | string } | null | undefined): boolean {
  return user?.salonId !== undefined && user.salonId !== null && `${user.salonId}`.trim().length > 0;
}

/**
 * Public auth pages are only for guests.
 * If a connected user reaches login/OTP through browser history, send them home.
 */
export const guestOnlyAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthSessionService);
  const router = inject(Router);

  const token = typeof window !== 'undefined' ? localStorage.getItem('fotolou_jwt_token') : null;
  const user = auth.currentUser();

  if (token && user && user.id !== 'guest') {
    if (user.role === 'coiffeur' && !hasLinkedSalon(user)) {
      auth.logout();
      return router.createUrlTree(['/auth/login']);
    }
    return router.createUrlTree([auth.getHomeRoute()]);
  }

  return true;
};

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
    if (hasLinkedSalon(user)) {
      return router.createUrlTree(['/coiffeur/home']);
    }
    auth.logout();
    return router.createUrlTree(['/auth/login']);
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

  if (user && !hasLinkedSalon(user)) {
    auth.logout();
    return router.createUrlTree(['/auth/login']);
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
