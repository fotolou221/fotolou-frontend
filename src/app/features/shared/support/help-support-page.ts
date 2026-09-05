import { Component, inject, signal } from '@angular/core';
import { ClientLayout } from '../../../shared/components/client-layout/client-layout';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { AuthSessionService } from '../../auth/auth-session.service';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-help-support-page',
  imports: [
    ClientLayout,
    PageHeader
  ],
  template: `
    <app-client-layout [showBottomNav]="false" [hasCustomFooter]="false">
      <!-- Fixed Header Slot -->
      <app-page-header
        slot="header"
        title="Aide & Support"
        [backRoute]="backRoute"
      />

      <!-- Main Content -->
      <div class="support-page__content">
        <!-- Hero Contact Buttons -->
        <section class="support-contact-hero">
          <h1>Besoin d'aide ?</h1>
          <p>Notre équipe support est disponible pour répondre à toutes vos questions.</p>

          <div class="support-contact-btns">
            <a [href]="whatsappUrl" target="_blank" rel="noopener" class="support-btn support-btn--wa">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.82 14.1c-.25.7-1.46 1.34-2.02 1.4-.53.07-1.22.1-1.96-.14-.45-.15-1.03-.34-1.78-.67-3.14-1.36-5.18-4.54-5.34-4.75-.16-.21-1.29-1.72-1.29-3.28 0-1.56.82-2.33 1.11-2.65.29-.32.64-.4.85-.4.21 0 .42.01.6.01.2 0 .46-.07.72.55.26.63.89 2.17.97 2.32.08.16.13.35.03.56-.1.21-.16.34-.31.52-.16.18-.33.4-.47.54-.15.15-.31.31-.13.62.18.3.8 1.32 1.72 2.14 1.18 1.05 2.18 1.38 2.49 1.54.31.16.49.13.67-.08.18-.21.77-.9 1-.1.21.23.21.37.05.78.7.16.41.32.82.32 1.23 0 .41-.25.82-1.02.82z"/>
              </svg>
              <span>Support WhatsApp</span>
            </a>

            <a href="tel:+221778627052" class="support-btn support-btn--call">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 7.55 7.55l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>Appeler le +221 77 862 70 52</span>
            </a>
          </div>
        </section>

        <!-- FAQ Accordion -->
        <section class="support-faq">
          <h2 class="support-section-title">Foire Aux Questions</h2>

          <div class="support-faq-list">
            @for (item of faqItems(); track item.id) {
              <div class="faq-card" [class.faq-card--open]="item.isOpen">
                <button type="button" class="faq-card__header" (click)="toggleFaq(item.id)">
                  <span class="faq-card__question">{{ item.question }}</span>
                  <span class="faq-card__icon">{{ item.isOpen ? '−' : '+' }}</span>
                </button>

                @if (item.isOpen) {
                  <p class="faq-card__answer">{{ item.answer }}</p>
                }
              </div>
            }
          </div>
        </section>

        <!-- Send Message Form -->
        <section class="support-feedback">
          <h2 class="support-section-title">Envoyez-nous un message</h2>

          @if (messageSent()) {
            <div class="support-feedback__success">
              <p>✅ Votre message a été envoyé avec succès. Notre équipe vous répondra rapidement.</p>
            </div>
          } @else {
            <form class="support-feedback__form" (submit)="sendMessage($event)">
              <textarea
                #messageInput
                rows="4"
                placeholder="Décrivez votre question ou remarque ici..."
                required
              ></textarea>
              <button type="submit" class="support-feedback__submit-btn">
                Envoyer le message
              </button>
            </form>
          }
        </section>
      </div>
    </app-client-layout>
  `,
  styleUrl: './help-support-page.scss'
})
export class HelpSupportPage {
  protected readonly auth = inject(AuthSessionService);

  protected readonly messageSent = signal(false);

  protected readonly faqItems = signal<FaqItem[]>([
    {
      id: 'faq-1',
      question: 'Comment prendre un ticket en ligne ?',
      answer: 'Choisissez le salon de votre choix depuis l\'accueil, sélectionnez le bénéficiaire du ticket (pour vous ou un proche) et validez la prise de ticket en 1 clic.',
      isOpen: true
    },
    {
      id: 'faq-2',
      question: 'Comment suivre une commande boutique ?',
      answer: 'Accédez à l\'onglet Profil -> Mes Commandes pour consulter vos commandes en cours et échanger avec notre équipe sur WhatsApp.',
      isOpen: false
    },
    {
      id: 'faq-3',
      question: 'Comment ajouter ou modifier un proche ?',
      answer: 'Dans l\'onglet Profil, cliquez sur "Mes Proches" pour ajouter ou modifier les membres de votre famille.',
      isOpen: false
    },
    {
      id: 'faq-4',
      question: 'Comment fonctionne le mode Coiffeur Salon ?',
      answer: 'Les professionnels connectés gèrent leur file d\'attente en direct avec les boutons "Sauter", "Marquer Servi" et l\'ajout de clients venus sur place.',
      isOpen: false
    }
  ]);

  protected get backRoute(): string {
    return this.auth.activeRole() === 'coiffeur' ? '/coiffeur/profile' : '/client/profile';
  }

  protected get whatsappUrl(): string {
    const text = encodeURIComponent("Bonjour ! J'ai besoin d'assistance sur l'application Fotolou.");
    return `https://wa.me/221778627052?text=${text}`;
  }

  protected toggleFaq(id: string): void {
    this.faqItems.update((items) =>
      items.map((item) => (item.id === id ? { ...item, isOpen: !item.isOpen } : item))
    );
  }

  protected sendMessage(event: Event): void {
    event.preventDefault();
    this.messageSent.set(true);
  }
}
