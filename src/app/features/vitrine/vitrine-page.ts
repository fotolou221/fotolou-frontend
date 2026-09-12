import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PwaService } from '../../shared/services/pwa.service';
import { AuthSessionService } from '../auth/auth-session.service';
import { VitrineStatsService, PublicStats, DEFAULT_VITRINE_STATS } from './services/vitrine-stats.service';

interface FaqItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-vitrine-page',
  imports: [RouterLink],
  template: `
    <div class="vitrine">

      <!-- ══════════════════════════════════════════════════════════
           1. TOP NAVIGATION HEADER
      ══════════════════════════════════════════════════════════ -->
      <header class="vitrine-header">
        <div class="vitrine-header__container">
          
          <!-- Real Logo Fotolou (Blue for white header) -->
          <a routerLink="/" class="vitrine-header__logo">
            <img src="images/logoFotolou-blue-small.png" alt="Fotolou - Moins d'attente, plus de temps" class="vitrine-header__logo-img" />
          </a>

          <!-- Nav Links (Desktop) -->
          <nav class="vitrine-header__nav" aria-label="Navigation principale">
            <a href="#hero" class="vitrine-header__link">Accueil</a>
            <a href="#features" class="vitrine-header__link">Fonctionnalités</a>
            <a href="#how-it-works" class="vitrine-header__link">Comment ça marche</a>
            <a href="#reviews" class="vitrine-header__link">Avis</a>
            <a href="#faq" class="vitrine-header__link">FAQ</a>
            <a href="#contact" class="vitrine-header__link">Contact</a>
          </nav>

          <!-- Header CTA Buttons -->
          <div class="vitrine-header__actions">
            <a
              routerLink="/auth/login"
              class="vitrine-btn vitrine-btn--outline vitrine-header__btn"
              title="Accéder à l'application"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              <span>Se connecter</span>
            </a>

            <button
              type="button"
              class="vitrine-btn vitrine-btn--primary vitrine-header__btn"
              (click)="triggerInstall()"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span class="vitrine-header__btn-text-full">Télécharger l'application</span>
              <span class="vitrine-header__btn-text-short">Télécharger</span>
            </button>
          </div>

        </div>
      </header>


      <!-- ══════════════════════════════════════════════════════════
           2. HERO SECTION
      ══════════════════════════════════════════════════════════ -->
      <section id="hero" class="vitrine-hero">
        <div class="vitrine-hero__container">
          
          <!-- Left Column: Copy & CTAs -->
          <div class="vitrine-hero__copy">
            
            <div class="vitrine-badge">
              <span class="vitrine-badge__dot"></span>
              <span>NOUVEAU &bull; L'application de réservation de salon à Dakar</span>
            </div>

            <h1 class="vitrine-hero__title">
              Moins d'attente.<br />
              <span class="vitrine-hero__title-highlight">Plus de temps.</span>
            </h1>

            <p class="vitrine-hero__desc">
              Fotolou vous permet de prendre un ticket virtuel dans votre salon de coiffure préféré et de savoir exactement quand vous faire couper sans rester bloqué dans la salle d'attente.
            </p>

            <div class="vitrine-hero__actions">
              <a
                routerLink="/auth/login"
                class="vitrine-btn vitrine-btn--primary vitrine-btn--lg"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                <span>Ouvrir l'application</span>
              </a>

              <button
                type="button"
                class="vitrine-btn vitrine-btn--outline vitrine-btn--lg"
                (click)="triggerInstall()"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Installer la PWA</span>
              </button>
            </div>

          </div>

          <!-- Right Column: Interactive 3D Phone Mockup (Accurate to user mockup) -->
          <div class="vitrine-hero__visual">
            <div class="vitrine-phone">
              <div class="vitrine-phone__notch"></div>
              <div class="vitrine-phone__screen">
                
                <!-- Status Bar -->
                <div class="vitrine-phone__statusbar">
                  <span>9:41</span>
                  <div class="vitrine-phone__statusbar-icons">
                    <span>5G</span>
                    <div class="vitrine-phone__battery"></div>
                  </div>
                </div>

                <!-- App Header -->
                <div class="vitrine-phone__app-header">
                  <div class="vitrine-phone__salon-badge">
                    <img src="icons/icon-192x192.png" alt="Fotolou" class="vitrine-phone__app-icon" />
                    <div>
                      <strong>King Barber</strong>
                      <span>Mermoz &bull; Dakar</span>
                    </div>
                  </div>
                  <span class="vitrine-phone__status-open">Ouvert</span>
                </div>

                <!-- Ticket Radial Display -->
                <div class="vitrine-phone__ticket-card">
                  <span class="vitrine-phone__ticket-label">VOTRE TICKET EN DIRECT</span>
                  <div class="vitrine-phone__circle">
                    <div class="vitrine-phone__circle-inner">
                      <span class="vitrine-phone__circle-sub">Tu es le numéro</span>
                      <strong class="vitrine-phone__circle-number">6</strong>
                    </div>
                  </div>
                </div>

                <!-- Queue Stats (Matching mockup: Position & People Ahead) -->
                <div class="vitrine-phone__queue-grid">
                  <div class="vitrine-phone__queue-stat">
                    <span class="vitrine-phone__stat-label">Position</span>
                    <strong class="vitrine-phone__stat-val">6ème</strong>
                  </div>
                  <div class="vitrine-phone__queue-stat">
                    <span class="vitrine-phone__stat-label">Personnes devant</span>
                    <strong class="vitrine-phone__stat-val">2 pers.</strong>
                  </div>
                </div>

                <!-- Action Status in Phone -->
                <div class="vitrine-phone__footer-btn">
                  <span>Votre tour approche</span>
                </div>

              </div>
            </div>

            <!-- Decorative Floating Elements -->
            <div class="vitrine-float-badge vitrine-float-badge--1">
              <div class="vitrine-float-badge__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div class="vitrine-float-badge__text">
                <strong>Zéro file d'attente</strong>
                <span>Gain moyen : 1h30</span>
              </div>
            </div>

            <div class="vitrine-float-badge vitrine-float-badge--2">
              <div class="vitrine-float-badge__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div class="vitrine-float-badge__text">
                <strong>Alerte en direct</strong>
                <span>Notification à votre tour</span>
              </div>
            </div>

          </div>

        </div>
      </section>


      <!-- ══════════════════════════════════════════════════════════
           3. KEY STATS METRICS (Professional Clean SVG Icons)
      ══════════════════════════════════════════════════════════ -->
      <section class="vitrine-stats">
        <div class="vitrine-stats__container">
          
          <!-- Stat 1: Utilisateurs actifs -->
          <div class="vitrine-stat-item">
            <div class="vitrine-stat-item__icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="vitrine-stat-item__content">
              <strong>{{ stats().activeUsersFormatted }}</strong>
              <span>Utilisateurs actifs</span>
            </div>
          </div>

          <!-- Stat 2: Salons partenaires -->
          <div class="vitrine-stat-item">
            <div class="vitrine-stat-item__icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="6" cy="6" r="3"/>
                <circle cx="6" cy="18" r="3"/>
                <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                <line x1="14.47" y1="14.48" x2="20" y2="20"/>
                <line x1="8.12" y1="8.12" x2="12" y2="12"/>
              </svg>
            </div>
            <div class="vitrine-stat-item__content">
              <strong>{{ stats().totalSalonsFormatted }}</strong>
              <span>Salons partenaires</span>
            </div>
          </div>

          <!-- Stat 3: Taux de satisfaction -->
          <div class="vitrine-stat-item">
            <div class="vitrine-stat-item__icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div class="vitrine-stat-item__content">
              <strong>{{ stats().satisfactionRateFormatted }}</strong>
              <span>Taux de satisfaction</span>
            </div>
          </div>

          <!-- Stat 4: Service disponible -->
          <div class="vitrine-stat-item">
            <div class="vitrine-stat-item__icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="vitrine-stat-item__content">
              <strong>{{ stats().serviceAvailability }}</strong>
              <span>Service disponible</span>
            </div>
          </div>

        </div>
      </section>


      <!-- ══════════════════════════════════════════════════════════
           4. LE PROBLÈME DES SALONS CLASSIQUES
      ══════════════════════════════════════════════════════════ -->
      <section class="vitrine-problem">
        <div class="vitrine-container">
          
          <div class="vitrine-section-head">
            <span class="vitrine-tag">LE PROBLÈME DES SALONS CLASSIQUES</span>
            <h2 class="vitrine-section-title">Trop d'attente, trop de perte de temps.</h2>
            <p class="vitrine-section-sub">
              Les files d'attente des salons de coiffure à Dakar sont souvent imprévisibles et frustrantes. Fotolou met fin à cette perte de temps.
            </p>
          </div>

          <div class="vitrine-problem__grid">
            
            <div class="vitrine-problem-card">
              <div class="vitrine-problem-card__badge">1</div>
              <div class="vitrine-problem-card__img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=500&q=80"
                  alt="Longues files d'attente"
                  class="vitrine-problem-card__img"
                />
              </div>
              <div class="vitrine-problem-card__body">
                <h3>Longues files d'attente</h3>
                <p>Des heures passées assis à attendre sans savoir exactement quand viendra votre tour.</p>
              </div>
            </div>

            <div class="vitrine-problem-card">
              <div class="vitrine-problem-card__badge">2</div>
              <div class="vitrine-problem-card__img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=500&q=80"
                  alt="Salons bondés"
                  class="vitrine-problem-card__img"
                />
              </div>
              <div class="vitrine-problem-card__body">
                <h3>Salons bondés</h3>
                <p>Salles surchargées le week-end, veilles de fête et créneaux de pointe sans visibilité.</p>
              </div>
            </div>

            <div class="vitrine-problem-card">
              <div class="vitrine-problem-card__badge">3</div>
              <div class="vitrine-problem-card__img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=500&q=80"
                  alt="Perte de temps précieux"
                  class="vitrine-problem-card__img"
                />
              </div>
              <div class="vitrine-problem-card__body">
                <h3>Perte de temps précieux</h3>
                <p>Un temps précieux perdu que vous pourriez consacrer à votre travail, vos loisirs ou votre famille.</p>
              </div>
            </div>

          </div>

        </div>
      </section>


      <!-- ══════════════════════════════════════════════════════════
           5. COMMENT ÇA MARCHE ? (4 STEPS)
      ══════════════════════════════════════════════════════════ -->
      <section id="how-it-works" class="vitrine-steps">
        <div class="vitrine-container">
          
          <div class="vitrine-section-head">
            <span class="vitrine-tag">&mdash; COMMENT ÇA MARCHE ? &mdash;</span>
            <h2 class="vitrine-section-title">Prenez votre tour en 4 étapes simples</h2>
            <p class="vitrine-section-sub">
              Une prise en main immédiate, sans inscription complexe et accessible à tous.
            </p>
          </div>

          <div class="vitrine-steps__grid">
            
            <!-- Step 1 -->
            <div class="vitrine-step-card">
              <div class="vitrine-step-card__num">1</div>
              <div class="vitrine-step-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <h3>Choisissez votre salon</h3>
              <p>Explorez les meilleurs salons de Dakar par quartier et consultez l'affluence en direct.</p>
            </div>

            <!-- Step 2 -->
            <div class="vitrine-step-card">
              <div class="vitrine-step-card__num">2</div>
              <div class="vitrine-step-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                  <line x1="6" y1="15" x2="10" y2="15"/>
                </svg>
              </div>
              <h3>Prenez un ticket virtuel</h3>
              <p>Générez votre numéro de passage en 1 clic pour vous ou pour vos proches.</p>
            </div>

            <!-- Step 3 -->
            <div class="vitrine-step-card">
              <div class="vitrine-step-card__num">3</div>
              <div class="vitrine-step-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <h3>Suivez votre position</h3>
              <p>Voyez le nombre de personnes devant vous et le statut en temps réel.</p>
            </div>

            <!-- Step 4 -->
            <div class="vitrine-step-card">
              <div class="vitrine-step-card__num">4</div>
              <div class="vitrine-step-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <h3>Passez sans attendre</h3>
              <p>Recevez une alerte lorsque c'est votre tour et installez-vous directement sur le fauteuil.</p>
            </div>

          </div>

        </div>
      </section>


      <!-- ══════════════════════════════════════════════════════════
           6. FONCTIONNALITÉS PRINCIPALES (Clean SVG Icons in Squircles)
      ══════════════════════════════════════════════════════════ -->
      <section id="features" class="vitrine-features">
        <div class="vitrine-container">
          
          <div class="vitrine-section-head">
            <span class="vitrine-tag">FONCTIONNALITÉS PRINCIPALES</span>
            <h2 class="vitrine-section-title">Tout ce dont vous avez besoin dans une seule app</h2>
            <p class="vitrine-section-sub">
              Pensée pour les clients exigeants et les coiffeurs modernes.
            </p>
          </div>

          <div class="vitrine-features__grid">
            
            <!-- Feature 1: File en temps réel -->
            <div class="vitrine-feature-card">
              <div class="vitrine-feature-card__icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3>File en temps réel</h3>
              <p>Suivez en direct le numéro en cours et l'avancement de la file d'attente à la seconde près.</p>
            </div>

            <!-- Feature 2: Accès multi-proches -->
            <div class="vitrine-feature-card">
              <div class="vitrine-feature-card__icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>Accès multi-proches</h3>
              <p>Prenez des tickets simultanés pour vos enfants, vos parents ou vos amis en toute simplicité.</p>
            </div>

            <!-- Feature 3: Notifications intelligentes -->
            <div class="vitrine-feature-card">
              <div class="vitrine-feature-card__icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <h3>Notifications intelligentes</h3>
              <p>Soyez averti par alerte visuelle et sonore dès que vous êtes le prochain sur la liste.</p>
            </div>

            <!-- Feature 4: Boutique de produits -->
            <div class="vitrine-feature-card">
              <div class="vitrine-feature-card__icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <h3>Boutique de produits</h3>
              <p>Commandez vos tondeuses Wahl, soins capillaires et accessoires de coiffure directement.</p>
            </div>

            <!-- Feature 5: Salons favoris -->
            <div class="vitrine-feature-card">
              <div class="vitrine-feature-card__icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3>Salons favoris</h3>
              <p>Enregistrez vos salons réguliers pour réserver en 1 seconde sans refaire de recherche.</p>
            </div>

            <!-- Feature 6: Installation PWA instantanée -->
            <div class="vitrine-feature-card">
              <div class="vitrine-feature-card__icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                  <path d="M12 7v6m-3-3l3 3 3-3"/>
                </svg>
              </div>
              <h3>Installation PWA instantanée</h3>
              <p>Fonctionne comme une véritable application mobile sans encombrer la mémoire de votre téléphone.</p>
            </div>

          </div>

        </div>
      </section>


      <!-- ══════════════════════════════════════════════════════════
           7. DES AVANTAGES POUR TOUS & CAROUSEL D'ÉCRANS
      ══════════════════════════════════════════════════════════ -->
      <section class="vitrine-benefits">
        <div class="vitrine-container">
          
          <div class="vitrine-section-head">
            <span class="vitrine-tag">DES AVANTAGES POUR TOUS</span>
            <h2 class="vitrine-section-title">Une expérience conçue pour votre quotidien</h2>
          </div>

          <div class="vitrine-benefits__layout">
            
            <!-- Left Perks List -->
            <div class="vitrine-benefits__copy">
              <h3 class="vitrine-benefits__role-title">Pour les clients :</h3>
              
              <ul class="vitrine-benefits__list">
                <li>
                  <span class="vitrine-check">✓</span>
                  <div>
                    <strong>Zéro attente inutile au salon</strong>
                    <p>Arrivez pile au moment où le coiffeur est prêt pour vous.</p>
                  </div>
                </li>
                <li>
                  <span class="vitrine-check">✓</span>
                  <div>
                    <strong>Liberté totale d'emploi du temps</strong>
                    <p>Faites vos courses ou restez chez vous pendant que la file avance.</p>
                  </div>
                </li>
                <li>
                  <span class="vitrine-check">✓</span>
                  <div>
                    <strong>Gestion familiale des tickets</strong>
                    <p>Inscrivez vos proches et suivez tous les tickets sur un seul écran.</p>
                  </div>
                </li>
                <li>
                  <span class="vitrine-check">✓</span>
                  <div>
                    <strong>Application 100% gratuite</strong>
                    <p>Aucun frais caché ni abonnement requis pour les clients.</p>
                  </div>
                </li>
              </ul>

              <div class="vitrine-benefits__cta">
                <button type="button" class="vitrine-btn vitrine-btn--primary" (click)="triggerInstall()">
                  Installer l'application maintenant
                </button>
              </div>
            </div>

            <!-- Right App Screens Showcase -->
            <div class="vitrine-benefits__screens">
              
              <div class="vitrine-screen-card">
                <div class="vitrine-screen-card__header">Accueil Salons</div>
                <img
                  src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80"
                  alt="Accueil Fotolou"
                />
                <span>Recommandations</span>
              </div>

              <div class="vitrine-screen-card vitrine-screen-card--featured">
                <div class="vitrine-screen-card__header">Ticket en Direct</div>
                <img
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80"
                  alt="Ticket en direct"
                />
                <span>Position #6</span>
              </div>

              <div class="vitrine-screen-card">
                <div class="vitrine-screen-card__header">Boutique Pro</div>
                <img
                  src="https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=400&q=80"
                  alt="Boutique Fotolou"
                />
                <span>Soins & Tondeuses</span>
              </div>

            </div>

          </div>

        </div>
      </section>


      <!-- ══════════════════════════════════════════════════════════
           8. AVIS CLIENTS (TESTIMONIALS)
      ══════════════════════════════════════════════════════════ -->
      <section id="reviews" class="vitrine-reviews">
        <div class="vitrine-container">
          
          <div class="vitrine-section-head">
            <span class="vitrine-tag">AVIS DE NOS UTILISATEURS</span>
            <h2 class="vitrine-section-title">Une expérience simple et intuitive</h2>
            <p class="vitrine-section-sub">
              Découvrez ce que les dakarois disent de Fotolou.
            </p>
          </div>

          <div class="vitrine-reviews__grid">
            
            <div class="vitrine-review-card">
              <div class="vitrine-review-card__stars">★★★★★</div>
              <p class="vitrine-review-card__text">
                « Grâce à Fotolou, je n'attends plus jamais 2h au salon le samedi. Je prends mon ticket depuis la maison et j'arrive pile à l'heure ! »
              </p>
              <div class="vitrine-review-card__author">
                <div class="vitrine-review-card__avatar">AD</div>
                <div>
                  <strong>Awa Diop</strong>
                  <span>Cliente régulière &bull; Mermoz</span>
                </div>
              </div>
            </div>

            <div class="vitrine-review-card">
              <div class="vitrine-review-card__stars">★★★★★</div>
              <p class="vitrine-review-card__text">
                « Une application indispensable pour les personnes occupées. Tout est super fluide et le suivi de file est très clair. »
              </p>
              <div class="vitrine-review-card__author">
                <div class="vitrine-review-card__avatar">MF</div>
                <div>
                  <strong>Mamadou Fall</strong>
                  <span>Client &bull; Almadies</span>
                </div>
              </div>
            </div>

            <div class="vitrine-review-card">
              <div class="vitrine-review-card__stars">★★★★★</div>
              <p class="vitrine-review-card__text">
                « Très pratique pour gérer la coupe de mes enfants sans rester bloquée toute l'après-midi avec eux dans le bruit. Bravo ! »
              </p>
              <div class="vitrine-review-card__author">
                <div class="vitrine-review-card__avatar">FS</div>
                <div>
                  <strong>Fatou Sow</strong>
                  <span>Mère de famille &bull; Point E</span>
                </div>
              </div>
            </div>

            <div class="vitrine-review-card">
              <div class="vitrine-review-card__stars">★★★★★</div>
              <p class="vitrine-review-card__text">
                « Meilleure innovation coiffure au Sénégal. J'ai aussi commandé ma tondeuse sur la boutique et elle est arrivée rapidement. »
              </p>
              <div class="vitrine-review-card__author">
                <div class="vitrine-review-card__avatar">AB</div>
                <div>
                  <strong>Alioune Badara</strong>
                  <span>Client &bull; Plateau</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      <!-- ══════════════════════════════════════════════════════════
           9. QUESTIONS FRÉQUENTES (FAQ ACCORDION)
      ══════════════════════════════════════════════════════════ -->
      <section id="faq" class="vitrine-faq">
        <div class="vitrine-container">
          
          <div class="vitrine-section-head">
            <span class="vitrine-tag">QUESTIONS FRÉQUENTES</span>
            <h2 class="vitrine-section-title">Tout ce que vous devez savoir</h2>
          </div>

          <div class="vitrine-faq__list">
            @for (item of faqs(); track item.question; let i = $index) {
              <div class="vitrine-faq-item" [class.vitrine-faq-item--open]="item.isOpen">
                <button
                  type="button"
                  class="vitrine-faq-item__btn"
                  (click)="toggleFaq(i)"
                  [attr.aria-expanded]="item.isOpen"
                >
                  <span class="vitrine-faq-item__q">{{ item.question }}</span>
                  <span class="vitrine-faq-item__icon">{{ item.isOpen ? '−' : '+' }}</span>
                </button>
                @if (item.isOpen) {
                  <div class="vitrine-faq-item__ans">
                    <p>{{ item.answer }}</p>
                  </div>
                }
              </div>
            }
          </div>

        </div>
      </section>


      <!-- ══════════════════════════════════════════════════════════
           10. CTA BANNER
      ══════════════════════════════════════════════════════════ -->
      <section class="vitrine-cta">
        <div class="vitrine-container">
          
          <div class="vitrine-cta__box">
            <div class="vitrine-cta__copy">
              <h2>Prêt à gagner du temps ?</h2>
              <p>Téléchargez Fotolou dès maintenant et profitez d'une nouvelle expérience dans vos salons de coiffure.</p>
              
              <div class="vitrine-cta__actions">
                <button
                  type="button"
                  class="vitrine-btn vitrine-btn--white"
                  (click)="triggerInstall()"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>Installer l'application PWA</span>
                </button>
              </div>
            </div>

            <div class="vitrine-cta__phone-visual" aria-hidden="true">
              <div class="vitrine-cta__mini-phone">
                <div class="vitrine-cta__phone-notch"></div>
                <div class="vitrine-cta__phone-screen">
                  <div class="vitrine-cta__logo-splash">
                    <img src="images/logoFotolou-small.png" alt="Fotolou" />
                    <strong>Fotolou</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>


      <!-- ══════════════════════════════════════════════════════════
           11. FOOTER (Real Logo & Clean SVG Icons)
      ══════════════════════════════════════════════════════════ -->
      <footer id="contact" class="vitrine-footer">
        <div class="vitrine-container">
          
          <div class="vitrine-footer__grid">
            
            <!-- Brand Info with Real Logo -->
            <div class="vitrine-footer__brand">
              <div class="vitrine-footer__logo">
                <img src="images/logoFotolou-small.png" alt="Fotolou" class="vitrine-footer__logo-img" />
              </div>
              <p class="vitrine-footer__desc">
                La plateforme n°1 de réservation de tickets virtuels en salon de coiffure à Dakar. Moins d'attente, plus de temps.
              </p>
              <div class="vitrine-footer__socials">
                <!-- Facebook SVG -->
                <a href="#" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <!-- Instagram SVG -->
                <a href="#" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
                <!-- Twitter/X SVG -->
                <a href="#" aria-label="X (Twitter)">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <!-- TikTok SVG -->
                <a href="#" aria-label="TikTok">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                </a>
              </div>
            </div>

            <!-- Navigation Links -->
            <div class="vitrine-footer__col">
              <h4>Navigation</h4>
              <ul>
                <li><a href="#hero">Accueil</a></li>
                <li><a href="#features">Fonctionnalités</a></li>
                <li><a href="#how-it-works">Comment ça marche</a></li>
                <li><a href="#reviews">Avis clients</a></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </div>

            <!-- Application Links -->
            <div class="vitrine-footer__col">
              <h4>Accès Application</h4>
              <ul>
                <li><a routerLink="/auth/login" style="font-weight: 700; color: #1E5AF0;">Se connecter</a></li>
                <li><a routerLink="/auth/login" [queryParams]="{ role: 'client' }" (click)="goToClientDashboard()" style="cursor:pointer">Espace Client</a></li>
                <li><a routerLink="/auth/login" [queryParams]="{ role: 'coiffeur' }" (click)="goToCoiffeurDashboard()" style="cursor:pointer">Espace Coiffeur</a></li>
                <li><a (click)="triggerInstall()" style="cursor:pointer">Installer sur mobile</a></li>
                <li><a href="#faq">Aide &amp; FAQ</a></li>
              </ul>
            </div>

            <!-- Legal & Contact with Clean SVG Icons -->
            <div class="vitrine-footer__col">
              <h4>Contact &amp; Support</h4>
              <ul class="vitrine-footer__contact-list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>Dakar, Sénégal</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <a href="mailto:fotolou3@gmail.com" style="color: inherit; text-decoration: none;">fotolou3&#64;gmail.com</a>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <a href="tel:+221778627052" style="color: inherit; text-decoration: none;">+221 77 862 70 52</a>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <a href="#faq">Centre d'aide</a>
                </li>
              </ul>
            </div>

          </div>

          <div class="vitrine-footer__bottom">
            <p>&copy; 2026 Fotolou PWA. Tous droits réservés.</p>
            <div class="vitrine-footer__legal-links">
              <a href="#">Conditions d'utilisation</a>
              <span>&bull;</span>
              <a href="#">Politique de confidentialité</a>
              <span>&bull;</span>
              <a href="#">Mentions légales</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  `,
  styleUrl: './vitrine-page.scss'
})
export class VitrinePage implements OnInit {
  private readonly router = inject(Router);
  private readonly pwa = inject(PwaService);
  private readonly authSession = inject(AuthSessionService);
  private readonly statsService = inject(VitrineStatsService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly stats = signal<PublicStats>(DEFAULT_VITRINE_STATS);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // If user opened the installed PWA on iPhone/Android or with ?source=pwa, forward directly into the app
      if (this.pwa.isStandalone() || window.location.search.includes('source=pwa')) {
        void this.router.navigateByUrl('/onboarding');
      }

      // Chargement en temps réel des statistiques publiques depuis le backend Fotolou
      this.statsService.getPublicStats().subscribe((data) => {
        if (data) {
          this.stats.set(data);
        }
      });
    }
  }

  protected goToClientDashboard(): void {
    this.authSession.selectRole('client');
    void this.router.navigate(['/auth/login'], { queryParams: { role: 'client' } });
  }

  protected goToCoiffeurDashboard(): void {
    this.authSession.selectRole('coiffeur');
    void this.router.navigate(['/auth/login'], { queryParams: { role: 'coiffeur' } });
  }

  protected readonly faqs = signal<FaqItem[]>([
    {
      question: 'Comment prendre un ticket sur Fotolou ?',
      answer: 'C\'est très simple : choisissez votre salon favori sur la page d\'accueil, cliquez sur "Prendre mon ticket", choisissez pour qui est le ticket (vous ou un proche) et confirmez. Votre numéro de passage s\'affiche instantanément.',
      isOpen: true
    },
    {
      question: 'L\'application est-elle gratuite pour les clients ?',
      answer: 'Oui, l\'utilisation de Fotolou et la prise de tickets virtuels sont 100% gratuites pour tous les clients.',
      isOpen: false
    },
    {
      question: 'Est-ce que je reçois une notification quand mon tour arrive ?',
      answer: 'Absolument ! Fotolou vous envoie une alerte automatique dès que votre numéro approche afin que vous puissiez vous rendre au salon sans précipitation.',
      isOpen: false
    },
    {
      question: 'Puis-je prendre un ticket pour un proche ?',
      answer: 'Oui ! Vous pouvez enregistrer les noms de vos enfants, parents ou amis dans l\'onglet "Mes Proches" et générer des tickets séparés pour chacun d\'entre eux.',
      isOpen: false
    },
    {
      question: 'Comment installer Fotolou sur mon smartphone ?',
      answer: 'Sur Android / Chrome : cliquez sur "Télécharger l\'application" pour installer la PWA en un clic. Sur iPhone / Safari : appuyez sur le bouton Partager en bas puis sélectionnez "Sur l\'écran d\'accueil".',
      isOpen: false
    },
    {
      question: 'Comment inscrire mon salon de coiffure sur Fotolou ?',
      answer: 'Contactez notre équipe via fotolou3@gmail.com ou au +221 77 862 70 52 pour recevoir votre kit partenaire et commencer à gérer vos files en toute sérénité.',
      isOpen: false
    }
  ]);

  protected toggleFaq(index: number): void {
    this.faqs.update((items) =>
      items.map((item, i) => ({
        ...item,
        isOpen: i === index ? !item.isOpen : item.isOpen
      }))
    );
  }

  protected triggerInstall(): void {
    this.pwa.showBanner.set(true);
    this.pwa.promptInstall();
  }
}
