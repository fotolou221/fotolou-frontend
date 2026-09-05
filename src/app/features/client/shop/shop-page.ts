import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { SearchBar } from '../../../shared/components/search-bar/search-bar';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { ProductService } from '../../../shared/services/product.service';
import { CartService } from '../../../shared/services/cart.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-shop-page',
  imports: [
    ClientLayout,
    SearchBar,
    ProductCard,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    RouterLink
  ],
  template: `
    <app-client-layout activeNav="shop" [hasHeaderSlot]="true">
      <!-- Fixed Header Slot -->
      <header slot="header" class="shop-header">
        <h1 class="shop-header__title">Fotolou Boutique</h1>

        <!-- Header Actions: Notification Bell + Cart Button -->
        <div class="shop-header__actions">
          <!-- Notification Bell Button -->
          <button
            type="button"
            class="shop-header__icon-btn"
            (click)="goToNotifications()"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            @if (notificationService.unreadCount() > 0) {
              <span class="shop-header__unread-dot"></span>
            }
          </button>

          <!-- Cart button with badge count -->
          <a routerLink="/client/boutique/panier" class="shop-header__cart-btn" aria-label="Mon Panier">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            @if (cartService.cartCount() > 0) {
              <span class="shop-header__cart-badge">{{ cartService.cartCount() }}</span>
            }
          </a>
        </div>
      </header>

      <!-- Main Content -->
      <div class="shop-page__content">
        <!-- Search Input -->
        <div class="shop-page__search">
          <app-search-bar
            placeholder="Rechercher un produit, marque..."
            [value]="productService.searchQuery()"
            (valueChange)="productService.searchQuery.set($event)"
          />
        </div>

        <!-- Categories Section -->
        @if (productService.categories().length > 0) {
          <section class="shop-page__categories-section">
            <h2 class="shop-page__section-title">Catégories</h2>
            <div class="shop-page__categories-scroll">
              @for (cat of productService.categories(); track cat.id) {
                <button
                  type="button"
                  class="shop-page__category-item"
                  [class.shop-page__category-item--active]="productService.selectedCategory() === cat.id"
                  (click)="productService.toggleCategory(cat.id)"
                >
                  <div class="shop-page__category-thumb">
                    <img [src]="cat.image" [alt]="cat.name" loading="lazy" />
                  </div>
                  <span class="shop-page__category-name">{{ cat.name }}</span>
                </button>
              }
            </div>
          </section>
        }

        <!-- Products Grid Section -->
        <section class="shop-page__products-section">
          <div class="shop-page__section-header">
            <h2 class="shop-page__section-title">Produits disponibles</h2>
            @if (productService.selectedCategory()) {
              <button
                type="button"
                class="shop-page__reset-filter"
                (click)="productService.selectedCategory.set(null)"
              >
                Réinitialiser le filtre
              </button>
            }
          </div>

          @if (productService.loading()) {
            <app-skeleton-loader type="product" [count]="6" />
          } @else if (productService.error()) {
            <app-error-state
              [message]="productService.error()!"
              (retry)="productService.loadAll()"
            />
          } @else {
            <div class="shop-page__products-grid">
              @for (product of productService.filteredProducts(); track product.id) {
                <app-product-card [product]="product" />
              }
            </div>

            @if (productService.filteredProducts().length === 0) {
              <app-empty-state
                icon="shop"
                [title]="emptyTitle()"
                [description]="emptyDescription()"
                [actionLabel]="emptyActionLabel()"
                (action)="resetFilters()"
              />
            }
          }
        </section>
      </div>
    </app-client-layout>
  `,
  styleUrl: './shop-page.scss'
})
export class ShopPage {
  private readonly router = inject(Router);
  protected readonly productService = inject(ProductService);
  protected readonly cartService = inject(CartService);
  protected readonly notificationService = inject(NotificationService);

  protected readonly emptyTitle = computed(() => {
    return this.productService.products().length === 0
      ? 'Boutique en cours d\'approvisionnement'
      : 'Aucun produit trouvé';
  });

  protected readonly emptyDescription = computed(() => {
    return this.productService.products().length === 0
      ? 'Les produits et matériels de coiffure professionnels seront bientôt disponibles.'
      : 'Aucun article ne correspond à votre recherche.';
  });

  protected readonly emptyActionLabel = computed(() => {
    return (this.productService.selectedCategory() || this.productService.searchQuery())
      ? 'Réinitialiser les filtres'
      : undefined;
  });

  protected resetFilters(): void {
    this.productService.selectedCategory.set(null);
    this.productService.searchQuery.set('');
  }

  protected goToNotifications(): void {
    this.router.navigate(['/client/notifications']);
  }
}
