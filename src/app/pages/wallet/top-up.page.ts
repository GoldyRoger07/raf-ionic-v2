import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { IonContent, IonHeader, IonToolbar } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { TopUp } from '../../core/models';
import { IconComponent } from '../../ui/icon.component';
import { DateTimePipe, NumPipe } from '../../ui/pipes';
import { TopBarComponent } from '../../ui/top-bar.component';

/*
 * Recharge. Les connecteurs MonCash et NatCash attendent leurs acces sandbox :
 * en attendant, un agent RAF credite le compte depuis le back-office (recharge
 * manuelle). La page dit comment faire et montre l'historique.
 */
@Component({
  selector: 'raf-top-up',
  imports: [IonHeader, IonToolbar, IonContent, TopBarComponent, IconComponent, NumPipe, DateTimePipe],
  template: `
    <ion-header class="raf-header">
      <ion-toolbar><raf-top-bar back="/portefeuille" title="Recharger" /></ion-toolbar>
    </ion-header>

    <ion-content class="raf-sky" [fullscreen]="true">
      <div class="page-pad">
        <section class="option soon">
          <div class="brand moncash">MonCash</div>
          <div class="grow">
            <div class="opt-title">Recharge MonCash</div>
            <div class="opt-sub">Paiement depuis ton téléphone</div>
          </div>
          <span class="soon-tag">Bientôt</span>
        </section>
        <section class="option soon">
          <div class="brand natcash">NatCash</div>
          <div class="grow">
            <div class="opt-title">Recharge NatCash</div>
            <div class="opt-sub">Paiement depuis ton téléphone</div>
          </div>
          <span class="soon-tag">Bientôt</span>
        </section>

        <section class="panel panel-with-ribbon">
          <div class="ribbon blue">Au guichet RAF</div>
          <p class="lead">Un agent RAF crédite ton compte sur place, en espèces.</p>
          <ol class="steps">
            <li>Rends-toi chez un agent RAF.</li>
            <li>Donne-lui ton numéro de téléphone ou ton identifiant joueur.</li>
            <li>Paie en HTG : tes crédits arrivent aussitôt, avec une notification.</li>
          </ol>
          @if (auth.user(); as u) {
            <div class="id-card">
              <div><span>Identifiant joueur</span><strong>#{{ u.id }}</strong></div>
              <div><span>Téléphone</span><strong>{{ u.phone }}</strong></div>
            </div>
          }
        </section>

        @if (topUps().length > 0) {
          <h2 class="section-title">Mes recharges</h2>
          <div class="panel tight">
            @for (t of topUps(); track t.id) {
              <div class="row">
                <raf-icon name="coin" [size]="30" />
                <div class="grow">
                  <div class="opt-title">+{{ t.credits | num }} crédits</div>
                  <div class="opt-sub">{{ t.amountHtg | num }} HTG · {{ provider(t) }} · {{ t.createdAt | dateTime }}</div>
                </div>
                <span class="state" [class.ok]="t.status === 'CONFIRMED'">{{ status(t) }}</span>
              </div>
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: `
    .option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      margin-bottom: 12px;
      border-radius: 20px;
      background: #fff;
      border: 3px solid var(--raf-p100);
      box-shadow: 0 4px 0 var(--raf-p200);
      color: var(--raf-ink);
      &.soon { opacity: 0.8; }
    }
    .brand {
      width: 64px;
      height: 46px;
      flex: none;
      display: grid;
      place-items: center;
      border-radius: 12px;
      color: #fff;
      font-weight: 900;
      font-size: 12px;
      &.moncash { background: linear-gradient(180deg, #ff6a5c, #d4202c); }
      &.natcash { background: linear-gradient(180deg, #ffb340, #f06a00); }
    }
    .grow { flex: 1; min-width: 0; }
    .opt-title { font-weight: 900; font-size: 15.5px; }
    .opt-sub { font-weight: 700; font-size: 12.5px; color: var(--raf-ink-soft); }
    .soon-tag {
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--raf-p100);
      color: var(--raf-ink-soft);
      font-weight: 900;
      font-size: 12px;
      text-transform: uppercase;
    }
    .lead { font-weight: 800; margin: 0 0 10px; }
    .steps {
      margin: 0 0 14px;
      padding-left: 20px;
      font-weight: 700;
      line-height: 1.6;
    }
    .id-card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      div {
        display: flex;
        flex-direction: column;
        padding: 10px 12px;
        border-radius: 14px;
        background: #fff;
        border: 2px dashed var(--raf-frame);
      }
      span { font-size: 12px; font-weight: 800; color: var(--raf-ink-soft); }
      strong { font-family: var(--raf-font-display); font-weight: 400; font-size: 20px; }
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 4px;
      & + & { border-top: 2px dashed var(--raf-p100); }
    }
    .state {
      font-weight: 900;
      font-size: 12px;
      color: var(--raf-ink-soft);
      &.ok { color: #1d630b; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopUpPage {
  protected readonly auth = inject(AuthService);
  private readonly apiService = inject(ApiService);

  protected readonly topUps = signal<TopUp[]>([]);

  ionViewWillEnter(): void {
    firstValueFrom(this.apiService.topUps(0, 20))
      .then((page) => this.topUps.set(page.content))
      .catch(() => undefined);
  }

  protected provider(t: TopUp): string {
    return t.provider === 'MANUAL' ? 'Guichet' : t.provider === 'MONCASH' ? 'MonCash' : 'NatCash';
  }

  protected status(t: TopUp): string {
    return t.status === 'CONFIRMED' ? 'Reçue' : t.status === 'PENDING' ? 'En attente' : 'Échouée';
  }
}
