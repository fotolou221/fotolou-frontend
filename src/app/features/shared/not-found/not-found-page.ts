import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { AuthSessionService } from '../../auth/auth-session.service';

@Component({
  selector: 'app-not-found-page',
  imports: [ClientLayout],
  template: `
    <app-client-layout [showBottomNav]="false" [hasHeaderSlot]="false">
      <div class="not-found-page">
        <div class="not-found-page__card">
          <div class="not-found-page__code">404</div>
          <h1 class="not-found-page__title">Page introuvable</h1>
          <p class="not-found-page__desc">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <button type="button" class="not-found-page__btn" (click)="goHome()">
            Retourner à l'accueil
          </button>
        </div>
      </div>
    </app-client-layout>
  `,
  styleUrl: './not-found-page.scss'
})
export class NotFoundPage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthSessionService);

  protected goHome(): void {
    const route = this.auth.getHomeRoute();
    this.router.navigate([route]);
  }
}
