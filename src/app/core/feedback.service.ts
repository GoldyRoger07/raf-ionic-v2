import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { ToastController } from '@ionic/angular/standalone';

import { errorMessage } from './errors';

/** Retours au joueur : toasts aux couleurs du jeu et vibrations (sur telephone). */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly toasts = inject(ToastController);
  private readonly native = Capacitor.isNativePlatform();

  async toast(message: string, kind: 'info' | 'success' | 'error' = 'info'): Promise<void> {
    const toast = await this.toasts.create({
      message,
      duration: kind === 'error' ? 4000 : 2600,
      position: 'top',
      cssClass: ['raf-toast', kind],
      swipeGesture: 'vertical',
    });
    await toast.present();
  }

  async error(error: unknown, fallback?: string): Promise<void> {
    void this.buzz('error');
    await this.toast(errorMessage(error, fallback), 'error');
  }

  async success(message: string): Promise<void> {
    void this.buzz('success');
    await this.toast(message, 'success');
  }

  /** Vibration courte au toucher d'un bouton important. */
  tap(): void {
    if (this.native) {
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
    }
  }

  async buzz(kind: 'success' | 'error' | 'warning'): Promise<void> {
    if (!this.native) {
      return;
    }
    const type =
      kind === 'success' ? NotificationType.Success : kind === 'error' ? NotificationType.Error : NotificationType.Warning;
    await Haptics.notification({ type }).catch(() => undefined);
  }
}
