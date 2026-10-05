import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  imports: [IonButton, IonContent, IonIcon, IonInput, IonToast],
})
export class LoginPage {
  private readonly router = inject(Router);

  readonly brandIcon = heartOutline;
  readonly emailIcon = mailOutline;
  readonly passwordIcon = lockClosedOutline;
  readonly showPasswordIcon = eyeOutline;
  readonly hidePasswordIcon = eyeOffOutline;
  readonly showPassword = signal(false);
  readonly noticeOpen = signal(false);
  readonly noticeMessage = signal('');

  continueDemo(): Promise<boolean> {
    return this.router.navigate(['/inicio']);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  showUnavailableNotice(feature: 'recovery' | 'registration'): void {
    this.noticeMessage.set(
      feature === 'recovery'
        ? 'La recuperación de contraseña aún no está disponible.'
        : 'La creación de cuentas aún no está disponible.',
    );
    this.noticeOpen.set(true);
  }
}
