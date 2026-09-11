export type TicketStatus = 'your_turn' | 'waiting' | 'served' | 'completed' | 'cancelled';
export type TicketTab = 'active' | 'history';

export interface Ticket {
  readonly id: string;
  readonly salonId: string;
  readonly salonName: string;
  readonly ownerName: string;
  readonly ownerPhone?: string;
  readonly ownerType?: 'SELF' | 'RELATIVE' | 'CUSTOM' | 'self' | 'relative' | 'custom' | string;
  readonly ticketNumber: number;
  readonly currentTicketNumber?: number;
  readonly currentTicketIsYesterday?: boolean;
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

/**
 * Ordre reel de passage dans la file active : ordre d'arrivee (createdAt puis id),
 * jamais le numero affiche. Un ticket #1 pris le lendemain ne doit pas passer
 * devant un #999 de la veille encore actif.
 */
export function compareTicketQueueOrder(a: Ticket, b: Ticket): number {
  const aTime = new Date(a.createdAt).getTime();
  const bTime = new Date(b.createdAt).getTime();
  if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) {
    return aTime - bTime;
  }
  return (Number(a.id) || 0) - (Number(b.id) || 0);
}
