import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-error-state',
  template: `
    <div class="error-state" role="alert">
      <div class="error-state__icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      <h3 class="error-state__title">{{ title }}</h3>
      <p class="error-state__message">{{ message }}</p>

      @if (showRetry) {
        <button type="button" class="error-state__btn" (click)="retry.emit()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          <span>{{ retryLabel }}</span>
        </button>
      }
    </div>
  `,
  styleUrl: './error-state.component.scss'
})
export class ErrorStateComponent {
  @Input() title = 'Une erreur est survenue';
  @Input() message = 'Impossible de charger les informations. Veuillez vérifier votre connexion.';
  @Input() retryLabel = 'Réessayer';
  @Input() showRetry = true;

  @Output() retry = new EventEmitter<void>();
}
