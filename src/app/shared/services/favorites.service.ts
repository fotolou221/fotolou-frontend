import { Injectable, signal, computed, inject, effect, PLATFORM_ID, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { Salon } from '../models/salon';
import { SalonService } from './salon.service';
import { API_CONFIG } from '../../core/config/api.config';
import { AuthSessionService } from '../../features/auth/auth-session.service';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly salonService = inject(SalonService);
  private readonly auth = inject(AuthSessionService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.baseUrl;
  private readonly STORAGE_KEY = 'fotolou_favorite_salons';

  // ── Reactive Signals ─────────────────────────────────────────
  readonly favoriteIds = signal<string[]>([]);

  // Computes the full Salon objects for all favorited IDs that actually exist on the platform
  readonly favoriteSalons = computed<Salon[]>(() => {
    const ids = new Set(this.favoriteIds());
    if (ids.size === 0) return [];
    const all = this.salonService.salons();
    return all.filter((s) => ids.has(s.id) || (s.slug ? ids.has(s.slug) : false));
  });

  // Count is strictly based on actual, existing favorite salons (never ghost/stale IDs)
  readonly count = computed(() => this.favoriteSalons().length);
  readonly hasFavorites = computed(() => this.count() > 0);

  constructor() {
    this.loadFavoritesFromStorage();
    this.loadFavoritesFromApi();

    // Whenever salons are loaded, clean up any orphan/purged IDs from local storage
    effect(() => {
      const salons = this.salonService.salons();
      if (salons.length > 0 && this.favoriteIds().length > 0) {
        this.sanitizeStoredFavorites();
      }
    });

    // Whenever user auth changes (login/logout), reload favorites
    effect(() => {
      const user = this.auth.currentUser();
      untracked(() => {
        if (user && user.id !== 'guest') {
          this.loadFavoritesFromApi();
        }
      });
    });
  }

  loadFavoritesFromApi(): void {
    this.http.get<any[]>(`${this.baseUrl}/favorites/my-favorites`).pipe(
      tap((favorites) => {
        if (Array.isArray(favorites)) {
          // Backend returns List<SalonDTO> directly: each object has id, slug, etc.
          const ids = favorites
            .map((f) => f.slug || (f.id ? f.id.toString() : null) || f.salon?.slug || f.salon?.id?.toString() || f.salonId?.toString())
            .filter(Boolean) as string[];

          this.favoriteIds.set(ids);
          this.saveFavoritesToStorage();
        }
      }),
      catchError(() => {
        this.sanitizeStoredFavorites();
        return of([]);
      })
    ).subscribe();
  }

  private sanitizeStoredFavorites(): void {
    const all = this.salonService.salons();
    if (all.length > 0) {
      const validIdentifiers = new Set<string>();
      for (const s of all) {
        if (s.id) validIdentifiers.add(s.id);
        if (s.slug) validIdentifiers.add(s.slug);
      }
      const valid = this.favoriteIds().filter((id) => validIdentifiers.has(id));
      if (valid.length !== this.favoriteIds().length) {
        this.favoriteIds.set(valid);
        this.saveFavoritesToStorage();
      }
    }
  }

  private loadFavoritesFromStorage(): void {
    if (!this.isBrowser) return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.favoriteIds.set(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('[FavoritesService] Failed to load favorites from localStorage', e);
    }
    this.favoriteIds.set([]);
  }

  private saveFavoritesToStorage(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.favoriteIds()));
    } catch (e) {
      console.warn('[FavoritesService] Failed to save favorites to localStorage', e);
    }
  }

  isFavorite(salonId: string): boolean {
    if (!salonId) return false;
    const ids = this.favoriteIds();
    if (ids.includes(salonId)) return true;
    const salon = this.salonService.salons().find((s) => s.id === salonId || s.slug === salonId);
    if (salon) {
      return Boolean((salon.slug && ids.includes(salon.slug)) || (salon.id && ids.includes(salon.id)));
    }
    return false;
  }

  toggleFavorite(salon: Salon): boolean {
    const current = this.favoriteIds();
    const salonIdentifier = salon.slug || salon.id;
    const exists = current.includes(salon.id) || (salon.slug ? current.includes(salon.slug) : false);
    let updated: string[];

    if (exists) {
      updated = current.filter((id) => id !== salon.id && id !== salon.slug);
    } else {
      updated = [salonIdentifier, ...current];
    }

    this.favoriteIds.set(updated);
    this.saveFavoritesToStorage();

    // Call backend API with numeric ID if available
    const numericId = salon.numericId || (Number(salon.id) && !isNaN(Number(salon.id)) ? Number(salon.id) : null);
    if (numericId) {
      this.http.post(`${this.baseUrl}/favorites/toggle`, { salonId: numericId }).pipe(
        catchError(() => of(null))
      ).subscribe();
    }

    return !exists;
  }

  addFavorite(salonId: string): void {
    if (!this.favoriteIds().includes(salonId)) {
      this.favoriteIds.update((prev) => [salonId, ...prev]);
      this.saveFavoritesToStorage();
    }
  }

  removeFavorite(salonId: string): void {
    this.favoriteIds.update((prev) => prev.filter((id) => id !== salonId));
    this.saveFavoritesToStorage();
  }

  clearAll(): void {
    this.favoriteIds.set([]);
    this.saveFavoritesToStorage();
  }
}
