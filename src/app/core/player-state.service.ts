import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiService } from './api.service';
import { Wallet } from './models';

/*
 * Etat partage par tous les ecrans : soldes du portefeuille (pastilles du haut)
 * et nombre de notifications non lues (badge de l'onglet). Chaque ecran qui fait
 * bouger l'argent appelle refreshWallet() ; le compteur se rafraichit au retour
 * au premier plan et toutes les minutes.
 */
@Injectable({ providedIn: 'root' })
export class PlayerStateService {
  private readonly apiService = inject(ApiService);
  private timer: ReturnType<typeof setInterval> | null = null;

  readonly wallet = signal<Wallet | null>(null);
  /**
   * Valeur d'un credit en HTG, telle que le serveur l'applique (parametre credit.htg_rate).
   * Seule source de ce taux dans l'application : il n'est affiche que dans le Tresor.
   */
  readonly creditHtgRate = computed(() => this.wallet()?.htgRate ?? null);
  readonly unread = signal(0);

  async refreshWallet(): Promise<Wallet | null> {
    try {
      const wallet = await firstValueFrom(this.apiService.wallet());
      this.wallet.set(wallet);
      return wallet;
    } catch {
      return this.wallet();
    }
  }

  async refreshUnread(): Promise<void> {
    try {
      this.unread.set((await firstValueFrom(this.apiService.unreadCount())).unread);
    } catch {
      // Le badge attendra le prochain passage.
    }
  }

  refreshAll(): void {
    void this.refreshWallet();
    void this.refreshUnread();
  }

  start(): void {
    this.refreshAll();
    if (!this.timer) {
      this.timer = setInterval(() => void this.refreshUnread(), 60_000);
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.wallet.set(null);
    this.unread.set(0);
  }
}
