import { Routes } from '@angular/router';
import { PageNotFoundComponent } from "./public/pages/page-not-found/page-not-found.component";

import { PetsGalleryComponent } from './pets/pages/adopter/pets-gallery/pets-gallery.component';
import { AdoptionsListComponent } from './adoptions/pages/adoptions-list/adoptions-list.component';
import { DonationOptionsComponent } from './donations/pages/donation-options/donation-options.component';
import { PublicationsDashboardComponent } from './publications/pages/publications-dashboard/publications-dashboard.component';

import { SignInComponent } from './iam/pages/sign-in/sign-in.component';
import { SignUpComponent } from './iam/pages/sign-up/sign-up.component';
import { authenticationGuard } from './iam/services/authentication.guard';

export const routes: Routes = [
  { path: '', component: PetsGalleryComponent, canActivate: [authenticationGuard] },

  {
    path: 'profile',
    loadComponent: () => import('./profile/pages/profile/profile.component')
      .then(m => m.ProfileComponent),
    canActivate: [authenticationGuard]
  },

  { path: 'adoptions', component: AdoptionsListComponent },
  {
    path: 'adoptions/:id',
    loadComponent: () => import('./adoptions/pages/adoption-details/adoption-details.component')
      .then(m => m.AdoptionDetailsComponent)
  },

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
  {
    path: 'publications',
    loadComponent: () =>
      import('./publications/pages/publications-dashboard/publications-dashboard.component')
        .then(m => m.PublicationsDashboardComponent),
    canActivate: [authenticationGuard]
  },
  {
    path: 'adoption-requests',
    loadComponent: () =>
      import('./adoption-requests/pages/adoption-requests/adoption-requests.page')
        .then(m => m.AdoptionRequestsPage),
    canActivate: [authenticationGuard]
  },

  { path: 'sign-in', component: SignInComponent },
  { path: 'sign-up', component: SignUpComponent },

  { path: '**', component: PageNotFoundComponent }
];
