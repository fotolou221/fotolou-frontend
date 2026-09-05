import { Component, EventEmitter, Input, Output } from '@angular/core';

type AuthActionVariant = 'primary' | 'outline';

@Component({
  selector: 'app-auth-action-button',
  template: `
    <button
      class="auth-action-button"
      [class.auth-action-button--outline]="variant === 'outline'"
      type="button"
      [disabled]="disabled"
      (click)="pressed.emit()"
    >
      <span class="auth-action-button__content">
        <ng-content />
      </span>
    </button>
  `,
  styleUrl: './auth-action-button.scss'
})
export class AuthActionButton {
  @Input() variant: AuthActionVariant = 'primary';
  @Input() disabled = false;
  @Output() readonly pressed = new EventEmitter<void>();
}
