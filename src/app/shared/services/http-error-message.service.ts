import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

const ERROR_KEY_MAP: Record<string, string> = {
  'error.http.400': 'Les informations fournies sont invalides. Veuillez vérifier votre saisie.',
  'error.http.401': 'Votre session a expiré. Veuillez vous reconnecter.',
  'error.http.403': "Vous n'avez pas l'autorisation d'effectuer cette action.",
  'error.http.404': 'La ressource demandée est introuvable.',
  'error.http.409': 'Cette action entre en conflit avec des données déjà existantes.',
  'error.http.500': 'Une erreur interne est survenue sur le serveur. Veuillez réessayer plus tard.',
  'error.validation': 'Certains champs du formulaire sont invalides ou incomplets.',
  'error.phonealreadyused': 'Ce numéro de téléphone est déjà associé à un compte ou à un élément existant.',
  'error.userexists': 'Cet utilisateur existe déjà.',
  'error.emailexists': 'Cette adresse email est déjà utilisée.',
  'error.idexists': 'Cet élément a déjà été enregistré.',
  'error.idnull': 'Identifiant manquant.',
  'error.idinvalid': 'Identifiant invalide.',
  'error.idnotfound': 'Élément introuvable.',
  'error.concurrencyFailure': 'Une modification concurrente a eu lieu. Veuillez rafraîchir.',
  'error.unauthorized': 'Vous devez être connecté pour effectuer cette opération.',
  'error.notowned': "Cet élément n'existe pas ou ne vous appartient pas."
};

@Injectable({ providedIn: 'root' })
export class HttpErrorMessageService {
  message(error: unknown, fallback = 'Une erreur est survenue. Veuillez réessayer.'): string {
    if (this.isTimeout(error)) {
      return 'La connexion est trop lente. Vérifiez votre réseau puis réessayez.';
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return this.isOffline()
          ? 'Vous êtes hors connexion. Vérifiez votre internet puis réessayez.'
          : "Connexion instable. Fotolou n'arrive pas à joindre le serveur pour le moment.";
      }

      const backendMessage = this.backendMessage(error);
      if (backendMessage) {
        return backendMessage;
      }

      if (error.status === 400) {
        return 'Certaines informations sont incorrectes. Vérifiez le formulaire puis réessayez.';
      }

      if (error.status === 401) {
        return 'Votre session a expiré. Reconnectez-vous pour continuer.';
      }

      if (error.status === 403) {
        return "Vous n'avez pas l'autorisation d'effectuer cette action.";
      }

      if (error.status === 404) {
        return "Cette information est introuvable ou n'existe plus.";
      }

      if (error.status === 409) {
        return 'Cette action entre en conflit avec des données déjà existantes.';
      }

      if (error.status === 422) {
        return 'Les données envoyées ne sont pas valides.';
      }

      if (error.status === 429) {
        return 'Trop de tentatives. Patientez un instant avant de réessayer.';
      }

      if (error.status >= 500) {
        return 'Le serveur Fotolou rencontre un problème. Réessayez dans quelques instants.';
      }

      return fallback;
    }

    if (error instanceof Error && error.message) {
      const msg = error.message.trim();
      if (ERROR_KEY_MAP[msg]) return ERROR_KEY_MAP[msg];
      if (!msg.startsWith('error.http.')) return msg;
    }

    return fallback;
  }

  isConnectionIssue(error: unknown): boolean {
    return this.isTimeout(error) || (error instanceof HttpErrorResponse && error.status === 0);
  }

  private backendMessage(error: HttpErrorResponse): string | null {
    // 1. Check custom JHipster headers
    const headerAlert =
      error.headers?.get('X-fotolouBackend-alert') ||
      error.headers?.get('app-alert');
    if (headerAlert && !headerAlert.startsWith('error.')) {
      return headerAlert;
    }

    const payload = error.error;
    if (!payload) {
      return null;
    }

    if (typeof payload === 'string') {
      const trimmed = payload.trim();
      if (!trimmed) return null;
      if (ERROR_KEY_MAP[trimmed]) return ERROR_KEY_MAP[trimmed];
      if (trimmed.startsWith('error.http.') || trimmed === 'error.validation') return null;
      return trimmed;
    }

    if (typeof payload === 'object') {
      const body = payload as Record<string, any>;

      // 2. Check Bean Validation field errors
      if (Array.isArray(body['fieldErrors']) && body['fieldErrors'].length > 0) {
        const fieldMsgs = body['fieldErrors']
          .map((f: any) => f.message || f.defaultMessage)
          .filter((m: any) => typeof m === 'string' && m.trim().length > 0);
        if (fieldMsgs.length > 0) {
          return fieldMsgs.join('. ');
        }
      }

      // 3. Check ProblemDetail "detail" (contains the actual business exception message)
      const detail = typeof body['detail'] === 'string' ? body['detail'].trim() : null;
      if (detail && !detail.startsWith('error.http.') && !detail.startsWith('error.')) {
        return detail;
      }

      // 4. Check "error" field (e.g. Map.of("error", e.getMessage()))
      const errorField = typeof body['error'] === 'string' ? body['error'].trim() : null;
      if (errorField && !errorField.startsWith('error.http.') && !errorField.startsWith('error.')) {
        return errorField;
      }

      // 5. Check "message" field
      const rawMessage = typeof body['message'] === 'string' ? body['message'].trim() : null;
      if (rawMessage) {
        if (ERROR_KEY_MAP[rawMessage]) {
          return ERROR_KEY_MAP[rawMessage];
        }
        if (!rawMessage.startsWith('error.http.') && !rawMessage.startsWith('error.')) {
          return rawMessage;
        }
      }

      // 6. Check "errorKey"
      const errorKey = typeof body['errorKey'] === 'string' ? body['errorKey'].trim() : null;
      if (errorKey) {
        if (ERROR_KEY_MAP[errorKey]) return ERROR_KEY_MAP[errorKey];
        if (ERROR_KEY_MAP[`error.${errorKey}`]) return ERROR_KEY_MAP[`error.${errorKey}`];
      }

      // 7. Check "title" if it is specific
      const title = typeof body['title'] === 'string' ? body['title'].trim() : null;
      if (title && title !== 'Bad Request' && title !== 'Internal Server Error' && !title.startsWith('error.')) {
        return title;
      }

      // 8. If detail was an error key
      if (detail && ERROR_KEY_MAP[detail]) {
        return ERROR_KEY_MAP[detail];
      }
    }

    return null;
  }

  private isTimeout(error: unknown): boolean {
    return error instanceof Error && error.name === 'TimeoutError';
  }

  private isOffline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
  }
}
