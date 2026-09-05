import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Salon } from '../../models/salon';
import { StatusBadge } from '../status-badge/status-badge';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-salon-list-card',
  imports: [RouterLink, StatusBadge],
  template: `
    <a class="salon-list-card" [routerLink]="['/client/salons', salon.id]">
      <div class="salon-list-card__img-wrap">
        <img class="salon-list-card__image" [src]="salon.avatarUrl" [alt]="salon.name" loading="lazy" />
      </div>

      <div class="salon-list-card__body">
        <div class="salon-list-card__title-row">
          <strong class="salon-list-card__name">{{ salon.name }}</strong>
          
          <div class="salon-list-card__actions">
            <app-status-badge [status]="salon.status" />
            
            <button
              type="button"
              class="salon-list-card__fav-btn"
              [class.salon-list-card__fav-btn--active]="isFav()"
              (click)="onToggleFavorite($event)"
              [attr.aria-label]="isFav() ? 'Retirer des favoris' : 'Ajouter aux favoris'"
            >
              <svg viewBox="0 0 24 24" [attr.fill]="isFav() ? '#ef4444' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        </div>

        <span class="salon-list-card__location">📍 {{ salon.location }}</span>
        @if (salon.ownerName || salon.coiffeurName) {
          <span class="salon-list-card__owner" style="font-size: 0.75rem; color: #1E5AF0; font-weight: 600; display: block; margin-top: 2px;">
            ✂️ {{ salon.ownerName || salon.coiffeurName }}
          </span>
        }
        
        <div class="salon-list-card__queue">
          <strong>{{ salon.peopleWaiting }}</strong> personnes en attente
        </div>
      </div>
    </a>
  `,
  styleUrl: './salon-list-card.scss'
})
export class SalonListCard {
  private readonly favoritesService = inject(FavoritesService);

  @Input({ required: true }) salon!: Salon;

  protected isFav(): boolean {
    return this.favoritesService.isFavorite(this.salon.id);
  }

  protected onToggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoritesService.toggleFavorite(this.salon);
  }
}
