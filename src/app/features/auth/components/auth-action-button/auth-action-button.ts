import { Component, EventEmitter, Input, Output } from '@angular/core';

type AuthActionVariant = 'primary' | 'outline';

@Component({
  selector: 'app-auth-action-button',
  template: `
    <button
      class="auth-action-button"
      [class.auth-action-button--outline]="variant === 'outline'"
      type="button"
      [disabled]="disabled || loading"
      [attr.aria-busy]="loading"
      (click)="pressed.emit()"
    >
      <span class="auth-action-button__content">
        @if (loading) {
          <span>{{ loadingLabel }}</span>
          <span class="loading-dots" aria-hidden="true"></span>
        } @else {
          <ng-content />
        }
      </span>
    </button>
  `,
  styleUrl: './auth-action-button.scss'
})
export class AuthActionButton {
  @Input() variant: AuthActionVariant = 'primary';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() loadingLabel = 'Chargement';
  @Output() readonly pressed = new EventEmitter<void>();
}
