import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { TicketCard } from '../../../shared/components/ticket-card/ticket-card';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { TicketService } from '../../../shared/services/ticket.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { TicketTab } from '../../../shared/models/ticket';

@Component({
  selector: 'app-my-tickets-page',
  imports: [
    ClientLayout,
    TicketCard,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <app-client-layout activeNav="tickets" [hasHeaderSlot]="true">
      <!-- Fixed Header Slot -->
      <header slot="header" class="tickets-header">
        <h1 class="tickets-header__title">Mes tickets</h1>

        <!-- Header Actions: Notification Bell -->
        <button
          type="button"
          class="tickets-header__icon-btn"
          (click)="goToNotifications()"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          @if (notificationService.unreadCount() > 0) {
            <span class="tickets-header__notif-badge">{{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}</span>
          }
        </button>
      </header>

      <!-- Main Scrollable Content -->
      <div class="my-tickets-page__content">
        <!-- Segmented Control Tabs -->
        <div class="my-tickets-page__tabs" role="tablist">
          <button
            type="button"
            class="my-tickets-page__tab"
            [class.my-tickets-page__tab--active]="activeTab() === 'active'"
            (click)="selectTab('active')"
            role="tab"
          >
            En cours ({{ ticketService.activeCount() }})
          </button>

          <button
            type="button"
            class="my-tickets-page__tab"
            [class.my-tickets-page__tab--active]="activeTab() === 'history'"
            (click)="selectTab('history')"
            role="tab"
          >
            Historique ({{ ticketService.historyCount() }})
          </button>
        </div>

        <!-- Loading Skeletons -->
        @if (ticketService.loading()) {
          <div class="my-tickets-page__list">
            <app-skeleton-loader type="ticket" [count]="3" />
          </div>
        } @else if (ticketService.error()) {
          <!-- Error State -->
          <app-error-state
            [message]="ticketService.error()!"
            (retry)="ticketService.loadTickets()"
          />
        } @else {
          <!-- Ticket Cards List -->
          <div class="my-tickets-page__list">
            @for (ticket of displayedTickets(); track ticket.id) {
              <app-ticket-card [ticket]="ticket" />
            } @empty {
              @if (activeTab() === 'active') {
                <app-empty-state
                  icon="ticket"
                  title="Aucun ticket en cours"
                  description="Vous n'avez pas de ticket actif pour le moment. Trouvez un salon et rejoignez la file d'attente !"
                  actionLabel="Trouver un salon"
                  actionRoute="/client/home"
                />
              } @else {
                <app-empty-state
                  icon="ticket"
                  title="Aucun historique"
                  description="Vos anciens tickets terminés ou annulés apparaîtront ici."
                />
              }
            }
          </div>

          <!-- Bottom Infinite Scroll Sentinel & Indicator -->
          @if (displayedTickets().length > 0) {
            <div #scrollSentinel class="my-tickets-page__sentinel">
              @if (loadingMore()) {
                <div class="my-tickets-page__loading-more">
                  <div class="my-tickets-page__spinner"></div>
                  <span>Chargement d'autres tickets…</span>
                </div>
              } @else if (!hasMoreToLoad()) {
                <div class="my-tickets-page__end-message">
                  <span>✨ Vous avez vu tous vos tickets</span>
                </div>
              }
            </div>
          }
        }
      </div>
    </app-client-layout>
  `,
  styleUrl: './my-tickets-page.scss'
})
export class MyTicketsPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  protected readonly ticketService = inject(TicketService);
  protected readonly notificationService = inject(NotificationService);
  protected readonly activeTab = this.ticketService.activeTab;

  @ViewChild('scrollSentinel') sentinelRef?: ElementRef<HTMLDivElement>;
  private observer?: IntersectionObserver;

  // ── Infinite Scroll State (Lazy Load by 10) ─────────────────
  protected readonly pageSize = 10;
  protected readonly displayedLimit = signal<number>(10);
  protected readonly loadingMore = signal<boolean>(false);

  protected readonly displayedTickets = computed(() => {
    return this.ticketService.displayedTickets().slice(0, this.displayedLimit());
  });

  protected readonly hasMoreToLoad = computed(() => {
    return this.displayedLimit() < this.ticketService.displayedTickets().length;
  });

  ngOnInit(): void {
    this.ticketService.loadTickets();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onWindowScroll, { passive: true });
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onWindowScroll);
    }
  }

  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    this.observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && this.hasMoreToLoad() && !this.loadingMore()) {
          this.loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    if (this.sentinelRef?.nativeElement) {
      this.observer.observe(this.sentinelRef.nativeElement);
    }
  }

  private readonly onWindowScroll = (): void => {
    if (typeof window === 'undefined') return;
    const scrollBottom = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
    if (scrollBottom < 250 && this.hasMoreToLoad() && !this.loadingMore()) {
      this.loadMore();
    }
  };

  protected loadMore(): void {
    if (!this.hasMoreToLoad() || this.loadingMore()) return;
    this.loadingMore.set(true);

    setTimeout(() => {
      this.displayedLimit.update((prev) => prev + this.pageSize);
      this.loadingMore.set(false);

      if (this.sentinelRef?.nativeElement && this.observer) {
        this.observer.disconnect();
        this.observer.observe(this.sentinelRef.nativeElement);
      }
    }, 300);
  }

  protected selectTab(tab: TicketTab): void {
    this.ticketService.activeTab.set(tab);
    this.displayedLimit.set(this.pageSize);
  }

  protected goToNotifications(): void {
    this.router.navigate(['/client/notifications']);
  }
}
