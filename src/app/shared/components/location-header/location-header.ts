import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-location-header',
  template: `
    <header class="location-header">
      @if (showLocation) {
        <button class="location-header__selector" (click)="locationClick.emit()" type="button">
          <span class="location-header__pin-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </span>
          <span class="location-header__text">{{ location }}</span>
          <span class="location-header__chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </span>
        </button>
      } @else {
        <div class="location-header__spacer"></div>
      }

      <!-- Right Action Icons: Favorites + Notifications -->
      <div class="location-header__actions">
        
        <!-- Favorites Button -->
        <button
          class="location-header__action-btn location-header__fav-btn"
          (click)="onFavoritesClick()"
          type="button"
          aria-label="Mes Salons Favoris"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          @if (favoritesCount > 0) {
            <span class="location-header__fav-badge">{{ favoritesCount }}</span>
          }
        </button>

        <!-- Notification Bell -->
        <button
          class="location-header__action-btn location-header__notification-btn"
          (click)="onNotificationClick()"
          type="button"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          @if (hasNotification) {
            <span class="location-header__unread-dot"></span>
          }
        </button>

      </div>
    </header>
  `,
  styleUrl: './location-header.scss'
})
export class LocationHeader {
  private readonly favoritesService = inject(FavoritesService);
  private readonly router = inject(Router);

  @Input() location = 'Dakar, Sénégal';
  @Input() showLocation = true;
  @Input() hasNotification = true;

  @Output() locationClick = new EventEmitter<void>();
  @Output() notificationClick = new EventEmitter<void>();
  @Output() favoritesClick = new EventEmitter<void>();

  protected get favoritesCount(): number {
    return this.favoritesService.count();
  }

  protected onFavoritesClick(): void {
    if (this.favoritesClick.observed) {
      this.favoritesClick.emit();
    } else {
      this.router.navigate(['/client/favorites']);
    }
  }

  protected onNotificationClick(): void {
    if (this.notificationClick.observed) {
      this.notificationClick.emit();
    } else {
      this.router.navigate(['/client/notifications']);
    }
  }
}
