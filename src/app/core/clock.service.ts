import { Injectable, NgZone, inject, signal } from '@angular/core';

/**
 * Horloge partagee des comptes a rebours : un seul intervalle pour tout l'ecran,
 * plutot qu'un par carte de quiz.
 */
@Injectable({ providedIn: 'root' })
export class ClockService {
  readonly now = signal(Date.now());

  constructor() {
    const zone = inject(NgZone);
    zone.runOutsideAngular(() => {
      setInterval(() => zone.run(() => this.now.set(Date.now())), 1000);
    });
  }
}
