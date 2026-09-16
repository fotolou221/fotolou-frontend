import { Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, signal } from '@angular/core';
import type { Options as QrStylingOptions } from 'qr-code-styling';

export type QrDownloadFormat = 'png' | 'svg' | 'webp';

/**
 * QR code de marque Fotolou (points arrondis, couleur d'accent, logo au centre),
 * rendu 100% côté client. La librairie `qr-code-styling` est chargée en import
 * dynamique pour ne pas alourdir le bundle principal des pages qui ne l'utilisent pas.
 */
@Component({
  selector: 'app-qr-code',
  imports: [],
  template: `
    <div class="qr-code" [style.width.px]="size" [style.height.px]="size">
      <div #qrHost class="qr-code__canvas" [class.qr-code__canvas--ready]="ready()"></div>
      @if (!ready() && !errorMsg()) {
        <div class="qr-code__skeleton" aria-hidden="true"></div>
      }
      @if (errorMsg()) {
        <div class="qr-code__error" role="alert">{{ errorMsg() }}</div>
      }
    </div>

    @if (showDownloadButtons) {
      <div class="qr-code__actions">
        <button type="button" class="qr-code__action-btn" [disabled]="!ready()" (click)="download('png')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>PNG</span>
        </button>
        <button type="button" class="qr-code__action-btn" [disabled]="!ready()" (click)="download('svg')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>SVG</span>
        </button>
      </div>
    }
  `,
  styleUrl: './qr-code.scss'
})
export class QrCode implements OnChanges, OnDestroy {
  /** Donnée encodée dans le QR (typiquement une URL). */
  @Input({ required: true }) value = '';
  /** Taille du carré (px). */
  @Input() size = 220;
  /** Couleur d'accent des modules / coins du QR. */
  @Input() accentColor = '#1E5AF0';
  /** Affiche des boutons de téléchargement intégrés (PNG / SVG). */
  @Input() showDownloadButtons = false;
  /** Nom de fichier (sans extension) utilisé au téléchargement. */
  @Input() downloadFileName = 'fotolou-qrcode';
  /**
   * Résolution (px) du fichier exporté, indépendante de la taille d'aperçu à l'écran
   * (`size`). Un QR affiché en petit (ex: 96px dans une carte compacte) doit quand
   * même se télécharger net et imprimable : on régénère toujours l'export à cette
   * résolution plutôt que de rasteriser le petit aperçu.
   */
  @Input() downloadSize = 1024;

  @ViewChild('qrHost', { static: true }) private hostRef!: ElementRef<HTMLDivElement>;

  protected readonly ready = signal(false);
  protected readonly errorMsg = signal<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private instance: any | null = null;
  private renderToken = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['size'] || changes['accentColor']) {
      void this.render();
    }
  }

  ngOnDestroy(): void {
    this.instance = null;
  }

  /**
   * Résolution réelle (px) à laquelle dessiner le canvas pour un affichage net sur
   * les écrans HiDPI/Retina : un canvas dessiné pixel pour pixel à `size` (CSS px)
   * paraît flou dès que le ratio de pixels de l'appareil dépasse 1, car le navigateur
   * doit alors suréchantillonner un bitmap trop petit. On dessine donc plus grand
   * (jusqu'à 3x) puis on laisse le CSS (`max-width: 100%; height: auto`) redimensionner
   * le canvas à sa taille d'affichage voulue.
   */
  private renderPixelSize(displayPx: number): number {
    const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
    return Math.round(displayPx * Math.min(Math.max(dpr, 1), 3));
  }

  private buildOptions(squarePx: number): Partial<QrStylingOptions> {
    return {
      type: 'canvas',
      width: squarePx,
      height: squarePx,
      data: this.value.trim(),
      margin: Math.round(squarePx * 0.06),
      qrOptions: { errorCorrectionLevel: 'H' },
      image: 'images/logoFotolou-blue-small.png',
      imageOptions: { imageSize: 0.42, margin: Math.round(squarePx * 0.04), hideBackgroundDots: true, crossOrigin: 'anonymous' },
      dotsOptions: { type: 'rounded', color: this.accentColor },
      cornersSquareOptions: { type: 'extra-rounded', color: this.accentColor },
      cornersDotOptions: { type: 'dot', color: this.accentColor },
      backgroundOptions: { color: '#ffffff' }
    };
  }

  private async render(): Promise<void> {
    const value = this.value?.trim();
    if (!value) {
      this.ready.set(false);
      return;
    }

    const token = ++this.renderToken;
    this.errorMsg.set(null);

    try {
      const mod = await import('qr-code-styling');
      // Une nouvelle valeur a été demandée pendant le chargement : on abandonne ce rendu obsolète.
      if (token !== this.renderToken) return;

      const QRCodeStylingCtor = mod.default;
      const options = this.buildOptions(this.renderPixelSize(this.size));

      if (!this.instance) {
        this.instance = new QRCodeStylingCtor(options);
        this.hostRef.nativeElement.innerHTML = '';
        this.instance.append(this.hostRef.nativeElement);
      } else {
        this.instance.update(options);
      }
      this.ready.set(true);
    } catch (err) {
      if (token !== this.renderToken) return;
      console.error('[QrCode] Erreur de génération du QR code:', err);
      this.errorMsg.set('Impossible de générer le QR code.');
      this.ready.set(false);
    }
  }

  /**
   * Toujours exporté à `downloadSize` (haute résolution), indépendamment de la
   * taille d'aperçu affichée à l'écran par ce composant.
   */
  async download(format: QrDownloadFormat = 'png'): Promise<void> {
    const value = this.value?.trim();
    if (!value) return;

    try {
      const mod = await import('qr-code-styling');
      const QRCodeStylingCtor = mod.default;
      const exportInstance = new QRCodeStylingCtor(this.buildOptions(this.downloadSize));
      await exportInstance.download({ name: this.downloadFileName, extension: format });
    } catch (err) {
      console.error('[QrCode] Erreur de téléchargement:', err);
      this.errorMsg.set('Le téléchargement a échoué. Réessayez.');
    }
  }
}
