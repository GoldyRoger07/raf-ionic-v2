import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { api } from './api-url';
import { RegisterRequest, TokenResponse, User } from './models';
import { storage } from './storage';

const REFRESH_KEY = 'raf-refresh-token';
const USER_KEY = 'raf-user';

/*
 * Session du joueur.
 *
 * Le jeton d'acces reste en memoire ; le jeton de rafraichissement est persiste.
 * Le backend fait tourner ce dernier a chaque usage et detecte sa reutilisation
 * (toute la famille de jetons est alors revoquee) : un seul rafraichissement doit
 * donc etre en vol a la fois, partage par toutes les requetes qui recoivent un 401.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  // HttpBackend : ces appels ne passent pas par l'intercepteur (pas de boucle 401 -> refresh).
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly router = inject(Router);

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshing: Promise<string | null> | null = null;

  readonly user = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.user() !== null);

  /** Au demarrage : reprend la session enregistree, si elle est encore valable. */
  async restore(): Promise<void> {
    this.refreshToken = await storage.get(REFRESH_KEY);
    if (!this.refreshToken) {
      return;
    }
    // Affichage immediat avec le dernier profil connu, meme hors ligne.
    this.user.set(await storage.getJson<User>(USER_KEY));
    await this.refresh();
  }

  async login(email: string, password: string): Promise<User> {
    const tokens = await firstValueFrom(
      this.http.post<TokenResponse>(api('/auth/login'), { email: email.trim(), password }),
    );
    await this.accept(tokens);
    return tokens.user;
  }

  async register(request: RegisterRequest): Promise<User> {
    await firstValueFrom(this.http.post<User>(api('/auth/register'), request));
    return this.login(request.email, request.password);
  }

  async logout(): Promise<void> {
    const token = this.refreshToken;
    await this.clear();
    if (token) {
      // Revocation cote serveur, sans bloquer la deconnexion locale.
      this.http.post(api('/auth/logout'), { refreshToken: token }).subscribe({ error: () => undefined });
    }
    await this.router.navigateByUrl('/bienvenue', { replaceUrl: true });
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  /** Met a jour le profil affiche (apres verification du telephone, par exemple). */
  async setUser(user: User): Promise<void> {
    this.user.set(user);
    await storage.setJson(USER_KEY, user);
  }

  /**
   * Nouveau jeton d'acces, ou null si la session est perdue (le joueur est alors
   * renvoye vers l'accueil). Les appels simultanes partagent la meme requete.
   */
  refresh(): Promise<string | null> {
    if (!this.refreshing) {
      this.refreshing = this.doRefresh().finally(() => (this.refreshing = null));
    }
    return this.refreshing;
  }

  /** Session expiree cote serveur : retour a l'accueil. */
  async sessionLost(): Promise<void> {
    await this.clear();
    await this.router.navigateByUrl('/bienvenue', { replaceUrl: true });
  }

  private async doRefresh(): Promise<string | null> {
    if (!this.refreshToken) {
      return null;
    }
    try {
      const tokens = await firstValueFrom(
        this.http.post<TokenResponse>(api('/auth/refresh'), { refreshToken: this.refreshToken }),
      );
      await this.accept(tokens);
      return tokens.accessToken;
    } catch (error: unknown) {
      const status = (error as { status?: number }).status ?? 0;
      if (status === 0 || status >= 500) {
        // Reseau ou serveur indisponible : on garde la session pour plus tard.
        return null;
      }
      await this.sessionLost();
      return null;
    }
  }

  private async accept(tokens: TokenResponse): Promise<void> {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.user.set(tokens.user);
    await storage.set(REFRESH_KEY, tokens.refreshToken);
    await storage.setJson(USER_KEY, tokens.user);
  }

  private async clear(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.user.set(null);
    await storage.remove(REFRESH_KEY);
    await storage.remove(USER_KEY);
  }
}
