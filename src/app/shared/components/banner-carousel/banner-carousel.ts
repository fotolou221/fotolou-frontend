import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-banner-carousel',
  template: `
    <div class="banner-carousel">
      <div class="banner-carousel__slide">
        <img [src]="currentImage" [alt]="altText" class="banner-carousel__image" />
        <div class="banner-carousel__overlay"></div>

        <!-- Central Barber & Salon Badge Overlay -->
        <div class="banner-carousel__badge" aria-hidden="true">
          <div class="banner-carousel__badge-inner">
            <span class="banner-carousel__badge-top">BARBER</span>
            <span class="banner-carousel__badge-amp">&amp;</span>
            <span class="banner-carousel__badge-bottom">SALON</span>
          </div>
        </div>
      </div>

      <!-- Carousel Pagination Dots -->
      @if (images.length > 1) {
        <div class="banner-carousel__dots">
          @for (img of images; track $index) {
            <button
              type="button"
              class="banner-carousel__dot"
              [class.banner-carousel__dot--active]="activeIndex() === $index"
              (click)="selectImage($index)"
              [attr.aria-label]="'Image ' + ($index + 1)"
            ></button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './banner-carousel.scss'
})
export class BannerCarousel {
  @Input() images: readonly string[] = [];
  @Input() altText = 'Salon Banner';

  protected readonly activeIndex = signal<number>(0);

  protected get currentImage(): string {
    return this.images[this.activeIndex()] || 'images/salons/king-barber-cover.png';
  }

  protected selectImage(index: number): void {
    this.activeIndex.set(index);
  }
}
