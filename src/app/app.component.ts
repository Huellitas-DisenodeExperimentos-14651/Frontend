import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver } from '@angular/cdk/layout';
import { TranslateService } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from './public/components/language-switcher/language-switcher.component';
import { AuthenticationSectionComponent } from './iam/components/authentication-section/authentication-section.component';
import { AuthenticationService } from './iam/services/authentication.service';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    LanguageSwitcherComponent,
    CommonModule,
    AuthenticationSectionComponent,
    TranslateModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'HuellitasConectadas';
  isSignedIn: boolean = false;

  @ViewChild(MatSidenav, { static: true }) sidenav!: MatSidenav;

  secondaryOptions: any[] = []; // ← se define vacío, lo llenaremos dinámicamente

  constructor(
    private translate: TranslateService,
    private observer: BreakpointObserver,
    private authenticationService: AuthenticationService
  ) {
    // Inicializa el idioma predeterminado
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit(): void {
    this.authenticationService.isSignedIn.subscribe((isSignedIn) => {
      this.isSignedIn = isSignedIn;
      const currentUser = this.authenticationService.getCurrentUser();
      if (isSignedIn && currentUser) {
        if ((currentUser.role || '').toString().toUpperCase() === 'ADOPTER') {
          this.secondaryOptions = [
            { icon: 'https://cdn-icons-png.flaticon.com/512/5308/5308557.png', path: '/adoptions', titleKey: 'HEADER.adoptions' },
            { icon: 'https://cdn-icons-png.flaticon.com/512/2680/2680900.png', path: '/publications/all', titleKey: 'HEADER.publications' },
            { icon: 'https://cdn-icons-png.flaticon.com/512/11008/11008379.png', path: '/donations', titleKey: 'HEADER.donations' },
            { icon: 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png', path: '/profile', titleKey: 'HEADER.profile' },
            { icon: 'https://cdn-icons-png.flaticon.com/512/3842/3842536.png', path: '/adoption-requests', titleKey: 'HEADER.adoption_requests' }
          ];
        } else if ((currentUser.role || '').toString().toUpperCase() === 'SHELTER') {
          this.secondaryOptions = [
            { icon: 'https://cdn-icons-png.flaticon.com/512/616/616408.png', path: '/pets', titleKey: 'HEADER.pets' },
            { icon: 'https://cdn-icons-png.flaticon.com/512/2680/2680900.png', path: '/publications', titleKey: 'HEADER.publications' },
            { icon: 'https://cdn-icons-png.flaticon.com/512/3842/3842536.png', path: '/adoption-requests', titleKey: 'HEADER.adoption_requests' },
            { icon: 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png', path: '/profile', titleKey: 'HEADER.profile' }
          ];
        } else {
          // Otros roles autenticados
          this.secondaryOptions = [
            { icon: 'https://cdn-icons-png.flaticon.com/512/5308/5308557.png', path: '/adoptions', titleKey: 'HEADER.adoptions' }
          ];
        }
      } else {
        // Usuario no autenticado: menú vacío
        this.secondaryOptions = [];
        // No redirigir automáticamente, solo mostrar menú vacío
      }
    });

    // Responsivo para sidenav
    this.observer.observe(['(max-width: 1280px)']).subscribe((response) => {
      if (response.matches) {
        this.sidenav.mode = 'over';
        this.sidenav.close();
      } else {
        this.sidenav.mode = 'side';
        this.sidenav.open();
      }
    });
  }

}
