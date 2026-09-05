export type NotificationType = 'ticket' | 'order' | 'promo' | 'system';
export type RecipientRole = 'client' | 'coiffeur';

export interface AppNotification {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly type: NotificationType;
  readonly recipientRole: RecipientRole;
  readonly createdAt: string;
  readonly isRead: boolean;
  readonly targetRoute?: string;
}
