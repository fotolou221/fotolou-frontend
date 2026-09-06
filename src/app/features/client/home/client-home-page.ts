import { Component, inject, signal, computed, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { LocationHeader } from '../../../shared/components/location-header/location-header';
import { SearchBar } from '../../../shared/components/search-bar/search-bar';
import { SectionHeading } from '../../../shared/components/section-heading/section-heading';
import { SalonListCard } from '../../../shared/components/salon-list-card/salon-list-card';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { SalonService } from '../../../shared/services/salon.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { AuthSessionService } from '../../auth/auth-session.service';

@Component({
  selector: 'app-client-home-page',
  imports: [
    ClientLayout,
    LocationHeader,
    SearchBar,
    SectionHeading,
    SalonListCard,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <app-client-layout activeNav="home">
      <!-- Standard Sticky Location Header -->
      <app-location-header
        slot="header"
        [location]="salonService.currentLocation()"
        [hasNotification]="notificationService.unreadCount() > 0"
        (notificationClick)="goToNotifications()"
        (favoritesClick)="goToFavorites()"
      />

      <!-- Fixed & Scrollable Home Container -->
      <div class="client-home">

        <!-- 100% FIXED TOP SECTION (Greeting + Search + Salons Section Title) -->
        <header class="client-home__pinned-header">
          <section class="client-home__greeting">
            <h1>
              Bonjour, <span class="client-home__user-name">{{ userName }}</span> 👋
            </h1>
          </section>

          <!-- Search Bar -->
          <section class="client-home__search">
            <app-search-bar
              [value]="salonService.searchQuery()"
              (valueChange)="onSearchChange($event)"
              placeholder="Rechercher un salon, un quartier..."
            />
          </section>

          <!-- Section Heading "Salons recommandés" -->
          <section class="client-home__heading-wrap">
            <app-section-heading
              title="Salons recommandés"
            />
          </section>
        </header>

        <!-- INDEPENDENTLY SCROLLABLE SALONS LIST -->
        <main #scrollContent class="client-home__scroll-content" (scroll)="onContainerScroll()">
          @if (salonService.loading()) {
            <div class="client-home__list">
              <app-skeleton-loader type="salon" [count]="4" />
            </div>
          } @else if (salonService.error()) {
            <!-- Error State with Retry -->
            <app-error-state
              [message]="salonService.error()!"
              (retry)="salonService.loadSalons()"
            />
          } @else {
            <!-- Infinite Loaded Salons List -->
            <div class="client-home__list">
              @for (salon of displayedSalons(); track salon.id + '-' + $index) {
                <app-salon-list-card [salon]="salon" />
              } @empty {
                <app-empty-state
                  [icon]="salonService.searchQuery() ? 'search' : 'ticket'"
                  [title]="salonService.searchQuery() ? 'Aucun salon trouvé' : 'Aucun salon disponible pour le moment'"
                  [description]="salonService.searchQuery() ? 'Essayez une autre recherche ou réinitialisez vos filtres.' : 'Les salons partenaires de Fotolou apparaîtront dès leur ouverture. Revenez très bientôt !'"
                  [actionLabel]="salonService.searchQuery() ? 'Effacer la recherche' : 'Actualiser'"
                  (action)="salonService.searchQuery() ? clearSearch() : salonService.loadSalons()"
                />
              }
            </div>

            <!-- Bottom Infinite Scroll Trigger / Indicator -->
            @if (displayedSalons().length > 0) {
              <div #scrollSentinel class="client-home__sentinel">
                @if (loadingMore()) {
                  <div class="client-home__loading-more">
                    <span class="client-home__spinner"></span>
                    <span>Chargement d'autres salons...</span>
                  </div>
                } @else if (!hasMoreToLoad()) {
                  <div class="client-home__end-message">
                    <span>✨ Vous avez vu tous les salons disponibles</span>
                  </div>
                }
              </div>
            }
          }
        </main>

      </div>
    </app-client-layout>
  `,
  styleUrl: './client-home-page.scss'
})
export class ClientHomePage implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  protected readonly salonService = inject(SalonService);
  protected readonly notificationService = inject(NotificationService);
  private readonly auth = inject(AuthSessionService);

  @ViewChild('scrollContent') scrollContentRef?: ElementRef<HTMLElement>;
  @ViewChild('scrollSentinel') sentinelRef?: ElementRef<HTMLDivElement>;
  private observer?: IntersectionObserver;

  // ── Infinite Scroll State (Lazy Load by 10) ─────────────────
  protected readonly pageSize = 10;
  protected readonly displayedLimit = signal<number>(10);
  protected readonly loadingMore = signal<boolean>(false);

  protected readonly allSalons = computed(() => this.salonService.filteredSalons());

  protected readonly displayedSalons = computed(() => {
    const list = this.allSalons();
    return list.slice(0, this.displayedLimit());
  });

  protected readonly hasMoreToLoad = computed(() => {
    return this.displayedLimit() < this.allSalons().length;
  });

  protected get userName(): string {
    const user = this.auth.activeUser();
    if (user && user.name && user.name !== 'Mon Compte') {
      const parts = user.name.trim().split(' ');
      return parts[0] || 'Client';
    }
    return 'Client';
  }

  ngOnInit(): void {
    this.displayedLimit.set(this.pageSize);
    this.salonService.loadSalons();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
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
      {
        root: this.scrollContentRef?.nativeElement ?? null,
        rootMargin: '100px'
      }
    );

    if (this.sentinelRef?.nativeElement) {
      this.observer.observe(this.sentinelRef.nativeElement);
    }
  }

  protected onContainerScroll(): void {
    if (!this.scrollContentRef?.nativeElement) return;
    const el = this.scrollContentRef.nativeElement;
    const scrollBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    if (scrollBottom < 120 && this.hasMoreToLoad() && !this.loadingMore()) {
      this.loadMore();
    }
  }

  protected loadMore(): void {
    if (!this.hasMoreToLoad() || this.loadingMore()) return;

    this.loadingMore.set(true);

    setTimeout(() => {
      this.displayedLimit.update((prev) => prev + this.pageSize);
      this.loadingMore.set(false);

      // Re-observe sentinel if needed
      if (this.sentinelRef?.nativeElement && this.observer) {
        this.observer.disconnect();
        this.observer.observe(this.sentinelRef.nativeElement);
      }
    }, 350);
  }

  protected onSearchChange(val: string): void {
    this.salonService.searchQuery.set(val);
    this.displayedLimit.set(this.pageSize);
  }

  protected clearSearch(): void {
    this.salonService.searchQuery.set('');
    this.displayedLimit.set(this.pageSize);
  }

  protected goToNotifications(): void {
    this.router.navigate(['/client/notifications']);
  }

  protected goToFavorites(): void {
    this.router.navigate(['/client/favorites']);
  }
}
