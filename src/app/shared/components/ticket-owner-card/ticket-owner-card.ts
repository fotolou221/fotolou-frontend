import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TicketOwner } from '../../models/ticket-owner';

@Component({
  selector: 'app-ticket-owner-card',
  imports: [FormsModule],
  template: `
    <article
      class="ticket-owner-card"
      [class.ticket-owner-card--selected]="isSelected"
      [class.ticket-owner-card--pressing]="isPressing"
      (click)="onClick($event)"
      (mousedown)="startPress($event)"
      (mouseup)="cancelPress()"
      (mouseleave)="cancelPress()"
      (touchstart)="startPress($event)"
      (touchend)="cancelPress()"
      (touchcancel)="cancelPress()"
    >
      <div class="ticket-owner-card__content">
        <!-- Avatar -->
        <div class="ticket-owner-card__avatar" [class.ticket-owner-card__avatar--blue]="owner.type === 'self'">
          @switch (owner.type) {
            @case ('self') {
              <span>{{ owner.avatarInitials || 'A' }}</span>
            }
            @case ('relative') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            }
            @case ('custom') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            }
          }
        </div>

        <!-- Info -->
        <div class="ticket-owner-card__info">
          <strong class="ticket-owner-card__name">{{ owner.name }}</strong>
          @if (owner.subtitle) {
            <span class="ticket-owner-card__subtitle">{{ owner.subtitle }}</span>
          }
        </div>

        <!-- Selection Checkbox Indicator -->
        <div class="ticket-owner-card__checkbox" [class.ticket-owner-card__checkbox--checked]="isSelected">
          @if (isSelected) {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          }
        </div>
      </div>

      <!-- Custom Name Input Field (when selected) -->
      @if (isSelected && owner.isCustomInput) {
        <div class="ticket-owner-card__input-wrapper" (click)="$event.stopPropagation()">
          <input
            type="text"
            class="ticket-owner-card__input"
            placeholder="Entrez le nom et prénom"
            [ngModel]="customName"
            (ngModelChange)="customNameChange.emit($event)"
            (keydown.enter)="$event.preventDefault()"
          />
        </div>
      }
    </article>
  `,
  styleUrl: './ticket-owner-card.scss'
})
export class TicketOwnerCard implements OnDestroy {
  @Input({ required: true }) owner!: TicketOwner;
  @Input() isSelected = false;
  @Input() customName = '';

  @Output() cardClick = new EventEmitter<void>();
  @Output() cardLongPress = new EventEmitter<void>();
  @Output() customNameChange = new EventEmitter<string>();

  protected isPressing = false;
  private pressTimeout: ReturnType<typeof setTimeout> | null = null;
  private didLongPress = false;

  ngOnDestroy(): void {
    this.cancelPress();
  }

  protected startPress(event: MouseEvent | TouchEvent): void {
    this.didLongPress = false;
    this.isPressing = true;

    this.pressTimeout = setTimeout(() => {
      this.didLongPress = true;
      this.isPressing = false;

      // Haptic feedback if supported on mobile
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch {
          // ignore
        }
      }

      this.cardLongPress.emit();
    }, 450);
  }

  protected cancelPress(): void {
    this.isPressing = false;
    if (this.pressTimeout) {
      clearTimeout(this.pressTimeout);
      this.pressTimeout = null;
    }
  }

  protected onClick(event: MouseEvent): void {
    if (this.didLongPress) {
      this.didLongPress = false;
      return;
    }
    this.cancelPress();
    this.cardClick.emit();
  }
}
