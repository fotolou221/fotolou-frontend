import { Component, inject } from '@angular/core';
import { AuthSessionService, UserRole } from '../../auth-session.service';

@Component({
  selector: 'app-account-type-toggle',
  template: `
    <div class="account-type-toggle" aria-label="Type de compte">
      @for (user of auth.users; track user.role) {
        <button
          class="account-type-toggle__option"
          [class.account-type-toggle__option--active]="auth.activeRole() === user.role"
          type="button"
          (click)="selectRole(user.role)"
        >
          {{ user.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './account-type-toggle.scss'
})
export class AccountTypeToggle {
  protected readonly auth = inject(AuthSessionService);

  protected selectRole(role: UserRole): void {
    this.auth.selectRole(role);
  }
}
