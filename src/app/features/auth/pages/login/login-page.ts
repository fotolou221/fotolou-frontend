import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthActionButton } from '../../components/auth-action-button/auth-action-button';
import { AuthShell } from '../../components/auth-shell/auth-shell';
import { SocialAuthButton } from '../../components/social-auth-button/social-auth-button';
import { AuthSessionService, SocialProvider, UserRole } from '../../auth-session.service';

@Component({
  selector: 'app-login-page',
  imports: [AuthActionButton, AuthShell, SocialAuthButton],
  template: `
    <app-auth-shell>
      <div class="login-page">
        <header class="login-page__header">
          <h1>Bienvenue</h1>
          <p>
            @if (auth.activeRole() === 'coiffeur') {
              Connecte-toi à ton <strong>Espace Coiffeur Pro</strong>
            } @else {
              Connecte-toi pour continuer
            }
          </p>
        </header>

        <div class="login-page__field-group">
          <label class="login-page__label" for="phone">T&eacute;l&eacute;phone</label>
          <div class="phone-field">
            <button class="phone-field__country" type="button" aria-label="Indicatif S&eacute;n&eacute;gal">
              <span class="country-flag" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </span>
              <span>+221</span>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m6 8 4 4 4-4" />
              </svg>
            </button>

            <span class="phone-field__divider" aria-hidden="true"></span>

            <input
              id="phone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="77 000 00 00"
              [value]="phoneNumber()"
              (input)="updatePhone($event)"
            />
          </div>

          @if (errorMessage()) {
            <p class="login-page__error" role="alert" style="color: #ef4444; font-size: 0.85rem; margin-top: 8px; text-align: left;">
              {{ errorMessage() }}
            </p>
          }
        </div>

        <div class="login-page__separator">
          <span></span>
          <strong>ou</strong>
          <span></span>
        </div>

        <div class="login-page__socials">
          <app-social-auth-button
            provider="google"
            label="Se connecter avec Google"
            (selected)="continueWithSocial($event)"
          />
          <app-social-auth-button
            provider="apple"
            label="Se connecter avec Apple"
            (selected)="continueWithSocial($event)"
          />
        </div>

        <footer class="login-page__footer">
          <app-auth-action-button
            [disabled]="!isPhoneValid()"
            [loading]="isSubmitting()"
            loadingLabel="Envoi du code"
            (pressed)="continueWithPhone()"
          >
            <span>Continuer</span>
            <svg class="auth-action-button__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </app-auth-action-button>
          <p>
            En continuant, tu acceptes nos
            <a href="#" aria-label="Conditions d'utilisation">Conditions d'utilisation</a>
            et notre
            <a href="#" aria-label="Politique de confidentialit&eacute;">Politique de confidentialit&eacute;</a>.
          </p>
        </footer>
      </div>
    </app-auth-shell>
  `,
  styleUrl: './login-page.scss'
})
export class LoginPage implements OnInit {
  protected readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private loginRole: UserRole = 'client';

  ngOnInit(): void {
    const targetRole = this.route.snapshot.queryParamMap.get('role');
    this.loginRole = targetRole === 'coiffeur' ? 'coiffeur' : 'client';
    this.auth.selectRole(this.loginRole);
  }

  protected readonly phoneNumber = signal('');
  protected readonly errorMessage = signal('');
  protected readonly isSubmitting = signal(false);

  protected readonly cleanDigits = computed(() => {
    return this.phoneNumber().replace(/\D/g, '').replace(/^221/, '').slice(0, 9);
  });

  protected readonly isPhoneValid = computed(() => {
    const digits = this.cleanDigits();
    return digits.length === 9;
  });

  protected updatePhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').replace(/^221/, '').slice(0, 9);
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)} ${digits.slice(2, 5)}`;
      if (digits.length > 5) {
        formatted += ` ${digits.slice(5, 7)}`;
      }
      if (digits.length > 7) {
        formatted += ` ${digits.slice(7)}`;
      }
    }
    this.phoneNumber.set(formatted);
    input.value = formatted;
    this.errorMessage.set('');
  }

  protected async continueWithPhone(): Promise<void> {
    if (!this.isPhoneValid()) {
      this.errorMessage.set('Veuillez saisir un numéro de téléphone valide à 9 chiffres (ex: 77 123 45 67).');
      return;
    }
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      await this.auth.startPhoneLogin(this.cleanDigits(), this.loginRole);
      void this.router.navigateByUrl('/auth/code');
    } catch (e: any) {
      this.errorMessage.set(e?.message || "Impossible d'envoyer le code SMS. Vérifiez votre connexion.");
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected continueWithSocial(provider: SocialProvider): void {
    const user = this.auth.completeSocialLogin(provider);
    void this.router.navigateByUrl(user.homeRoute, { replaceUrl: true });
  }
}
