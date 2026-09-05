import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { RelativeService } from '../../../shared/services/relative.service';
import { Relative, RELATION_LABELS } from '../../../shared/models/relative';

@Component({
  selector: 'app-relatives-page',
  imports: [
    ClientLayout,
    PageHeader,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <app-client-layout [showBottomNav]="false" [hasCustomFooter]="true">
      <!-- Fixed Header -->
      <app-page-header slot="header" title="Mes Proches" backRoute="/client/profile" />

      <!-- Scrollable Body -->
      <div class="relatives-page">

        <!-- Hero Illustration -->
        <section class="relatives-page__hero">
          <div class="relatives-page__hero-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <p class="relatives-page__hero-text">
            Gérez les membres de votre famille pour simplifier vos prises de rendez-vous et l'achat de tickets.
          </p>
        </section>

        <!-- Relatives List -->
        <section class="relatives-page__list" aria-label="Liste des proches">
          @if (relativeService.loading()) {
            <app-skeleton-loader type="list" [count]="3" />
          } @else if (relativeService.error()) {
            <app-error-state
              [message]="relativeService.error()!"
              (retry)="relativeService.loadRelatives()"
            />
          } @else {
            @for (relative of relativeService.relatives(); track relative.id) {
              <div class="relatives-page__card">
                <div class="relatives-page__card-avatar" [class]="'relatives-page__card-avatar--' + relative.relation">
                  {{ getAvatarIcon(relative.relation) }}
                </div>

                <div class="relatives-page__card-info">
                  <strong class="relatives-page__card-name">{{ relative.name }}</strong>
                  <span class="relatives-page__card-meta">
                    {{ getRelationLabel(relative) }}
                    @if (relative.phone) {
                      &bull; {{ relative.phone }}
                    }
                  </span>
                </div>

                <button
                  type="button"
                  class="relatives-page__card-edit-btn"
                  (click)="editRelative(relative)"
                  [attr.aria-label]="'Modifier ' + relative.name"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
            } @empty {
              <app-empty-state
                icon="user"
                title="Aucun proche enregistré"
                description="Ajoutez vos proches pour prendre des tickets pour eux facilement."
                actionLabel="Ajouter un proche"
                actionRoute="/client/proches/ajouter"
              />
            }
          }
        </section>
      </div>

      <!-- Fixed Footer -->
      <div slot="footer" class="relatives-page__footer">
        <button type="button" class="relatives-page__add-btn" (click)="goToAdd()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="17" y1="11" x2="23" y2="11"/>
          </svg>
          <span>Ajouter un proche</span>
        </button>
      </div>
    </app-client-layout>
  `,
  styleUrl: './relatives-page.scss'
})
export class RelativesPage {
  private readonly router = inject(Router);
  protected readonly relativeService = inject(RelativeService);

  protected getRelationLabel(relative: Relative): string {
    return RELATION_LABELS[relative.relation];
  }

  protected getAvatarIcon(relation: string): string {
    const icons: Record<string, string> = {
      mere: '👩',
      pere: '👨',
      enfant: '🧒',
      frere: '👦',
      soeur: '👧',
      ami: '😊',
      autre: '🧑'
    };
    return icons[relation] ?? '🧑';
  }

  protected editRelative(relative: Relative): void {
    this.router.navigate(['/client/proches/edit', relative.id]);
  }

  protected goToAdd(): void {
    this.router.navigate(['/client/proches/ajouter']);
  }
}
