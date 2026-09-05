import { Component, Input } from '@angular/core';

export type SkeletonType = 'salon' | 'product' | 'ticket' | 'profile' | 'list' | 'card';

@Component({
  selector: 'app-skeleton-loader',
  template: `
    <div class="skeleton-container" [class]="'skeleton-container--' + type">
      @for (item of items; track $index) {
        @if (type === 'salon') {
          <div class="skeleton-card skeleton-salon">
            <div class="skeleton-box skeleton-salon__avatar"></div>
            <div class="skeleton-salon__content">
              <div class="skeleton-box skeleton-salon__title"></div>
              <div class="skeleton-box skeleton-salon__subtitle"></div>
              <div class="skeleton-box skeleton-salon__badge"></div>
            </div>
          </div>
        } @else if (type === 'product') {
          <div class="skeleton-card skeleton-product">
            <div class="skeleton-box skeleton-product__img"></div>
            <div class="skeleton-box skeleton-product__brand"></div>
            <div class="skeleton-box skeleton-product__title"></div>
            <div class="skeleton-box skeleton-product__price"></div>
          </div>
        } @else if (type === 'ticket') {
          <div class="skeleton-card skeleton-ticket">
            <div class="skeleton-ticket__header">
              <div class="skeleton-box skeleton-ticket__title"></div>
              <div class="skeleton-box skeleton-ticket__number"></div>
            </div>
            <div class="skeleton-box skeleton-ticket__line"></div>
            <div class="skeleton-box skeleton-ticket__line skeleton-ticket__line--short"></div>
          </div>
        } @else if (type === 'profile') {
          <div class="skeleton-card skeleton-profile">
            <div class="skeleton-box skeleton-profile__avatar"></div>
            <div class="skeleton-box skeleton-profile__name"></div>
            <div class="skeleton-box skeleton-profile__phone"></div>
          </div>
        } @else {
          <!-- Generic List / Row Skeleton -->
          <div class="skeleton-card skeleton-row">
            <div class="skeleton-box skeleton-row__icon"></div>
            <div class="skeleton-row__text">
              <div class="skeleton-box skeleton-row__title"></div>
              <div class="skeleton-box skeleton-row__desc"></div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styleUrl: './skeleton-loader.component.scss'
})
export class SkeletonLoaderComponent {
  @Input() type: SkeletonType = 'card';
  @Input() count = 1;

  get items(): number[] {
    return Array.from({ length: Math.max(1, this.count) }, (_, i) => i);
  }
}
