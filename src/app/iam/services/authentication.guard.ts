import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { map, take } from 'rxjs';

export const authenticationGuard: CanActivateFn = () => {
  const authenticationService = inject(AuthenticationService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  const translate = inject(TranslateService);

  return authenticationService.isSignedIn.pipe(
    take(1),
    map(isSignedIn => {
      if (isSignedIn) {
        return true;
      } else {
        // Mostrar aviso
        snackBar.open(
          translate.instant('AUTH.GUARD_MESSAGE'),
          translate.instant('COMMON.CLOSE'),
          {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
          }
        );

        // Redireccionar manualmente
        router.navigate(['/sign-in']);
        return false;
      }
    })
  );
};
