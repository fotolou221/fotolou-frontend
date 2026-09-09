import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HttpErrorMessageService {
  message(error: unknown, fallback = 'Une erreur est survenue. Veuillez reessayer.'): string {
    if (this.isTimeout(error)) {
      return 'La connexion est trop lente. Verifiez votre reseau puis reessayez.';
    }

    if (error instanceof HttpErrorResponse) {
      const backendMessage = this.backendMessage(error);

      if (error.status === 0) {
        return this.isOffline()
          ? 'Vous etes hors connexion. Verifiez votre internet puis reessayez.'
          : "Connexion instable. Fotolou n'arrive pas a joindre le serveur pour le moment.";
      }

      if (error.status === 400) {
        return backendMessage || 'Certaines informations sont incorrectes. Verifiez le formulaire puis reessayez.';
      }

      if (error.status === 401) {
        return backendMessage || 'Votre session a expire. Reconnectez-vous pour continuer.';
      }

      if (error.status === 403) {
        return backendMessage || "Vous n'avez pas l'autorisation de faire cette action.";
      }

      if (error.status === 404) {
        return backendMessage || "Cette information est introuvable ou n'existe plus.";
      }

      if (error.status === 409) {
        return backendMessage || 'Cette action entre en conflit avec des donnees deja existantes.';
      }

      if (error.status === 422) {
        return backendMessage || 'Les donnees envoyees ne sont pas valides.';
      }

      if (error.status === 429) {
        return 'Trop de tentatives. Patientez un instant avant de reessayer.';
      }

      if (error.status >= 500) {
        return 'Le serveur Fotolou rencontre un probleme. Reessayez dans quelques instants.';
      }

      return backendMessage || fallback;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }

  isConnectionIssue(error: unknown): boolean {
    return this.isTimeout(error) || (error instanceof HttpErrorResponse && error.status === 0);
  }

  private backendMessage(error: HttpErrorResponse): string | null {
    const payload = error.error;

    if (!payload) {
      return null;
    }

    if (typeof payload === 'string') {
      return payload.trim() || null;
    }

    if (typeof payload === 'object') {
      const body = payload as Record<string, unknown>;
      const message =
        body['message'] ||
        body['detail'] ||
        body['error'] ||
        body['title'];

      return typeof message === 'string' && message.trim().length > 0 ? message.trim() : null;
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
