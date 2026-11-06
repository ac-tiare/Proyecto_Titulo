import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonToast,
} from '@ionic/angular';
import {
  eyeOffOutline,
  eyeOutline,
  heartOutline,
  lockClosedOutline,
  mailOutline,
} from 'ionicons/icons';

import { apiErrorMessage } from '../../core/api/api-error';
import { AuthSessionService } from '../../core/api/auth-session.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  imports: [IonButton, IonContent, IonIcon, IonInput, IonToast],
})
export class LoginPage {
  private readonly router = inject(Router);
  private readonly session = inject(AuthSessionService);

  readonly brandIcon = heartOutline;
  readonly emailIcon = mailOutline;
  readonly passwordIcon = lockClosedOutline;
  readonly showPasswordIcon = eyeOutline;
  readonly hidePasswordIcon = eyeOffOutline;
  readonly showPassword = signal(false);
  readonly noticeOpen = signal(false);
  readonly noticeMessage = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly errorMessage = signal('');
  readonly isSubmitting = signal(false);

  signIn(): void {
    if (this.isSubmitting()) return;
    this.errorMessage.set('');
    if (!this.email().trim() || !this.password()) {
      this.errorMessage.set('Ingresa tu correo electrónico y contraseña.');
      return;
    }

    this.isSubmitting.set(true);
    this.session
      .login({ email: this.email().trim(), password: this.password() })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/inicio']),
        error: (error: unknown) =>
          this.errorMessage.set(apiErrorMessage(error)),
      });
  }

  goToRegistration(): Promise<boolean> {
    return this.router.navigate(['/crear-cuenta']);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  showRecoveryNotice(): void {
    this.noticeMessage.set(
      'La recuperación de contraseña aún no está disponible.',
    );
    this.noticeOpen.set(true);
  }
}
