import { Injectable, inject, signal, effect, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map, finalize } from 'rxjs';
import { Relative, RelativeRelation, RELATION_LABELS } from '../models/relative';
import { API_CONFIG } from '../../core/config/api.config';
import { AuthSessionService } from '../../features/auth/auth-session.service';
import { HttpErrorMessageService } from './http-error-message.service';

@Injectable({ providedIn: 'root' })
export class RelativeService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthSessionService);
  private readonly errorMessages = inject(HttpErrorMessageService);
  private readonly baseUrl = API_CONFIG.baseUrl;

  readonly relatives = signal<readonly Relative[]>([]);
  readonly loading = signal<boolean>(false);
  readonly isRefreshing = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // ── Cache Strategy (SWR - 2 min TTL) ────────────────────────
  private lastFetchedAt: number | null = null;
  private readonly CACHE_TTL_MS = 2 * 60 * 1000;
  private requestInFlight = false;

  constructor() {
    // Whenever user auth changes (login, logout, switch account), reload or reset relatives
    effect(() => {
      const user = this.auth.currentUser();
      untracked(() => {
        if (user && user.id !== 'guest') {
          this.loadRelatives(true);
        } else {
          this.relatives.set([]);
          this.lastFetchedAt = null;
          this.requestInFlight = false;
          this.loading.set(false);
          this.isRefreshing.set(false);
          this.error.set(null);
        }
      });
    });
  }

  getRelativeLabel(relation: RelativeRelation): string {
    return RELATION_LABELS[relation];
  }

  loadRelatives(forceRefresh: boolean = false): void {
    const user = this.auth.currentUser();
    if (!user || user.id === 'guest') {
      this.relatives.set([]);
      this.lastFetchedAt = null;
      this.loading.set(false);
      this.isRefreshing.set(false);
      return;
    }

    const now = Date.now();
    const hasData = this.relatives().length > 0;
    const isCacheValid = this.lastFetchedAt !== null && (now - this.lastFetchedAt) < this.CACHE_TTL_MS;

    if (hasData && isCacheValid && !forceRefresh) {
      return;
    }

    if (this.requestInFlight) {
      return;
    }

    if (hasData) {
      this.isRefreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);
    this.requestInFlight = true;

    this.http.get<any[]>(`${this.baseUrl}${API_CONFIG.endpoints.relatives}`).pipe(
      map((data) =>
        Array.isArray(data)
          ? data.map((r) => ({
              id: r.id ? r.id.toString() : `r-${Date.now()}`,
              name: r.name || '',
              relation: (r.relation ? r.relation.toLowerCase() : 'other') as RelativeRelation,
              phone: r.phone || undefined
            }))
          : []
      ),
      tap((data) => {
        this.relatives.set(data);
        this.lastFetchedAt = Date.now();
      }),
      catchError((err) => {
        console.error('[RelativeService] Error loading relatives:', err);
        this.error.set(this.errorMessages.message(err, 'Impossible de charger vos proches. Verifiez votre connexion.'));
        return of([]);
      }),
      finalize(() => {
        this.requestInFlight = false;
        this.loading.set(false);
        this.isRefreshing.set(false);
      })
    ).subscribe();
  }

  getRelativeById(id: string | null): Observable<Relative | null> {
    if (!id) return of(null);
    return this.http.get<Relative>(`${this.baseUrl}${API_CONFIG.endpoints.relatives}/${id}`).pipe(
      catchError((err) => {
        console.error(`[RelativeService] Error loading relative ${id}:`, err);
        this.error.set(this.errorMessages.message(err, 'Impossible de charger ce proche.'));
        return of(this.relatives().find((r) => r.id === id) || null);
      })
    );
  }

  addRelative(name: string, relation: RelativeRelation, phone?: string): Observable<Relative> {
    const payload = {
      name: name.trim(),
      relation: relation.toUpperCase(),
      phone: phone?.trim() || undefined
    };

    return this.http.post<any>(`${this.baseUrl}${API_CONFIG.endpoints.relatives}`, payload).pipe(
      map((saved) => ({
        id: saved.id ? saved.id.toString() : `r-${Date.now()}`,
        name: saved.name || name.trim(),
        relation: (saved.relation ? saved.relation.toLowerCase() : relation) as RelativeRelation,
        phone: saved.phone || phone?.trim()
      })),
      tap((savedRelative) => {
        this.relatives.update((prev) => [...prev.filter((r) => r.id !== savedRelative.id), savedRelative]);
      }),
      catchError((err) => {
        console.warn('[RelativeService] API post failed, using local relative:', err);
        this.error.set(this.errorMessages.message(err, 'Proche ajoute localement. Connexion instable, verifiez votre reseau.'));
        const localRelative: Relative = {
          id: `r-${Date.now()}`,
          name: name.trim(),
          relation,
          phone: phone?.trim() || undefined
        };
        this.relatives.update((prev) => [...prev, localRelative]);
        return of(localRelative);
      })
    );
  }

  updateRelative(id: string, name: string, relation: RelativeRelation, phone?: string): Observable<Relative | null> {
    const numericId = Number(id) || null;
    const payload = {
      id: numericId,
      name: name.trim(),
      relation: relation.toUpperCase(),
      phone: phone?.trim() || undefined
    };

    const updatedLocal: Relative = {
      id,
      name: name.trim(),
      relation,
      phone: phone?.trim() || undefined
    };

    this.relatives.update((prev) =>
      prev.map((r) => (r.id === id ? updatedLocal : r))
    );

    return this.http.put<any>(`${this.baseUrl}${API_CONFIG.endpoints.relatives}/${id}`, payload).pipe(
      map((saved) => ({
        id: saved.id ? saved.id.toString() : id,
        name: saved.name || name.trim(),
        relation: (saved.relation ? saved.relation.toLowerCase() : relation) as RelativeRelation,
        phone: saved.phone || phone?.trim()
      })),
      catchError((err) => {
        console.warn(`[RelativeService] API put failed for ${id}:`, err);
        this.error.set(this.errorMessages.message(err, 'Modification gardee localement. Connexion instable, verifiez votre reseau.'));
        return of(updatedLocal);
      })
    );
  }

  removeRelative(id: string): Observable<boolean> {
    this.relatives.update((prev) => prev.filter((r) => r.id !== id));

    return this.http.delete(`${this.baseUrl}${API_CONFIG.endpoints.relatives}/${id}`).pipe(
      map(() => true),
      catchError((err) => {
        console.warn(`[RelativeService] API delete failed for ${id}:`, err);
        this.error.set(this.errorMessages.message(err, 'Suppression gardee localement. Connexion instable, verifiez votre reseau.'));
        return of(true);
      })
    );
  }
}
