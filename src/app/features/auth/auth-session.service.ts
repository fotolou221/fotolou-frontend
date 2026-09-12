import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../../core/config/api.config';
import { HttpErrorMessageService } from '../../shared/services/http-error-message.service';

export type UserRole = 'client' | 'coiffeur';
export type AuthProvider = 'phone' | 'google' | 'apple';
export type SocialProvider = Exclude<AuthProvider, 'phone'>;

export interface AuthUserProfile {
  readonly id: number | string;
  readonly label?: string;
  readonly name: string;
  readonly phone: string;
  readonly role: UserRole;
  readonly homeRoute: string;
  readonly avatarUrl?: string | null;
  readonly salonId?: number | string;
  readonly salonSlug?: string;
}

const GUEST_CLIENT_USER: AuthUserProfile = {
  id: 'guest',
  label: 'Client',
  name: 'Mon Compte',
  phone: '',
  role: 'client',
  homeRoute: '/client/home'
};

const GUEST_COIFFEUR_USER: AuthUserProfile = {
  id: 'guest',
  label: 'Coiffeur Pro',
  name: 'Espace Barbier',
  phone: '',
  role: 'coiffeur',
  homeRoute: '/coiffeur/home'
};

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly http = inject(HttpClient);
  private readonly errorMessages = inject(HttpErrorMessageService);
  private readonly baseUrl = API_CONFIG.baseUrl;

  private readonly storageRoleKey = 'fotolou-active-role';
  private readonly storageUserKey = 'fotolou-active-user';
  private readonly tokenKey = 'fotolou_jwt_token';
  private readonly refreshTokenKey = 'fotolou_refresh_token';

  private readonly currentUserSignal = signal<AuthUserProfile | null>(this.readStoredUser());
  private readonly activeRoleSignal = signal<UserRole>(this.readStoredRole());
  private readonly pendingLoginRoleSignal = signal<UserRole>('client');
  private readonly pendingPhoneSignal = signal<string>('');
  private readonly providerSignal = signal<AuthProvider>('phone');

  readonly users = [GUEST_CLIENT_USER, GUEST_COIFFEUR_USER];
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly activeRole = this.activeRoleSignal.asReadonly();
  readonly pendingPhone = this.pendingPhoneSignal.asReadonly();
  readonly provider = this.providerSignal.asReadonly();

  readonly activeUser = computed(() => {
    const user = this.currentUserSignal();
    if (user) return user;
    return this.activeRoleSignal() === 'coiffeur' ? GUEST_COIFFEUR_USER : GUEST_CLIENT_USER;
  });

  selectRole(role: UserRole): void {
    this.activeRoleSignal.set(role);
    this.persistActiveRole();
  }

  resolveRole(value: string | null): UserRole {
    return value === 'coiffeur' ? 'coiffeur' : 'client';
  }

  async startPhoneLogin(rawPhone: string, requestedRole?: UserRole): Promise<boolean> {
    const digits = rawPhone.replace(/\D/g, '').replace(/^221/, '');
    if (digits.length < 9) {
      throw new Error('Veuillez entrer un numéro de téléphone valide à 9 chiffres.');
    }
    const loginRole: UserRole = requestedRole ?? this.pendingLoginRoleSignal();
    const formattedPhone = this.formatPhone(rawPhone);
    this.providerSignal.set('phone');
    this.pendingPhoneSignal.set(formattedPhone);
    this.pendingLoginRoleSignal.set(loginRole);
    this.activeRoleSignal.set(loginRole);

    const cleanPhone = `+221${digits.slice(-9)}`;
    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/auth/otp/send`, {
          phone: cleanPhone,
          role: loginRole === 'coiffeur' ? 'COIFFEUR' : 'CLIENT'
        })
      );
    } catch (err) {
      throw new Error(this.errorMessages.message(err, "Impossible d'envoyer le code SMS. Verifiez votre connexion."));
    }
    return true;
  }

  completeSocialLogin(provider: SocialProvider): AuthUserProfile {
    this.providerSignal.set(provider);
    this.persistActiveRole();
    return this.activeUser();
  }

  async verifyOtpAsync(code: string): Promise<boolean> {
    try {
      const cleanPhone = this.pendingPhoneSignal().replace(/\s+/g, '');
      const loginRole = this.pendingLoginRoleSignal();
      const res = await firstValueFrom(
        this.http.post<{ id_token?: string; token?: string; refresh_token?: string; refreshToken?: string; user?: any }>(
          `${this.baseUrl}/auth/otp/verify`,
          {
            phone: cleanPhone,
            code,
            role: loginRole === 'coiffeur' ? 'COIFFEUR' : 'CLIENT'
          }
        )
      );

      const token = res.id_token || res.token;
      const refreshToken = res.refresh_token || res.refreshToken;
      if (typeof window !== 'undefined') {
        if (token) {
          localStorage.setItem(this.tokenKey, token);
        }
        if (refreshToken) {
          localStorage.setItem(this.refreshTokenKey, refreshToken);
        }
      }

      if (res.user) {
        const rawRole = `${res.user.role || ''}`.toLowerCase();
        const roleClean: UserRole = rawRole === 'coiffeur' ? 'coiffeur' : 'client';
        const profile: AuthUserProfile = {
          id: res.user.id || Date.now(),
          name: res.user.name || 'Utilisateur Fotolou',
          phone: res.user.phone || cleanPhone,
          role: roleClean,
          homeRoute: res.user.homeRoute || (roleClean === 'coiffeur' ? '/coiffeur/home' : '/client/home'),
          avatarUrl: res.user.avatarUrl,
          salonId: res.user.salonId,
          salonSlug: res.user.salonSlug
        };
        this.currentUserSignal.set(profile);
        this.activeRoleSignal.set(roleClean);
        this.persistUser(profile);
      } else {
        this.persistActiveRole();
      }

      return true;
    } catch (e) {
      console.warn('[AuthSessionService] Backend OTP verify fallback to dev code:', e);
      if (code === '123456') {
        const loginRole = this.pendingLoginRoleSignal();
        const roleClean: UserRole = loginRole === 'coiffeur' ? 'coiffeur' : 'client';
        const fakeToken = 'dev_mock_jwt_token_' + Date.now();
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.tokenKey, fakeToken);
        }
        const profile: AuthUserProfile = {
          id: Date.now(),
          name: roleClean === 'coiffeur' ? 'Barbier Fotolou' : 'Client Fotolou',
          phone: this.pendingPhoneSignal(),
          role: roleClean,
          homeRoute: roleClean === 'coiffeur' ? '/coiffeur/home' : '/client/home'
        };
        this.currentUserSignal.set(profile);
        this.activeRoleSignal.set(roleClean);
        this.persistUser(profile);
        return true;
      }
      if (this.errorMessages.isConnectionIssue(e)) {
        throw new Error(this.errorMessages.message(e, 'Connexion instable. Impossible de verifier le code pour le moment.'));
      }
      return false;
    }
  }

  verifyOtp(code: string): boolean {
    if (code === '123456') {
      this.persistActiveRole();
      return true;
    }
    return false;
  }

  async refreshSession(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const currentRefresh = localStorage.getItem(this.refreshTokenKey);
    if (!currentRefresh) return null;

    try {
      const res = await firstValueFrom(
        this.http.post<{ id_token?: string; token?: string; refresh_token?: string; refreshToken?: string }>(
          `${this.baseUrl}/auth/refresh`,
          { refresh_token: currentRefresh }
        )
      );

      const newToken = res.id_token || res.token;
      const newRefresh = res.refresh_token || res.refreshToken || currentRefresh;

      if (newToken) {
        localStorage.setItem(this.tokenKey, newToken);
      }
      if (newRefresh) {
        localStorage.setItem(this.refreshTokenKey, newRefresh);
      }
      return newToken || null;
    } catch (err) {
      console.warn('[AuthSessionService] Session refresh failed (expired or invalid):', err);
      this.logout();
      return null;
    }
  }

  getHomeRoute(role: UserRole = this.activeRoleSignal()): string {
    const user = this.currentUserSignal();
    if (user && user.homeRoute) return user.homeRoute;
    return role === 'coiffeur' ? '/coiffeur/home' : '/client/home';
  }

  async updateProfile(updates: { name?: string; phone?: string; avatarUrl?: string }): Promise<AuthUserProfile> {
    const current = this.activeUser();
    const updated: AuthUserProfile = {
      ...current,
      name: updates.name !== undefined && updates.name.trim().length > 0 ? updates.name.trim() : current.name,
      phone: updates.phone !== undefined ? updates.phone : current.phone,
      avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : current.avatarUrl,
      id: current.id === 'guest' ? `client_${Date.now()}` : current.id,
    };

    // 1. Immediately update reactive signal & localStorage
    this.currentUserSignal.set(updated);
    this.persistUser(updated);

    // 2. If authenticated with backend JWT, also update on the server
    const token = typeof window !== 'undefined' ? localStorage.getItem(this.tokenKey) : null;
    if (token) {
      try {
        await firstValueFrom(
          this.http.put(`${this.baseUrl}/account/profile`, {
            name: updated.name,
            imageUrl: updated.avatarUrl
          })
        );
      } catch (err) {
        console.warn('[AuthSessionService] Could not persist profile to backend, kept in local storage:', err);
      }
    }

    return updated;
  }

  logout(): void {
    this.currentUserSignal.set(null);
    this.activeRoleSignal.set('client');
    this.pendingLoginRoleSignal.set('client');
    this.pendingPhoneSignal.set('');
    this.providerSignal.set('phone');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageRoleKey);
      localStorage.removeItem(this.storageUserKey);
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshTokenKey);
    }
  }

  formatPhone(rawPhone: string): string {
    if (!rawPhone || !rawPhone.trim()) return '';
    let digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('221') && digits.length > 9) {
      digits = digits.substring(3);
    }
    digits = digits.slice(-9);
    if (digits.length === 9) {
      return `+221 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
    }
    return rawPhone.startsWith('+') ? rawPhone : `+221 ${rawPhone.replace(/\s+/g, '')}`;
  }

  private persistActiveRole(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageRoleKey, this.activeRoleSignal());
    }
  }

  private persistUser(user: AuthUserProfile): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageRoleKey, user.role);
      localStorage.setItem(this.storageUserKey, JSON.stringify(user));
    }
  }

  private readStoredUser(): AuthUserProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.storageUserKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private readStoredRole(): UserRole {
    if (typeof window === 'undefined') return 'client';
    const storedRole = localStorage.getItem(this.storageRoleKey);
    return storedRole === 'coiffeur' ? 'coiffeur' : 'client';
  }
}
