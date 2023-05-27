import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CurrentUser } from '@auth/models/current-user.model';
import { RegisterRequest } from '@auth/models/register-request.model';
import { AuthService } from '@auth/services/auth.service';
import { AccessToken } from '@core/constants/access-token';
import { BackendErrors } from '@core/models/backend-errors.model';
import { PersistanceService } from '@core/services/persistance.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthActions } from '@store/auth';
import { catchError, exhaustMap, map, of, tap } from 'rxjs';

export const registerEffect = createEffect(
  (actions$ = inject(Actions), authService = inject(AuthService), persistanceService = inject(PersistanceService)) => {
    return actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ request }) => {
        return authService.register$(<RegisterRequest>request).pipe(
          map((currentUser: CurrentUser) => {
            persistanceService.set(AccessToken, currentUser.token);

            return AuthActions.registerSuccess({ currentUser });
          }),
          catchError((err: HttpErrorResponse) => {
            const errors = err.error.errors as BackendErrors;
            return of(AuthActions.registerFailure({ errors }));
          })
        );
      })
    );
  },
  { functional: true }
);

export const redirectAfterRegisterSuccess = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) => {
    return actions$.pipe(
      ofType(AuthActions.registerSuccess),
      tap((): void => {
        router.navigateByUrl('/');
      })
    );
  },
  { functional: true, dispatch: false }
);
