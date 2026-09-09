import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ClientLayout } from '../../../../shared/components/client-layout/client-layout';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { AuthActionButton } from '../../components/auth-action-button/auth-action-button';
import { OtpCodeInput } from '../../components/otp-code-input/otp-code-input';
import { AuthSessionService } from '../../auth-session.service';

@Component({
  selector: 'app-otp-page',
  imports: [
    ClientLayout,
    PageHeader,
    AuthActionButton,
    OtpCodeInput
  ],
  template: `
    <app-client-layout [showBottomNav]="false" [hasCustomFooter]="true">
      <!-- Fixed Header Slot -->
      <app-page-header
        slot="header"
        title="Entrez le code"
        backRoute="/auth/login"
      />

      <!-- Scrollable Main Content -->
      <div class="otp-page__content">
        <header class="otp-page__header">
          <p>Nous avons envoyé un code OTP</p>
          <strong>au {{ auth.pendingPhone() }}</strong>
        </header>

        <app-otp-code-input (codeChange)="onCodeChanged($event)" />

        @if (remainingSeconds() > 0) {
          <p class="otp-page__resend">Renvoyer le code dans {{ countdown() }}</p>
        } @else {
          <p class="otp-page__resend">
            <button type="button" class="otp-resend-btn" [disabled]="isResending()" (click)="resendCode()">
              @if (isResending()) {
                <span>Renvoi du code</span><span class="loading-dots" aria-hidden="true"></span>
              } @else {
                Renvoyer le code SMS
              }
            </button>
          </p>
        }

        @if (errorMessage()) {
          <p class="otp-page__error" role="alert">{{ errorMessage() }}</p>
        }
      </div>

      <!-- Fixed Footer Slot -->
      <div slot="footer" class="otp-page__fixed-footer">
        <app-auth-action-button
          variant="outline"
          [disabled]="!isCodeValid()"
          [loading]="isSubmitting()"
          loadingLabel="Vérification du code"
          (pressed)="verifyCode()"
        >
          Vérifier
          <span aria-hidden="true">&#8594;</span>
        </app-auth-action-button>
      </div>
    </app-client-layout>
  `,
  styleUrl: './otp-page.scss'
})
export class OtpPage implements OnInit {
  protected readonly auth = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly errorMessage = signal('');
  protected readonly remainingSeconds = signal(45);
  protected readonly verificationCode = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly isResending = signal(false);

  protected readonly isCodeValid = computed(() => this.verificationCode().trim().length === 6);
  protected readonly countdown = computed(() => {
    const seconds = this.remainingSeconds().toString().padStart(2, '0');
    return `00:${seconds}`;
  });

  constructor() {
    const timer = globalThis.setInterval(() => {
      this.remainingSeconds.update((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    this.destroyRef.onDestroy(() => {
      globalThis.clearInterval(timer);
    });
  }

  ngOnInit(): void {
    if (!this.auth.pendingPhone()) {
      void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    }
  }

  protected onCodeChanged(code: string): void {
    this.verificationCode.set(code);
    this.errorMessage.set('');
    if (code.length === 6) {
      void this.verifyCode();
    }
  }

  protected async resendCode(): Promise<void> {
    this.errorMessage.set('');
    if (this.isResending()) return;
    this.isResending.set(true);
    try {
      await this.auth.startPhoneLogin(this.auth.pendingPhone());
      this.remainingSeconds.set(45);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Impossible de renvoyer le code SMS.');
    } finally {
      this.isResending.set(false);
    }
  }

  protected async verifyCode(): Promise<void> {
    if (!this.isCodeValid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const success = await this.auth.verifyOtpAsync(this.verificationCode());
      if (!success) {
        this.errorMessage.set('Code incorrect ou expiré. Veuillez vérifier le SMS reçu.');
        this.isSubmitting.set(false);
        return;
      }

      void this.router.navigateByUrl(this.auth.getHomeRoute(), { replaceUrl: true });
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Erreur de validation du code. Reessayez.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
