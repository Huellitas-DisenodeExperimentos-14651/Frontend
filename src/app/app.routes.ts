import { Routes } from '@angular/router';
import { PageNotFoundComponent } from "./public/pages/page-not-found/page-not-found.component";

import { PetsGalleryComponent } from './pets/pages/adopter/pets-gallery/pets-gallery.component';
import { AdoptionsListComponent } from './adoptions/pages/adoptions-list/adoptions-list.component';
import { DonationOptionsComponent } from './donations/pages/donation-options/donation-options.component';
import { PublicationsDashboardComponent } from './publications/pages/publications-dashboard/publications-dashboard.component';
import { AdoptionManagementComponent } from './manage-adoptions/pages/adoption-management/adoption-management.component';

import { SignInComponent } from './iam/pages/sign-in/sign-in.component'; // Ruta de inicio de sesión
import { SignUpComponent } from './iam/pages/sign-up/sign-up.component'; // Ruta de registro
import { authenticationGuard } from './iam/services/authentication.guard'; // Guard para proteger rutas

export const routes: Routes = [
  { path: '', component: PetsGalleryComponent, canActivate: [authenticationGuard] }, // 👈 Mantén protegida si solo quieres que usuarios logueados vean mascotas

  {
    path: 'profile',
    loadComponent: () => import('./profile/pages/profile/profile.component')
      .then(m => m.ProfileComponent),
    canActivate: [authenticationGuard]
  },

// 🔓 Rutas públicas para adopciones
  { path: 'adoptions', component: AdoptionsListComponent }, // ❌ Quita el guard
  {
    path: 'adoptions/:id',
    loadComponent: () => import('./adoptions/pages/adoption-details/adoption-details.component')
      .then(m => m.AdoptionDetailsComponent) // ❌ Quita el guard aquí también
  },

// 🔐 Mantén protegidas las que requieren autenticación
  { path: 'pets', component: PetsGalleryComponent, canActivate: [authenticationGuard] },
  {
    path: 'pets/create',
    loadComponent: () =>
      import('./pets/pages/shelter/pet-create/pet-create.component').then(m => m.PetCreateComponent),
    canActivate: [authenticationGuard]
  },
  {
    path: 'pets/edit/:id',
    loadComponent: () => import('./pets/pages/shelter/pet-edit/pet-edit.component').then(m => m.PetEditComponent),
    canActivate: [authenticationGuard]
  },
  { path: 'donations', component: DonationOptionsComponent, canActivate: [authenticationGuard] },
  { path: 'publications', component: PublicationsDashboardComponent, canActivate: [authenticationGuard] },
  {
    path: 'manage-adoptions',
    loadComponent: () => import('./manage-adoptions/pages/adoption-management/adoption-management.component')
      .then(m => m.AdoptionManagementComponent),
    canActivate: [authenticationGuard]
  },

  // 🟢 Rutas públicas sin protección
  { path: 'sign-in', component: SignInComponent },
  { path: 'sign-up', component: SignUpComponent },

  // 🔴 Ruta para 404
  { path: '**', component: PageNotFoundComponent }
];
