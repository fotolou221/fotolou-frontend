import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { SearchBar } from '../../../shared/components/search-bar/search-bar';
import { SalonListCard } from '../../../shared/components/salon-list-card/salon-list-card';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { FavoritesService } from '../../../shared/services/favorites.service';
import { Salon } from '../../../shared/models/salon';

@Component({
  selector: 'app-favorites-page',
  imports: [
    ClientLayout,
    PageHeader,
    SearchBar,
    SalonListCard,
    EmptyStateComponent
  ],
  template: `
    <app-client-layout activeNav="home">
      <!-- Page Header -->
      <app-page-header
        slot="header"
        title="Mes Salons Favoris"
        [subtitle]="subtitleText()"
        backRoute="/client/home"
      />

      <!-- Content Container -->
      <div class="favorites-page">
        
        <!-- Search filter among favorites (if > 1 favorite) -->
        @if (favoritesService.count() > 1) {
          <div class="favorites-page__search">
            <app-search-bar
              [value]="searchQuery()"
              (valueChange)="searchQuery.set($event)"
              placeholder="Filtrer mes favoris..."
            />
          </div>
        }

        <!-- List of Favorite Salons -->
        @if (favoritesService.hasFavorites()) {
          <div class="favorites-page__content">
            
            <div class="favorites-page__info-bar">
              <span class="favorites-page__count-badge">
                ❤️ {{ filteredFavorites().length }} salon{{ filteredFavorites().length > 1 ? 's' : '' }} en favoris
              </span>
              <p class="favorites-page__hint">
                Accédez directement à vos files d'attente habituelles
              </p>
            </div>

            <div class="favorites-page__list">
              @for (salon of filteredFavorites(); track salon.id) {
                <app-salon-list-card [salon]="salon" />
              } @empty {
                <app-empty-state
                  icon="search"
                  title="Aucun favori ne correspond à la recherche"
                  description="Essayez un autre terme de recherche."
                  actionLabel="Effacer la recherche"
                  (action)="searchQuery.set('')"
                />
              }
            </div>

          </div>
        } @else {
          <!-- Empty State when 0 favorites -->
          <div class="favorites-page__empty">
            <app-empty-state
              icon="ticket"
              title="Aucun salon favori pour le moment"
              description="Ajoutez vos salons préférés en touchant l'icône ❤️ pour les retrouver instantanément ici sans avoir à chercher."
              actionLabel="Découvrir les salons"
              (action)="goToHome()"
            />
          </div>
        }

      </div>
    </app-client-layout>
  `,
  styleUrl: './favorites-page.scss'
})
export class FavoritesPage {
  private readonly router = inject(Router);
  protected readonly favoritesService = inject(FavoritesService);

  protected readonly searchQuery = signal<string>('');

  protected readonly subtitleText = computed(() => {
    const count = this.favoritesService.count();
    if (count === 0) return 'Aucun salon enregistré';
    return `${count} salon${count > 1 ? 's' : ''} enregistré${count > 1 ? 's' : ''}`;
  });

  protected readonly filteredFavorites = computed<Salon[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.favoritesService.favoriteSalons();
    if (!query) return list;
    return list.filter((s) =>
      s.name.toLowerCase().includes(query) ||
      s.location.toLowerCase().includes(query) ||
      s.district.toLowerCase().includes(query)
    );
  });

  protected goToHome(): void {
    this.router.navigate(['/client/home']);
  }
}
