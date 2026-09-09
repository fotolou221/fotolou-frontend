export type TicketStatus = 'your_turn' | 'waiting' | 'served' | 'completed' | 'cancelled';
export type TicketTab = 'active' | 'history';

export interface Ticket {
  readonly id: string;
  readonly salonId: string;
  readonly salonName: string;
  readonly ownerName: string;
  readonly ownerType?: 'SELF' | 'RELATIVE' | 'CUSTOM' | 'self' | 'relative' | 'custom' | string;
  readonly ticketNumber: number;
  readonly currentTicketNumber?: number;
  readonly status: TicketStatus;
  readonly category: TicketTab;
  readonly createdAt: string;
  readonly servedAt?: string; // Filled when ticket is served or cancelled
  readonly itemCount?: number; // Number of items / services (default 1)
  readonly peopleAhead?: number;
  readonly estimatedWaitMinutes?: number;
  readonly user?: {
    readonly id?: number | string;
    readonly login?: string;
  };
}
