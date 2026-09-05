import { Component } from '@angular/core';

@Component({
  selector: 'app-onboarding-brand',
  template: `
    <section class="onboarding-brand" aria-label="Fotolou">
      <img class="onboarding-brand__logo" src="images/logoFotolou.png" alt="Logo Fotolou" />
    </section>
  `,
  styleUrl: './onboarding-brand.scss'
})
export class OnboardingBrand {}
