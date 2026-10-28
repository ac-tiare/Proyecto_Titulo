import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
    this.submitted = true;
    const errors = this.validate(this.values());
    this.errors.set(errors);
    if (Object.keys(errors).length) {
      this.confirmation.set('');
      return;
    }

    this.confirmation.set(
      'La creación de cuentas está temporalmente inactiva; no se creó ni guardó ninguna cuenta.',
    );
  }

  async goToLogin(): Promise<boolean> {
    return this.router.navigate(['/login']);
  }

  private validate(values: RegistrationValues): RegistrationErrors {
    const errors: RegistrationErrors = {};
    const email = values.email.trim();

    if (!values.name.trim()) {
      errors.name = 'Ingresa tu nombre.';
    }
    if (!email) {
      errors.email = 'Ingresa tu correo electrónico.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Ingresa un correo electrónico válido.';
    }
    if (!values.password) {
      errors.password = 'Ingresa una contraseña.';
    } else if (values.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (!values.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña.';
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    return errors;
  }
}
