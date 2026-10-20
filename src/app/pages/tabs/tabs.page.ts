import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';

import { FeedbackService } from '../../core/feedback.service';
import { PlayerStateService } from '../../core/player-state.service';
import { IconComponent } from '../../ui/icon.component';

/**
 * Barre d'onglets du bas, facon jeu mobile : l'onglet actif se souleve et s'illumine.
 * Les deux modes de jeu (En groupe, Solo) sont au centre, toujours sureleves.
 */
@Component({
  selector: 'raf-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IconComponent],
  template: `
    <ion-tabs (ionTabsDidChange)="feedback.tap()">
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="portefeuille">
          <span class="tile"><raf-icon name="chest" [size]="32" /></span>
          <span class="label">Trésor</span>
        </ion-tab-button>
        <ion-tab-button tab="tickets">
          <span class="tile"><raf-icon name="ticket" [size]="32" /></span>
          <span class="label">Tickets</span>
        </ion-tab-button>
        <ion-tab-button tab="accueil" class="raised">
          <span class="tile"><raf-icon name="users" [size]="40" /></span>
          <span class="label">En groupe</span>
        </ion-tab-button>
        <ion-tab-button tab="solo" class="raised">
          <span class="tile"><raf-icon name="flame" [size]="40" /></span>
          <span class="label">Solo</span>
        </ion-tab-button>
        <ion-tab-button tab="alertes">
          <span class="tile">
            <raf-icon name="bell" [size]="32" />
            @if (state.unread() > 0) {
              <span class="badge-count">{{ state.unread() > 99 ? '99+' : state.unread() }}</span>
            }
          </span>
          <span class="label">Alertes</span>
        </ion-tab-button>
        <ion-tab-button tab="profil">
          <span class="tile"><raf-icon name="user" [size]="32" /></span>
          <span class="label">Profil</span>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: `
    ion-tab-bar {
      --background: transparent;
      --border: 0;
      height: calc(78px + var(--raf-safe-bottom));
      padding: 0 4px var(--raf-safe-bottom);
      background: linear-gradient(180deg, #ffffff 0%, var(--raf-p50) 60%, var(--raf-p100) 100%);
      border-top: 3px solid var(--raf-p200);
      box-shadow: 0 -4px 0 rgba(255, 192, 120, 0.35), 0 -10px 24px rgba(184, 106, 0, 0.14);
      overflow: visible;
      contain: none;
    }

    ion-tab-button {
      --color: var(--raf-ink-soft);
      --color-selected: var(--raf-ink);
      --background: transparent;
      --ripple-color: transparent;
      overflow: visible;
      max-width: 90px;
    }

    .tile {
      position: relative;
      display: grid;
      place-items: center;
      width: 50px;
      height: 46px;
      border-radius: 16px;
      transition: transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.4), background 0.18s ease;
    }

    .label {
      margin-top: 2px;
      font-family: var(--raf-font-display);
      font-size: 12.5px;
      letter-spacing: 0.03em;
      color: var(--raf-ink-soft);
      white-space: nowrap;
      transition: color 0.18s ease;
    }

    .tab-selected .tile {
      transform: translateY(-10px) scale(1.12);
      background: linear-gradient(180deg, #ffc078 0%, #ff9a1a 100%);
      border: 3px solid #ffffff;
      box-shadow: 0 4px 0 var(--raf-edge-dark), 0 8px 16px rgba(184, 106, 0, 0.3), 0 0 22px rgba(255, 154, 26, 0.45);
    }

    .tab-selected .label {
      color: var(--raf-edge-dark);
      transform: translateY(-6px);
      display: inline-block;
    }

    // Les deux modes de jeu : toujours sureleves, plus grands.
    .raised .tile {
      width: 62px;
      height: 58px;
      margin-top: -22px;
      border-radius: 20px;
      background: linear-gradient(180deg, #ffffff 0%, var(--raf-p200) 100%);
      border: 3px solid var(--raf-p300);
      box-shadow: 0 5px 0 var(--raf-p400), 0 10px 18px rgba(184, 106, 0, 0.25);
    }

    .raised.tab-selected .tile {
      transform: translateY(-4px) scale(1.06);
      background: linear-gradient(180deg, #ffc078 0%, #ff9a1a 100%);
      border-color: #ffffff;
      box-shadow: 0 5px 0 var(--raf-edge-dark), 0 10px 18px rgba(184, 106, 0, 0.3), 0 0 26px rgba(255, 154, 26, 0.5);
    }

    // Un onglet sureleve ne se souleve pas davantage : son libelle reste sous la tuile.
    .raised.tab-selected .label {
      transform: none;
    }

    .badge-count {
      top: -6px;
      right: -4px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsPage {
  protected readonly state = inject(PlayerStateService);
  protected readonly feedback = inject(FeedbackService);
}
