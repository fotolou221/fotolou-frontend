import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map, finalize } from 'rxjs';
import { AppNotification } from '../models/notification';
import { API_CONFIG } from '../../core/config/api.config';
import { AuthSessionService } from '../../features/auth/auth-session.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthSessionService);
  private readonly baseUrl = API_CONFIG.baseUrl;

  readonly notifications = signal<readonly AppNotification[]>([]);
  readonly loading = signal<boolean>(false);
  readonly isRefreshing = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // ── Cache Strategy (SWR - 1 min TTL) ────────────────────────
  private lastFetchedAt: number | null = null;
  private readonly CACHE_TTL_MS = 60 * 1000;

  readonly clientNotifications = computed(() =>
    this.notifications().filter((n) => n.recipientRole === 'client')
  );

  readonly coiffeurNotifications = computed(() =>
    this.notifications().filter((n) => n.recipientRole === 'coiffeur')
  );

  readonly clientUnreadCount = computed(() =>
    this.clientNotifications().filter((n) => !n.isRead).length
  );

  readonly coiffeurUnreadCount = computed(() =>
    this.coiffeurNotifications().filter((n) => !n.isRead).length
  );

  readonly unreadCount = computed(() => this.clientUnreadCount());

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user && user.id !== 'guest') {
        this.loadNotifications(true);
      } else {
        this.notifications.set([]);
        this.lastFetchedAt = null;
        this.loading.set(false);
        this.isRefreshing.set(false);
        this.error.set(null);
      }
    });
  }

  loadNotifications(forceRefresh: boolean = false): void {
    const user = this.auth.currentUser();
    if (!user || user.id === 'guest') {
      this.notifications.set([]);
      this.lastFetchedAt = null;
      this.loading.set(false);
      this.isRefreshing.set(false);
      return;
    }

    const now = Date.now();
    const hasData = this.notifications().length > 0;
    const isCacheValid = this.lastFetchedAt !== null && (now - this.lastFetchedAt) < this.CACHE_TTL_MS;

    if (hasData && isCacheValid && !forceRefresh) {
      return;
    }

    if (hasData) {
      this.isRefreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);

    this.http.get<any[]>(`${this.baseUrl}${API_CONFIG.endpoints.notifications}`).pipe(
      map((items) =>
        (Array.isArray(items) ? items : []).map((n) => ({
          id: n.id ? String(n.id) : `notif-${Date.now()}`,
          title: n.title || 'Notification Fotolou',
          message: n.message || '',
          type: (n.type ? String(n.type).toLowerCase() : 'system') as any,
          recipientRole: (n.recipientRole ? String(n.recipientRole).toLowerCase() : 'client') as any,
          createdAt: n.createdAt || n.createdDate || new Date().toISOString(),
          isRead: Boolean(n.isRead),
          targetRoute: n.targetRoute
        }))
      ),
      tap((data) => {
        this.notifications.set(data);
        this.lastFetchedAt = Date.now();
      }),
      catchError((err) => {
        console.error('[NotificationService] Error loading notifications:', err);
        if (!hasData) {
          this.error.set('Impossible de charger les notifications.');
        }
        return of([]);
      }),
      finalize(() => {
        this.loading.set(false);
        this.isRefreshing.set(false);
      })
    ).subscribe();
  }

  markAsRead(id: string): Observable<AppNotification | null> {
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    return this.http.patch<AppNotification>(`${this.baseUrl}${API_CONFIG.endpoints.notifications}/${id}/read`, {}).pipe(
      catchError((err) => {
        console.warn(`[NotificationService] API patch failed for ${id}:`, err);
        return of(null);
      })
    );
  }

  markAllAsRead(role: 'client' | 'coiffeur' = 'client'): void {
    this.notifications.update((list) =>
      list.map((n) => (n.recipientRole === role ? { ...n, isRead: true } : n))
    );

    this.http.put(`${this.baseUrl}${API_CONFIG.endpoints.notifications}/mark-all-read`, {}).pipe(
      catchError((err) => {
        console.warn('[NotificationService] mark-all-read backend failed:', err);
        return of(null);
      })
    ).subscribe();
  }

  markAllAsReadByRole(role: 'client' | 'coiffeur'): void {
    this.markAllAsRead(role);
  }

  deleteNotification(id: string): Observable<boolean> {
    this.notifications.update((list) => list.filter((n) => n.id !== id));

    return this.http.delete(`${this.baseUrl}${API_CONFIG.endpoints.notifications}/${id}`).pipe(
      map(() => true),
      catchError((err) => {
        console.warn(`[NotificationService] API delete failed for ${id}:`, err);
        return of(true);
      })
    );
  }
}
