import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
} from '@ionic/angular';
import {
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
  personOutline,
} from 'ionicons/icons';

import { apiErrorMessage } from '../../core/api/api-error';
import { AuthSessionService } from '../../core/api/auth-session.service';

interface RegistrationValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type RegistrationField = keyof RegistrationValues;
type RegistrationErrors = Partial<Record<RegistrationField, string>>;

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
  imports: [IonButton, IonContent, IonIcon, IonInput],
})
export class RegisterPage {
  private readonly router = inject(Router);
  private readonly session = inject(AuthSessionService);

  readonly values = signal<RegistrationValues>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  readonly errors = signal<RegistrationErrors>({});
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly confirmation = signal('');
  readonly errorMessage = signal('');
  readonly isSubmitting = signal(false);
  private submitted = false;

  readonly nameIcon = personOutline;
  readonly emailIcon = mailOutline;
  readonly passwordIcon = lockClosedOutline;
  readonly showPasswordIcon = eyeOutline;
  readonly hidePasswordIcon = eyeOffOutline;

  updateField(field: RegistrationField, value: string): void {
    this.values.update((current) => ({ ...current, [field]: value }));
    if (this.submitted) {
      this.errors.set(this.validate(this.values()));
    }
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword.update((visible) => !visible);
    } else {
      this.showConfirmPassword.update((visible) => !visible);
    }
  }

  submit(): void {
    if (this.isSubmitting()) return;
    this.submitted = true;
    const errors = this.validate(this.values());
    this.errors.set(errors);
    if (Object.keys(errors).length) {
      this.confirmation.set('');
      this.errorMessage.set('');
      return;
    }

    const values = this.values();
    this.confirmation.set('');
    this.errorMessage.set('');
    this.isSubmitting.set(true);
    this.session
      .register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.confirmation.set('Tu cuenta fue creada correctamente.');
          void this.router.navigate(['/inicio']);
        },
        error: (error: unknown) =>
          this.errorMessage.set(apiErrorMessage(error)),
      });
  }

  async goToLogin(): Promise<boolean> {
    return this.router.navigate(['/login']);
  }

  private validate(values: RegistrationValues): RegistrationErrors {
    const errors: RegistrationErrors = {};
    const email = values.email.trim();

    const name = values.name.trim();
    if (!name) {
      errors.name = 'Ingresa tu nombre.';
    } else if (name.length > 100) {
      errors.name = 'El nombre no puede superar 100 caracteres.';
    }
    if (!email) {
      errors.email = 'Ingresa tu correo electrónico.';
    } else if (email.length > 254) {
      errors.email = 'El correo no puede superar 254 caracteres.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Ingresa un correo electrónico válido.';
    }
    if (!values.password) {
      errors.password = 'Ingresa una contraseña.';
    } else if (values.password.length < 12) {
      errors.password = 'La contraseña debe tener al menos 12 caracteres.';
    } else if (values.password.length > 128) {
      errors.password = 'La contraseña no puede superar 128 caracteres.';
    }
    if (!values.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña.';
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    return errors;
  }
}
