import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-error-state',
  template: `
    <div
      class="error-state"
      [class.error-state--connection]="isConnectionIssue"
      role="alert"
    >
      <div
        class="error-state__icon-wrap"
        [class.error-state__icon-wrap--connection]="isConnectionIssue"
      >
        @if (isConnectionIssue) {
          <!-- Modern wifi-off / network icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
        } @else {
          <!-- Alert circle icon for generic server/form errors -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        }
      </div>

      <h3 class="error-state__title">{{ resolvedTitle }}</h3>
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
  @Input() title?: string;
  @Input() message = 'Impossible de charger les informations. Veuillez vérifier votre connexion.';
  @Input() retryLabel = 'Réessayer';
  @Input() showRetry = true;
  @Input() isConnection?: boolean;

  @Output() retry = new EventEmitter<void>();

  get isConnectionIssue(): boolean {
    if (this.isConnection !== undefined) {
      return this.isConnection;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return true;
    }
    const text = (this.message || '').toLowerCase();
    return (
      text.includes('connexion') ||
      text.includes('réseau') ||
      text.includes('reseau') ||
      text.includes('hors ligne') ||
      text.includes('hors connexion') ||
      text.includes('internet') ||
      text.includes('lente') ||
      text.includes('inaccessible')
    );
  }

  get resolvedTitle(): string {
    if (this.title && this.title.trim() && this.title !== 'Une erreur est survenue') {
      return this.title;
    }
    if (this.isConnectionIssue) {
      const text = (this.message || '').toLowerCase();
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return 'Pas de connexion internet';
      }
      if (text.includes('hors ligne') || text.includes('hors connexion') || text.includes('pas de connexion')) {
        return 'Pas de connexion internet';
      }
      return 'Connexion lente ou instable';
    }
    return this.title || 'Une erreur est survenue';
  }
}
