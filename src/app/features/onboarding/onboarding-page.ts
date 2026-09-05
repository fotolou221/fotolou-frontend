import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingBrand } from './components/onboarding-brand/onboarding-brand';
import { SplashLoader } from './components/splash-loader/splash-loader';

@Component({
  selector: 'app-onboarding-page',
  imports: [OnboardingBrand, SplashLoader],
  template: `
    <main class="onboarding-screen" aria-busy="true">
      <!-- Ambient background decoration -->
      <div class="onboarding-screen__ambient" aria-hidden="true">
        <div class="onboarding-screen__glow onboarding-screen__glow--top"></div>
        <div class="onboarding-screen__glow onboarding-screen__glow--bottom"></div>
      </div>

      <!-- Top spacer for optical balance -->
      <div class="onboarding-screen__top" aria-hidden="true"></div>

      <!-- Center: Brand Logo -->
      <div class="onboarding-screen__center">
        <app-onboarding-brand />
      </div>

      <!-- Bottom: Progress Loader + App Version -->
      <div class="onboarding-screen__bottom">
        <app-splash-loader />
        <p class="onboarding-screen__version">{{ appVersion }}</p>
      </div>
    </main>
  `,
  styleUrl: './onboarding-page.scss'
})
export class OnboardingPage {
  protected readonly appVersion = 'Version 1.0.0';

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  constructor() {
    const redirectTimer = globalThis.setTimeout(() => {
      void this.router.navigateByUrl('/auth/login');
    }, 2400);

    this.destroyRef.onDestroy(() => {
      globalThis.clearTimeout(redirectTimer);
    });
  }
}

