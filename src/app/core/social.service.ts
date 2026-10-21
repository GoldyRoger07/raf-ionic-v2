import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { api } from './api-url';

/**
 * Lien vers le compte Instagram de Raiki Services, active ou non depuis le
 * back-office. Lu une fois par session : un reglage d'affichage, pas une donnee
 * de jeu. En cas d'erreur, rien ne s'affiche.
 */
@Injectable({ providedIn: 'root' })
export class SocialService {
  private readonly http = inject(HttpClient);
  private loaded = false;

  /** Adresse du profil, ou null si l'administrateur n'affiche pas le lien. */
  readonly instagramUrl = signal<string | null>(null);

  load(): void {
    if (this.loaded) {
      return;
    }
    this.loaded = true;
    this.http.get<{ instagramUrl?: string | null }>(api('/public/social')).subscribe({
      next: (links) => this.instagramUrl.set(links.instagramUrl ?? null),
      error: () => (this.loaded = false),
    });
  }
}
