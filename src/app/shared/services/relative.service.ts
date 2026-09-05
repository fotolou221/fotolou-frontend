import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { Relative, RelativeRelation, RELATION_LABELS } from '../models/relative';
import { API_CONFIG } from '../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class RelativeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.baseUrl;

  readonly relatives = signal<readonly Relative[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadRelatives();
  }

  getRelativeLabel(relation: RelativeRelation): string {
    return RELATION_LABELS[relation];
  }

  loadRelatives(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<any[]>(`${this.baseUrl}${API_CONFIG.endpoints.relatives}`).pipe(
      map((data) =>
        data.map((r) => ({
          id: r.id ? r.id.toString() : `r-${Date.now()}`,
          name: r.name || '',
          relation: (r.relation ? r.relation.toLowerCase() : 'other') as RelativeRelation,
          phone: r.phone || undefined
        }))
      ),
      tap((data) => {
        this.relatives.set(data);
        this.loading.set(false);
      }),
      catchError((err) => {
        console.error('[RelativeService] Error loading relatives:', err);
        this.error.set('Impossible de charger vos proches.');
        this.loading.set(false);
        return of([]);
      })
    ).subscribe();
  }

  getRelativeById(id: string | null): Observable<Relative | null> {
    if (!id) return of(null);
    return this.http.get<Relative>(`${this.baseUrl}${API_CONFIG.endpoints.relatives}/${id}`).pipe(
      catchError((err) => {
        console.error(`[RelativeService] Error loading relative ${id}:`, err);
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
        return of(true);
      })
    );
  }
}
