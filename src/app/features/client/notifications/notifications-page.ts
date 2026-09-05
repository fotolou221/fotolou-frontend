import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { NotificationService } from '../../../shared/services/notification.service';
import { AppNotification } from '../../../shared/models/notification';

@Component({
  selector: 'app-notifications-page',
  imports: [
    ClientLayout,
    PageHeader,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <app-client-layout [showBottomNav]="false" [hasCustomFooter]="false">
      <!-- Fixed Header Slot with centered title -->
      <div slot="header" class="notifications-header">
        <app-page-header title="Notifications" backRoute="/client/home" />

        @if (notificationService.clientUnreadCount() > 0) {
          <button
            type="button"
            class="notifications-header__read-all-btn"
            (click)="notificationService.markAllAsReadByRole('client')"
          >
            Tout lire
          </button>
        }
      </div>

      <!-- Main Content -->
      <div class="notifications-page__content">
        @if (notificationService.loading()) {
          <div class="notifications-page__list">
            <app-skeleton-loader type="list" [count]="4" />
          </div>
        } @else if (notificationService.error()) {
          <app-error-state
            [message]="notificationService.error()!"
            (retry)="notificationService.loadNotifications()"
          />
        } @else if (notificationService.clientNotifications().length > 0) {
          <div class="notifications-page__list">
            @for (notification of notificationService.clientNotifications(); track notification.id) {
              <div
                class="notification-card"
                [class.notification-card--unread]="!notification.isRead"
                (click)="onNotificationClick(notification)"
              >
                <!-- Compact refined icon -->
                <div
                  class="notification-card__icon"
                  [class]="'notification-card__icon--' + notification.type"
                  aria-hidden="true"
                >
                  @switch (notification.type) {
                    @case ('ticket') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 7h12l1 13H5L6 7Z"/>
                        <path d="M9 7a3 3 0 0 1 6 0"/>
                      </svg>
                    }
                    @case ('order') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                      </svg>
                    }
                    @case ('promo') {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                      </svg>
                    }
                    @default {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                    }
                  }
                </div>

                <!-- Content -->
                <div class="notification-card__content">
                  <div class="notification-card__header">
                    <div class="notification-card__title-wrap">
                      @if (!notification.isRead) {
                        <span class="notification-card__dot" aria-label="Non lu"></span>
                      }
                      <span class="notification-card__title">{{ notification.title }}</span>
                    </div>

                    <div class="notification-card__meta">
                      <span class="notification-card__time">{{ formatTime(notification.createdAt) }}</span>
                      <button
                        type="button"
                        class="notification-card__delete"
                        (click)="onDelete($event, notification.id)"
                        aria-label="Supprimer la notification"
                        title="Supprimer"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p class="notification-card__message">{{ notification.message }}</p>
                </div>
              </div>
            }
          </div>
        } @else {
          <app-empty-state
            icon="notification"
            title="Aucune notification"
            description="Vous êtes à jour ! Vos prochaines notifications apparaîtront ici."
          />
        }
      </div>
    </app-client-layout>
  `,
  styleUrl: './notifications-page.scss'
})
export class NotificationsPage implements OnInit {
  private readonly router = inject(Router);
  protected readonly notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.notificationService.loadNotifications();
  }

  protected onNotificationClick(notification: AppNotification): void {
    this.notificationService.markAsRead(notification.id).subscribe();
    if (notification.targetRoute) {
      this.router.navigate([notification.targetRoute]);
    }
  }

  protected onDelete(event: Event, id: string): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id).subscribe();
  }

  protected formatTime(isoStr: string): string {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return `À l'instant`;
    }
    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    }
    if (diffHours < 24) {
      return `Il y a ${diffHours} h`;
    }
    if (diffDays === 1) {
      return `Hier`;
    }
    if (diffDays < 7) {
      return `Il y a ${diffDays} j`;
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
}
