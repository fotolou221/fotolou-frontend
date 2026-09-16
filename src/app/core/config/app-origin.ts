/**
 * Origine publique de l'application (utilisée pour construire des liens
 * partageables comme les QR codes). Se base sur `window.location.origin`
 * pour s'adapter automatiquement à l'environnement réel (prod, preview,
 * domaine personnalisé...) sans configuration à maintenir.
 */
export function resolveAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://fotolou.vercel.app';
}

/** Construit le lien de prise de ticket rapide pour un salon (cible du QR code). */
export function buildSalonTicketUrl(salonSlugOrId: string): string {
  return `${resolveAppOrigin()}/client/salons/${encodeURIComponent(salonSlugOrId)}/ticket`;
}
