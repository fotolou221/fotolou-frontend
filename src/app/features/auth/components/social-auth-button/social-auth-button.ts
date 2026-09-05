import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SocialProvider } from '../../auth-session.service';

@Component({
  selector: 'app-social-auth-button',
  template: `
    <button
      class="social-auth-button"
      [class.social-auth-button--dark]="provider === 'apple'"
      type="button"
      (click)="selected.emit(provider)"
    >
      @if (provider === 'google') {
        <svg class="social-auth-button__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285f4"
            d="M22.6 12.2c0-.8-.1-1.6-.2-2.3H12v4.3h6c-.3 1.4-1 2.6-2.1 3.4v2.8h3.4c2-1.9 3.3-4.7 3.3-8.2Z"
          />
          <path
            fill="#34a853"
            d="M12 23c3 0 5.5-1 7.3-2.6l-3.4-2.8c-.9.6-2.2 1-3.9 1-3 0-5.5-2-6.4-4.7H2.1v2.9C3.9 20.5 7.7 23 12 23Z"
          />
          <path
            fill="#fbbc05"
            d="M5.6 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.2H2.1A11 11 0 0 0 1 12c0 1.7.4 3.3 1.1 4.8l3.5-2.9Z"
          />
          <path
            fill="#ea4335"
            d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.5 2.1 15 1 12 1 7.7 1 3.9 3.5 2.1 7.2l3.5 2.9c.9-2.7 3.4-4.7 6.4-4.7Z"
          />
        </svg>
      } @else {
        <svg class="social-auth-button__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M16.7 13c0-2 1.7-3 1.8-3.1-1-1.4-2.4-1.6-3-1.6-1.2-.1-2.4.7-3 .7-.7 0-1.7-.7-2.7-.7-1.4 0-2.7.8-3.4 2.1-1.5 2.6-.4 6.4 1 8.5.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.9.7 2-1 2.7-2.1c.8-1.2 1.2-2.4 1.2-2.5 0-.1-2.9-1.2-3-3.4ZM14.7 7c.6-.8 1.1-1.8.9-2.9-.9 0-2 .6-2.6 1.4-.6.6-1.1 1.7-1 2.8 1 .1 2-.5 2.7-1.3Z"
          />
        </svg>
      }

      <span>{{ label }}</span>
    </button>
  `,
  styleUrl: './social-auth-button.scss'
})
export class SocialAuthButton {
  @Input({ required: true }) provider!: SocialProvider;
  @Input({ required: true }) label = '';
  @Output() readonly selected = new EventEmitter<SocialProvider>();
}
