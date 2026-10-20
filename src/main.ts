import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { inject, isDevMode, provideAppInitializer } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withPreloading } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { Capacitor } from '@capacitor/core';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth.interceptor';
import { AuthService } from './app/core/auth.service';
import './app/core/ionicons';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // Meme rendu sur Android, iOS et le web : l'interface est celle du jeu, pas du systeme.
    provideIonicAngular({ mode: 'ios', backButtonText: '', swipeBackEnabled: true }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
    // La session est reprise avant le premier ecran : les gardes savent si le joueur est connecte.
    provideAppInitializer(() => inject(AuthService).restore()),
    // PWA : cache hors ligne et notifications push. Inutile dans les applications natives.
    provideServiceWorker('raf-sw.js', {
      enabled: !isDevMode() && !Capacitor.isNativePlatform(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
});
