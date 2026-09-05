import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { RelativeService } from '../../../shared/services/relative.service';
import { RelativeRelation, RELATION_LABELS } from '../../../shared/models/relative';

type RelationOption = { value: RelativeRelation; label: string };

@Component({
  selector: 'app-add-relative-page',
  imports: [ClientLayout, PageHeader, FormsModule],
  template: `
    <app-client-layout [showBottomNav]="false" [hasCustomFooter]="true">
      <!-- Fixed Header -->
      <app-page-header slot="header" title="Ajouter un proche" backRoute="/client/proches" />

      <!-- Scrollable Body -->
      <div class="add-relative-page">

        <!-- Hero Illustration -->
        <section class="add-relative-page__hero">
          <div class="add-relative-page__hero-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="17" y1="11" x2="23" y2="11"/>
            </svg>
          </div>
          <p class="add-relative-page__hero-text">
            Enregistrez un membre de votre famille ou un ami pour prendre des tickets en leur nom.
          </p>
        </section>

        <!-- Form -->
        <form class="add-relative-page__form" (ngSubmit)="saveRelative()" #addForm="ngForm">

          <!-- Name Field -->
          <div class="add-relative-page__field">
            <label class="add-relative-page__label" for="relative-name">
              NOM OU SURNOM <span class="add-relative-page__required">*</span>
            </label>
            <input
              id="relative-name"
              type="text"
              class="add-relative-page__input"
              placeholder="Ex: Maman, Papa, Ibrahim..."
              [(ngModel)]="name"
              name="name"
              required
              autocomplete="off"
            />
          </div>

          <!-- Relation Field -->
          <div class="add-relative-page__field">
            <label class="add-relative-page__label" for="relative-relation">
              LIEN DE PARENTÉ <span class="add-relative-page__required">*</span>
            </label>
            <div class="add-relative-page__select-wrapper">
              <select
                id="relative-relation"
                class="add-relative-page__select"
                [(ngModel)]="relation"
                name="relation"
                required
              >
                <option value="" disabled selected>Choisir un lien</option>
                @for (opt of relationOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
              <span class="add-relative-page__select-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </span>
            </div>
          </div>

          <!-- Phone Field (Optional) -->
          <div class="add-relative-page__field">
            <label class="add-relative-page__label" for="relative-phone">
              NUMÉRO DE TÉLÉPHONE
            </label>
            <div class="add-relative-page__phone-wrapper">
              <input
                id="relative-phone"
                type="tel"
                class="add-relative-page__input add-relative-page__input--phone"
                placeholder="+221 -- --- -- --"
                [(ngModel)]="phone"
                name="phone"
                autocomplete="tel"
              />
              <span class="add-relative-page__phone-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 7.55 7.55l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </span>
            </div>
            <small class="add-relative-page__hint">
              Optionnel. Pour envoyer les notifications de ticket par SMS.
            </small>
          </div>

          <p class="add-relative-page__mandatory-note">* Champs obligatoires</p>
        </form>
      </div>

      <!-- Fixed Footer -->
      <div slot="footer" class="add-relative-page__footer">
        <button
          type="button"
          class="add-relative-page__save-btn"
          [disabled]="!name.trim() || !relation"
          (click)="saveRelative()"
        >
          <span>Enregistrer</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
        </button>
        <button type="button" class="add-relative-page__cancel-btn" (click)="cancel()">
          Annuler
        </button>
      </div>
    </app-client-layout>
  `,
  styleUrl: './add-relative-page.scss'
})
export class AddRelativePage {
  private readonly router = inject(Router);
  private readonly relativeService = inject(RelativeService);

  protected name = '';
  protected relation: RelativeRelation | '' = '';
  protected phone = '';

  protected readonly relationOptions: readonly RelationOption[] = (
    Object.entries(RELATION_LABELS) as [RelativeRelation, string][]
  ).map(([value, label]) => ({ value, label }));

  protected saveRelative(): void {
    if (!this.name.trim() || !this.relation) return;
    this.relativeService.addRelative(
      this.name,
      this.relation as RelativeRelation,
      this.phone || undefined
    ).subscribe(() => {
      this.router.navigate(['/client/proches']);
    });
  }

  protected cancel(): void {
    this.router.navigate(['/client/proches']);
  }
}
