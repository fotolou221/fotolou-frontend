export type TicketOwnerType = 'self' | 'relative' | 'custom';

export interface TicketOwner {
  readonly id: string;
  readonly type: TicketOwnerType;
  readonly name: string;
  readonly subtitle?: string;
  readonly avatarInitials?: string;
  readonly isCustomInput?: boolean;
}
