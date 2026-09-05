import { Component, Input, Output, EventEmitter } from '@angular/core';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

@Component({
  selector: 'app-confirm-modal',
  imports: [],
  template: `
    @if (isOpen) {
      <div class="confirm-modal__backdrop" (click)="onBackdropClick($event)" role="presentation">
        <div
          class="confirm-modal__card"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'modal-title-' + title"
        >
          <!-- Icon -->
          <div class="confirm-modal__icon" [class]="'confirm-modal__icon--' + variant" aria-hidden="true">
            @switch (variant) {
              @case ('danger') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              }
              @case ('warning') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              }
              @default {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              }
            }
          </div>

          <!-- Content -->
          <h3 [id]="'modal-title-' + title" class="confirm-modal__title">{{ title }}</h3>
          <p class="confirm-modal__message">{{ message }}</p>

          <!-- Actions -->
          <div class="confirm-modal__actions">
            <button
              type="button"
              class="confirm-modal__cancel-btn"
              (click)="cancel.emit()"
            >
              {{ cancelLabel }}
            </button>
            <button
              type="button"
              class="confirm-modal__confirm-btn"
              [class]="'confirm-modal__confirm-btn--' + variant"
              (click)="confirm.emit()"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './confirm-modal.scss'
})
export class ConfirmModal {
  @Input() isOpen = false;
  @Input() title = 'Confirmation';
  @Input() message = 'Êtes-vous sûr de vouloir effectuer cette action ?';
  @Input() confirmLabel = 'Confirmer';
  @Input() cancelLabel = 'Annuler';
  @Input() variant: ConfirmVariant = 'danger';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }
}
