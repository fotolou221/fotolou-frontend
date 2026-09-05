import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-geolocation-modal',
  imports: [],
  template: `
    @if (isOpen) {
      <div class="geo-modal__backdrop" (click)="onBackdropClick($event)" role="presentation">
        <div class="geo-modal__card" role="dialog" aria-modal="true" aria-labelledby="geo-modal-title">

          <!-- Location Icon inside circle -->
          <div class="geo-modal__icon-wrap" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>

          <!-- Title & Prompt Text -->
          <h3 id="geo-modal-title" class="geo-modal__title">Autoriser la géolocalisation ?</h3>
          <p class="geo-modal__message">
            Permettez-nous d'accéder à votre position pour vous proposer les salons les plus proches de vous et faciliter votre trajet.
          </p>

          <!-- Action Buttons -->
          <div class="geo-modal__actions">
            <button type="button" class="geo-modal__authorize-btn" (click)="authorize.emit()">
              Autoriser
            </button>
            <button type="button" class="geo-modal__later-btn" (click)="later.emit()">
              Plus tard
            </button>
          </div>

        </div>
      </div>
    }
  `,
  styleUrl: './geolocation-modal.scss'
})
export class GeoLocationModal {
  @Input() isOpen = false;

  @Output() authorize = new EventEmitter<void>();
  @Output() later = new EventEmitter<void>();

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.later.emit();
    }
  }
}
