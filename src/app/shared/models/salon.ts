export interface SalonAction {
  readonly label: string;
  readonly icon: 'globe' | 'phone' | 'navigation' | 'share';
  readonly href?: string;
}

export interface Salon {
  readonly id: string;
  readonly numericId?: number;
  readonly slug?: string;
  readonly name: string;
  readonly location: string;
  readonly district: string;
  readonly status: 'open' | 'closed';
  readonly peopleWaiting: number;
  readonly estimatedWaitMinutes?: number;
  readonly avatarUrl: string;
  readonly coverUrl: string;
  readonly galleryImages?: readonly string[];
  readonly phone?: string;
  readonly ownerName?: string;
  readonly coiffeurName?: string;
  readonly specialty?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly actions: readonly SalonAction[];
}
