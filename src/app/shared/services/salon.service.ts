import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map, finalize, throwError } from 'rxjs';
import { Salon } from '../models/salon';
import { TicketOwner } from '../models/ticket-owner';
import { API_CONFIG } from '../../core/config/api.config';
import { HttpErrorMessageService } from './http-error-message.service';

export const DEFAULT_TICKET_OWNERS: readonly TicketOwner[] = [
  {
    id: 'self',
    type: 'self',
    name: 'Moi-même',
    subtitle: 'Mon compte',
    avatarInitials: 'M'
  },
  {
    id: 'custom',
    type: 'custom',
    name: 'Autre personne',
    subtitle: 'Saisir un nom personnalisé',
    isCustomInput: true
  }
];

@Injectable({
  providedIn: 'root'
})
export class SalonService {
  private readonly http = inject(HttpClient);
  private readonly errorMessages = inject(HttpErrorMessageService);
  private readonly baseUrl = API_CONFIG.baseUrl;

  // ── State Signals ───────────────────────────────────────────
  readonly salons = signal<readonly Salon[]>([]);
  readonly loading = signal<boolean>(false);
  readonly isRefreshing = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // ── Cache Strategy (SWR - 5 min TTL) ────────────────────────
  private lastFetchedAt: number | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  readonly searchQuery = signal<string>('');
  readonly currentLocation = signal<string>('Dakar, Sénégal');
  readonly selectedOwner = signal<TicketOwner>(DEFAULT_TICKET_OWNERS[0]);
  readonly customOwnerName = signal<string>('');

  // ── Filtered Salons Computed ────────────────────────────────
  readonly filteredSalons = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.salons();
    if (!query) {
      return list;
    }
    return list.filter(
      (salon) =>
        salon.name.toLowerCase().includes(query) ||
        salon.location.toLowerCase().includes(query) ||
        salon.district.toLowerCase().includes(query)
    );
  });

  constructor() {
    this.loadSalons();
  }

  loadSalons(forceRefresh: boolean = false): void {
    const now = Date.now();
    const hasData = this.salons().length > 0;
    const isCacheValid = this.lastFetchedAt !== null && (now - this.lastFetchedAt) < this.CACHE_TTL_MS;

    // Cache-first : si déjà en mémoire et encore valide, pas d'appel réseau
    if (hasData && isCacheValid && !forceRefresh) {
      return;
    }

    // Si on a déjà les données, rafraîchissement silencieux (pas de skeleton bloquant)
    if (hasData) {
      this.isRefreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);

    this.http.get<any[]>(`${this.baseUrl}${API_CONFIG.endpoints.salons}`).pipe(
      map((data) =>
        data.map((s) => ({
          ...s,
          numericId: typeof s.id === 'number' ? s.id : (Number(s.id) || undefined),
          id: s.slug || (s.id ? s.id.toString() : 'salon'),
          status: s.status ? s.status.toLowerCase() : 'open',
          avatarUrl: s.avatarUrl || 'images/salons/king-barber-avatar.png',
          coverUrl: s.coverUrl || 'images/salons/king-barber-cover.png',
          actions: Array.isArray(s.actions) && s.actions.length > 0
            ? s.actions
            : [
                { label: 'Site Web', icon: 'globe' as const, href: 'https://kingbarber.sn' },
                { label: 'Appeler', icon: 'phone' as const, href: `tel:${s.phone || '+221778627052'}` },
                { label: 'Direction', icon: 'navigation' as const, href: 'https://maps.google.com' },
                { label: 'Partager', icon: 'share' as const, href: '#' }
              ]
        }))
      ),
      tap((data) => {
        this.salons.set(data);
        this.lastFetchedAt = Date.now();
      }),
      catchError((err) => {
        console.error('[SalonService] Error fetching salons:', err);
        const message = this.errorMessages.message(err, 'Impossible de charger les salons. Verifiez votre connexion.');
        if (!hasData) {
          this.error.set(message);
        } else {
          this.error.set(message);
        }
        return of([]);
      }),
      finalize(() => {
        this.loading.set(false);
        this.isRefreshing.set(false);
      })
    ).subscribe();
  }

  getSalonById(id: string | null): Observable<Salon | null> {
    if (!id) return of(null);
    return this.http.get<any>(`${this.baseUrl}${API_CONFIG.endpoints.salons}/${id}`).pipe(
      map((s) => ({
        ...s,
        numericId: typeof s.id === 'number' ? s.id : (Number(s.id) || undefined),
        id: s.slug || (s.id ? s.id.toString() : id),
        status: s.status ? s.status.toLowerCase() : 'open',
        avatarUrl: s.avatarUrl || 'images/salons/king-barber-avatar.png',
        coverUrl: s.coverUrl || 'images/salons/king-barber-cover.png',
        actions: Array.isArray(s.actions) && s.actions.length > 0
          ? s.actions
          : [
              { label: 'Site Web', icon: 'globe' as const, href: 'https://kingbarber.sn' },
              { label: 'Appeler', icon: 'phone' as const, href: `tel:${s.phone || '+221778627052'}` },
              { label: 'Direction', icon: 'navigation' as const, href: 'https://maps.google.com' },
              { label: 'Partager', icon: 'share' as const, href: '#' }
            ]
      })),
      catchError((err) => {
        console.error(`[SalonService] Error fetching salon ${id}:`, err);
        return of(this.salons().find((s) => s.id === id) || null);
      })
    );
  }

  getTicketOwners(): readonly TicketOwner[] {
    return DEFAULT_TICKET_OWNERS;
  }

  selectOwner(owner: TicketOwner): void {
    this.selectedOwner.set(owner);
  }

  setCustomOwnerName(name: string): void {
    this.customOwnerName.set(name);
  }

  toggleSalonStatus(id: number | string): Observable<any> {
    const targetId = id.toString();
    const salon = this.salons().find((s) => this.matchesSalon(s, targetId));
    const apiId = salon?.numericId?.toString() || salon?.id || targetId;
    const previousStatus = salon?.status;
    const newStatus = previousStatus === 'open' ? 'closed' : 'open';

    this.salons.update((list) =>
      list.map((s) =>
        this.matchesSalon(s, targetId) || this.matchesSalon(s, apiId)
          ? { ...s, status: newStatus as any }
          : s
      )
    );

    return this.http.put<any>(`${this.baseUrl}${API_CONFIG.endpoints.salons}/${apiId}/toggle-status`, {}).pipe(
      tap((updated) => {
        if (!updated) return;
        const updatedStatus = updated.status ? String(updated.status).toLowerCase() : newStatus;
        const updatedId = updated.id ? updated.id.toString() : apiId;
        const updatedSlug = updated.slug || salon?.slug;

        this.salons.update((list) =>
          list.map((s) =>
            this.matchesSalon(s, targetId) ||
            this.matchesSalon(s, apiId) ||
            this.matchesSalon(s, updatedId) ||
            (updatedSlug ? this.matchesSalon(s, updatedSlug) : false)
              ? {
                  ...s,
                  numericId: typeof updated.id === 'number' ? updated.id : s.numericId,
                  slug: updatedSlug || s.slug,
                  status: updatedStatus as any
                }
              : s
          )
        );
      }),
      catchError((err) => {
        if (previousStatus) {
          this.salons.update((list) =>
            list.map((s) =>
              this.matchesSalon(s, targetId) || this.matchesSalon(s, apiId)
                ? { ...s, status: previousStatus }
                : s
            )
          );
        }
        console.warn(`[SalonService] toggle-status API failed for salon ${apiId}:`, err);
        const message = this.errorMessages.message(err, 'Impossible de modifier le statut de la boutique. Verifiez votre connexion.');
        this.error.set(message);
        return throwError(() => new Error(message));
      })
    );
  }

  private matchesSalon(salon: Salon, id: string): boolean {
    return (
      salon.id === id ||
      salon.slug === id ||
      (salon.numericId !== undefined && salon.numericId.toString() === id)
    );
  }
}
