import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonSpinner,
} from '@ionic/angular';
import { heartOutline, mailOutline } from 'ionicons/icons';

import { apiErrorMessage } from '../../core/api/api-error';
import { PasswordRecoveryApiService } from '../../core/api/password-recovery-api.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
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
export class ForgotPasswordPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly recoveryApi = inject(PasswordRecoveryApiService);

  readonly brandIcon = heartOutline;
  readonly emailIcon = mailOutline;
  readonly form = this.formBuilder.nonNullable.group({
    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(254)],
    ],
  });
  readonly errorMessage = signal('');
  readonly confirmationMessage = signal('');
  readonly isSubmitting = signal(false);

  submit(): void {
    if (this.isSubmitting()) return;

    this.errorMessage.set('');
    this.confirmationMessage.set('');
    const emailControl = this.form.controls.email;
    emailControl.setValue(emailControl.value.trim());
    this.form.markAllAsTouched();

    if (emailControl.invalid) return;

    const email = emailControl.value;
    this.isSubmitting.set(true);
    this.recoveryApi
      .requestRecovery(email)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () =>
          this.confirmationMessage.set(
            'Si el correo está asociado a una cuenta, recibirás instrucciones para recuperar el acceso.',
          ),
        error: (error: unknown) =>
          this.errorMessage.set(apiErrorMessage(error)),
      });
  }
}
