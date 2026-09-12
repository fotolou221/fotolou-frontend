import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';

export interface PublicStats {
  activeUsers: number;
  activeUsersFormatted: string;
  totalSalons: number;
  totalSalonsFormatted: string;
  satisfactionRate: number;
  satisfactionRateFormatted: string;
  serviceAvailability: string;
  totalTicketsServed?: number;
  totalOrders?: number;
}

export const DEFAULT_VITRINE_STATS: PublicStats = {
  activeUsers: 10000,
  activeUsersFormatted: '+10 000',
  totalSalons: 500,
  totalSalonsFormatted: '+500',
  satisfactionRate: 98,
  satisfactionRateFormatted: '98%',
  serviceAvailability: '24/7'
};

@Injectable({
  providedIn: 'root'
})
export class VitrineStatsService {
  private readonly http = inject(HttpClient);

  /**
   * Récupère les métriques publiques réelles depuis le backend Spring Boot.
   * En cas d'indisponibilité momentanée du serveur, retourne les valeurs de référence par défaut.
   */
  getPublicStats(): Observable<PublicStats> {
    return this.http.get<PublicStats>(`${API_CONFIG.baseUrl}/public/stats`).pipe(
      catchError((err) => {
        // Fallback vers l'alias /vitrine/stats si nécessaire
        return this.http.get<PublicStats>(`${API_CONFIG.baseUrl}/vitrine/stats`).pipe(
          catchError((fallbackErr) => {
            console.warn('[VitrineStatsService] Backend non disponible, utilisation des stats par défaut :', fallbackErr);
            return of(DEFAULT_VITRINE_STATS);
          })
        );
      })
    );
  }
}
