import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink],
  template: `
    <div class="product-card">
      <!-- Image link -->
      <a [routerLink]="['/client/boutique/produits', product.id]" class="product-card__image-wrap">
        <img [src]="product.images[0]" [alt]="product.title" class="product-card__image" loading="lazy" />
      </a>

      <!-- Brand & Rating row -->
      <div class="product-card__meta">
        <span class="product-card__brand">{{ product.brand }}</span>
        <span class="product-card__rating">
          <span class="product-card__star" aria-hidden="true">&#9733;</span>
          {{ product.rating }}
        </span>
      </div>

      <!-- Title -->
      <a [routerLink]="['/client/boutique/produits', product.id]" class="product-card__title">
        {{ product.title }}
      </a>

      <!-- Dual Prices: Actual & Strikethrough -->
      <div class="product-card__price-wrap">
        <span class="product-card__current-price">{{ formattedPrice }}</span>
        @if (product.oldPrice) {
          <span class="product-card__old-price">{{ formattedOldPrice }}</span>
        }
      </div>

      <!-- Add to Cart CTA Button -->
      <button type="button" class="product-card__add-btn" (click)="onAddToCart($event)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span>Ajouter au panier</span>
      </button>
    </div>
  `,
  styleUrl: './product-card.scss'
})
export class ProductCard {
  @Input({ required: true }) product!: Product;

  private readonly cartService = inject(CartService);

  protected get formattedPrice(): string {
    return `${this.product.price.toLocaleString('fr-FR')}fcfa`;
  }

  protected get formattedOldPrice(): string {
    return this.product.oldPrice ? `${this.product.oldPrice.toLocaleString('fr-FR')}fcfa` : '';
  }

  protected onAddToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.cartService.addToCart(this.product, 1);
  }
}
