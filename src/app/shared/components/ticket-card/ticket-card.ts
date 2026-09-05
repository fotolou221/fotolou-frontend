import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Ticket } from '../../models/ticket';

@Component({
  selector: 'app-ticket-card',
  imports: [RouterLink],
  template: `
    <a class="ticket-card" [routerLink]="['/client/tickets', ticket.id]">
      <div class="ticket-card__left">
        <!-- Status Header -->
        <div class="ticket-card__status" [class]="'ticket-card__status--' + ticketStatusClass">
          <span class="ticket-card__dot"></span>
          <span class="ticket-card__status-text">{{ statusText }}</span>
        </div>

        <!-- Salon Info -->
        <strong class="ticket-card__salon-name">{{ ticket.salonName }}</strong>
        <span class="ticket-card__owner">Pour: {{ ticket.ownerName }}</span>
      </div>

      <div class="ticket-card__right">
        <div class="ticket-card__number-box">
          <span class="ticket-card__number-label">N°</span>
          <strong class="ticket-card__number-value">{{ ticket.ticketNumber }}</strong>
        </div>

        <span class="ticket-card__chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </span>
      </div>
    </a>
  `,
  styleUrl: './ticket-card.scss'
})
export class TicketCard {
  @Input({ required: true }) ticket!: Ticket;

  protected get ticketStatusClass(): string {
    if (this.ticket.status === 'served' || this.ticket.status === 'completed') {
      return 'completed';
    }
    return this.ticket.status;
  }

  protected get statusText(): string {
    switch (this.ticket.status) {
      case 'your_turn':
        return 'VOTRE TOUR';
      case 'waiting':
        return 'EN ATTENTE';
      case 'served':
      case 'completed':
        return 'SERVI';
      case 'cancelled':
        return 'ANNULÉ';
      default:
        return 'EN ATTENTE';
    }
  }
}
