import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-admin-modal',
  template: `
    @if (isOpen) {
      <div class="admin-modal-backdrop" (click)="close.emit()" (keydown.escape)="close.emit()" tabindex="-1">
        <div class="admin-modal" (click)="$event.stopPropagation()">
          <header class="admin-modal__header">
            <h3>{{ title }}</h3>
            <button type="button" class="admin-modal__close-btn" (click)="close.emit()" aria-label="Fermer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </header>

          <div class="admin-modal__body">
            <ng-content />
          </div>

          @if (showFooter) {
            <footer class="admin-modal__footer">
              <button type="button" class="admin-modal__btn-cancel" (click)="close.emit()">
                Annuler
              </button>
              <ng-content select="[footer-actions]" />
            </footer>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './admin-modal.scss'
})
export class AdminModal {
  @Input({ required: true }) title = '';
  @Input() isOpen = false;
  @Input() showFooter = true;
  @Output() close = new EventEmitter<void>();
}
