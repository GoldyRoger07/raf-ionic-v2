import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { Capacitor } from '@capacitor/core';
import { firstValueFrom } from 'rxjs';

import { ApiService } from './api.service';

export type PushState = 'enabled' | 'disabled' | 'denied' | 'unsupported' | 'native' | 'not-configured';

/*
 * Notifications push du navigateur (PWA installee ou site), signees VAPID par le
 * backend et affichees par src/raf-sw.js.
 *
 * Les applications Android et iOS n'ont pas acces au Web Push : il leur faudra
 * FCM / APNs (@capacitor/push-notifications), que le backend ne gere pas encore.
 */
@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly swPush = inject(SwPush);
  private readonly apiService = inject(ApiService);

  async state(): Promise<PushState> {
    if (Capacitor.isNativePlatform()) {
      return 'native';
    }
    if (!this.swPush.isEnabled || !('Notification' in window)) {
      return 'unsupported';
    }
    if (Notification.permission === 'denied') {
      return 'denied';
    }
    const subscription = await firstValueFrom(this.swPush.subscription);
    return subscription ? 'enabled' : 'disabled';
  }

  /** Demande l'autorisation, abonne le navigateur et enregistre l'abonnement cote serveur. */
  async enable(): Promise<PushState> {
    const key = await firstValueFrom(this.apiService.pushPublicKey());
    if (!key.configured || !key.publicKey) {
      return 'not-configured';
    }
    const subscription = await this.swPush.requestSubscription({ serverPublicKey: key.publicKey });
    await firstValueFrom(this.apiService.subscribePush(subscription.toJSON()));
    return 'enabled';
  }

  async disable(): Promise<PushState> {
    const subscription = await firstValueFrom(this.swPush.subscription);
    if (subscription) {
      await firstValueFrom(this.apiService.unsubscribePush(subscription.endpoint)).catch(() => undefined);
      await this.swPush.unsubscribe().catch(() => undefined);
    }
    return 'disabled';
  }
}
