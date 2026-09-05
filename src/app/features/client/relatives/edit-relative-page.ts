import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { ConfirmModal } from '../../../shared/components/confirm-modal/confirm-modal';
import { RelativeService } from '../../../shared/services/relative.service';
import { Relative, RelativeRelation, RELATION_LABELS } from '../../../shared/models/relative';

type RelationOption = { value: RelativeRelation; label: string };

@Component({
  selector: 'app-edit-relative-page',
  imports: [ClientLayout, PageHeader, FormsModule, ConfirmModal],
  template: `
    <app-client-layout [showBottomNav]="false" [hasCustomFooter]="true">
      <!-- Fixed Header -->
      <app-page-header slot="header" title="Modifier un proche" backRoute="/client/proches" />

      <!-- Scrollable Body -->
      <div class="edit-relative-page">

        @if (relative()) {
          <!-- Hero -->
          <section class="edit-relative-page__hero">
            <div class="edit-relative-page__hero-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <p class="edit-relative-page__hero-text">
              Modifiez les informations du proche enregistré.
            </p>
          </section>

          <!-- Form -->
          <form class="edit-relative-page__form" (ngSubmit)="saveChanges()">

            <!-- Name Field -->
            <div class="edit-relative-page__field">
              <label class="edit-relative-page__label" for="edit-name">
                NOM OU SURNOM <span class="edit-relative-page__required">*</span>
              </label>
              <input
                id="edit-name"
                type="text"
                class="edit-relative-page__input"
                placeholder="Ex: Maman, Papa, Ibrahim..."
                [(ngModel)]="name"
                name="name"
                required
                autocomplete="off"
              />
            </div>

            <!-- Relation Field -->
            <div class="edit-relative-page__field">
              <label class="edit-relative-page__label" for="edit-relation">
                LIEN DE PARENTÉ <span class="edit-relative-page__required">*</span>
              </label>
              <div class="edit-relative-page__select-wrapper">
                <select
                  id="edit-relation"
                  class="edit-relative-page__select"
                  [(ngModel)]="relation"
                  name="relation"
                  required
                >
                  <option value="" disabled>Choisir un lien</option>
                  @for (opt of relationOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
                <span class="edit-relative-page__select-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </div>
            </div>

            <!-- Phone Field (Optional) -->
            <div class="edit-relative-page__field">
              <label class="edit-relative-page__label" for="edit-phone">
                NUMÉRO DE TÉLÉPHONE
              </label>
              <div class="edit-relative-page__phone-wrapper">
                <input
                  id="edit-phone"
                  type="tel"
                  class="edit-relative-page__input edit-relative-page__input--phone"
                  placeholder="+221 -- --- -- --"
                  [(ngModel)]="phone"
                  name="phone"
                  autocomplete="tel"
                />
                <span class="edit-relative-page__phone-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 7.55 7.55l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </span>
              </div>
              <small class="edit-relative-page__hint">
                Optionnel. Pour envoyer les notifications de ticket par SMS.
              </small>
            </div>

            <p class="edit-relative-page__mandatory-note">* Champs obligatoires</p>
          </form>

          <!-- Delete Section -->
          <div class="edit-relative-page__delete-section">
            <button type="button" class="edit-relative-page__delete-btn" (click)="showDeleteModal.set(true)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
              <span>Supprimer ce proche</span>
            </button>
          </div>
        }

      </div>

      <!-- Fixed Footer -->
      <div slot="footer" class="edit-relative-page__footer">
        <button
          type="button"
          class="edit-relative-page__save-btn"
          [disabled]="!name.trim() || !relation"
          (click)="saveChanges()"
        >
          <span>Enregistrer</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
        </button>
        <button type="button" class="edit-relative-page__cancel-btn" (click)="cancel()">
          Annuler
        </button>
      </div>
    </app-client-layout>

    <!-- Delete Confirmation Modal -->
    <app-confirm-modal
      [isOpen]="showDeleteModal()"
      title="Supprimer ce proche ?"
      [message]="'Voulez-vous vraiment supprimer ' + (relative()?.name || 'ce proche') + ' de votre liste ?'"
      confirmLabel="Supprimer"
      cancelLabel="Annuler"
      variant="danger"
      (confirm)="confirmDelete()"
      (cancel)="showDeleteModal.set(false)"
    />
  `,
  styleUrl: './edit-relative-page.scss'
})
export class EditRelativePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly relativeService = inject(RelativeService);

  protected readonly relative = signal<Relative | null>(null);
  protected readonly showDeleteModal = signal(false);

  protected name = '';
  protected relation: RelativeRelation | '' = '';
  protected phone = '';

  protected readonly relationOptions: readonly RelationOption[] = (
    Object.entries(RELATION_LABELS) as [RelativeRelation, string][]
  ).map(([value, label]) => ({ value, label }));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.relativeService.getRelativeById(id).subscribe((found) => {
      this.relative.set(found);
      if (found) {
        this.name = found.name;
        this.relation = found.relation;
        this.phone = found.phone ?? '';
      }
    });
  }

  protected saveChanges(): void {
    const rel = this.relative();
    if (!rel || !this.name.trim() || !this.relation) return;
    this.relativeService.updateRelative(
      rel.id,
      this.name,
      this.relation as RelativeRelation,
      this.phone || undefined
    ).subscribe(() => {
      this.router.navigate(['/client/proches']);
    });
  }

  protected confirmDelete(): void {
    const rel = this.relative();
    this.showDeleteModal.set(false);
    if (!rel) return;
    this.relativeService.removeRelative(rel.id).subscribe(() => {
      this.router.navigate(['/client/proches']);
    });
  }

  protected cancel(): void {
    this.router.navigate(['/client/proches']);
  }
}
