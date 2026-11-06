import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonSpinner,
  ToastController,
} from '@ionic/angular';
import {
  eyeOffOutline,
  eyeOutline,
  heartOutline,
  lockClosedOutline,
} from 'ionicons/icons';

import { apiErrorMessage } from '../../core/api/api-error';
import { PasswordRecoveryApiService } from '../../core/api/password-recovery-api.service';

const RESET_TOKEN_ERROR = 'INVALID_OR_EXPIRED_RESET_TOKEN';
const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (
    typeof password === 'string' &&
    typeof confirmPassword === 'string' &&
    confirmPassword.length > 0 &&
    password !== confirmPassword
  ) {
    return { passwordMismatch: true };
  }
  return null;
};

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrl: './password-recovery.page.scss',
  imports: [
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonSpinner,
    ReactiveFormsModule,
    RouterLink,
  ],
})
export class ResetPasswordPage {
  private readonly route = inject(ActivatedRoute);
  private readonly recoveryApi = inject(PasswordRecoveryApiService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly formBuilder = inject(FormBuilder);

  readonly brandIcon = heartOutline;
  readonly passwordIcon = lockClosedOutline;
  readonly showPasswordIcon = eyeOutline;
  readonly hidePasswordIcon = eyeOffOutline;
  readonly token = signal(this.route.snapshot.queryParamMap.get('token') ?? '');
  readonly form = this.formBuilder.nonNullable.group(
    {
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128),
          Validators.pattern(/\d/),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly errorMessage = signal('');
  readonly isSubmitting = signal(false);

  submit(): void {
    if (this.isSubmitting()) return;

    this.errorMessage.set('');
    this.form.markAllAsTouched();

    if (!this.token()) {
      this.errorMessage.set(
        'El enlace no contiene un código válido. Solicita uno nuevo.',
      );
      return;
    }
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.recoveryApi
      .resetPassword(this.token(), this.form.controls.password.value)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          void this.completeReset().catch(() =>
            this.errorMessage.set(
              'La contraseña se actualizó, pero no pudimos mostrar la confirmación. Ya puedes iniciar sesión con tu nueva contraseña.',
            ),
          );
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            isResetTokenError(error)
              ? 'El enlace ya no es válido o venció. Solicita uno nuevo para continuar.'
              : apiErrorMessage(error),
          );
        },
      });
  }

  private async completeReset(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.',
      duration: 4000,
      position: 'bottom',
    });
    await toast.present();
    await this.router.navigateByUrl('/login');
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword.update((visible) => !visible);
      return;
    }
    this.showConfirmPassword.update((visible) => !visible);
  }
}

const isResetTokenError = (error: unknown): boolean => {
  if (!(error instanceof HttpErrorResponse)) return false;
  const body: unknown = error.error;
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return false;
  }
  const apiError = body.error;
  return (
    typeof apiError === 'object' &&
    apiError !== null &&
    'code' in apiError &&
    apiError.code === RESET_TOKEN_ERROR
  );
};
