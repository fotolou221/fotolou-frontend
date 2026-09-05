import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-shell',
  imports: [RouterLink],
  template: `
    <main class="auth-shell">
      @if (showBack) {
        <a class="auth-shell__back" [routerLink]="backLink" aria-label="Retour">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </a>
      }

      <section class="auth-shell__content" [class.auth-shell__content--centered]="centerContent">
        <ng-content />
      </section>
    </main>
  `,
  styleUrl: './auth-shell.scss'
})
export class AuthShell {
  @Input() showBack = false;
  @Input() centerContent = false;
  @Input() backLink = '/auth/login';
}
