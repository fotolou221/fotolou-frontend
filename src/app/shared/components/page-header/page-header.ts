import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  template: `
    <header class="page-header" [class.page-header--transparent]="transparent">
      @if (showBack) {
        @if (backRoute) {
          <a [routerLink]="backRoute" class="page-header__back-btn" aria-label="Retour">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </a>
        } @else {
          <button type="button" class="page-header__back-btn" (click)="backClick.emit()" aria-label="Retour">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
        }
      }

      @if (title) {
        <div class="page-header__title-wrap">
          <h2 class="page-header__title">{{ title }}</h2>
          @if (subtitle) {
            <span class="page-header__subtitle">{{ subtitle }}</span>
          }
        </div>
      }
    </header>
  `,
  styleUrl: './page-header.scss'
})
export class PageHeader {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() showBack = true;
  @Input() backRoute?: string;
  @Input() transparent = false;

  @Output() backClick = new EventEmitter<void>();
}
