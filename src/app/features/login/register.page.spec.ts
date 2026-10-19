import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';

import { AuthService } from '../../core/firebase/auth.service';
import { RegisterPage } from './register.page';

describe('RegisterPage', () => {
  const createAuthMock = () => ({
    register: vi.fn().mockResolvedValue({ uid: 'user-1' }),
  });

  it('shows the four labeled fields and independent password visibility controls', async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: createAuthMock() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll('ion-input');
    expect(Array.from(inputs, (input: HTMLIonInputElement) => input.label)).toEqual([
      'Nombre',
      'Correo electrónico',
      'Contraseña',
      'Confirmar contraseña',
    ]);
    expect(fixture.nativeElement.textContent).not.toContain('Modo demostración');

    const toggles = fixture.nativeElement.querySelectorAll('.visibility-button');
    expect(toggles).toHaveLength(2);
    expect(inputs[2].type).toBe('password');
    expect(inputs[3].type).toBe('password');

    toggles[0].click();
    fixture.detectChanges();

    expect(inputs[2].type).toBe('text');
    expect(inputs[3].type).toBe('password');
    expect(toggles[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('shows required, email, minimum password, and confirmation errors', async () => {
    const auth = createAuthMock();
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();

    await fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ingresa tu nombre.');
    expect(fixture.nativeElement.textContent).toContain(
      'Ingresa tu correo electrónico.',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Ingresa una contraseña.',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Confirma tu contraseña.',
    );

    fixture.componentInstance.updateField('name', 'Alex');
    fixture.componentInstance.updateField('email', 'correo-invalido');
    fixture.componentInstance.updateField('password', 'short');
    fixture.componentInstance.updateField('confirmPassword', 'otra');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Ingresa un correo electrónico válido.',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'La contraseña debe tener al menos 8 caracteres.',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Las contraseñas no coinciden.',
    );
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('creates the Firebase account and navigates to Inicio', async () => {
    const auth = createAuthMock();
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.componentInstance.updateField('name', ' Alex ');
    fixture.componentInstance.updateField('email', 'alex@example.cl');
    fixture.componentInstance.updateField('password', 'secure-password');
    fixture.componentInstance.updateField('confirmPassword', 'secure-password');

    await fixture.componentInstance.submit();

    expect(auth.register).toHaveBeenCalledWith(
      ' Alex ',
      'alex@example.cl',
      'secure-password',
    );
    expect(fixture.componentInstance.values()).toEqual({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    expect(navigate).toHaveBeenCalledWith(['/inicio'], { replaceUrl: true });
  });

  it('keeps entered values and displays a Firebase error when registration fails', async () => {
    const auth = createAuthMock();
    auth.register.mockRejectedValue(new Error('failed'));
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RegisterPage);
    fixture.componentInstance.updateField('name', 'Alex');
    fixture.componentInstance.updateField('email', 'alex@example.cl');
    fixture.componentInstance.updateField('password', 'secure-password');
    fixture.componentInstance.updateField('confirmPassword', 'secure-password');

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.values().name).toBe('Alex');
    expect(fixture.componentInstance.confirmation()).toContain(
      'No fue posible completar la operación.',
    );
  });

  it('shows the same eight-character minimum when Firebase rejects a weak password', async () => {
    const auth = createAuthMock();
    auth.register.mockRejectedValue(
      new FirebaseError('auth/weak-password', 'Weak password'),
    );
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RegisterPage);
    fixture.componentInstance.updateField('name', 'Alex');
    fixture.componentInstance.updateField('email', 'alex@example.cl');
    fixture.componentInstance.updateField('password', 'secure-password');
    fixture.componentInstance.updateField('confirmPassword', 'secure-password');

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.confirmation()).toBe(
      'La contraseña debe tener al menos 8 caracteres.',
    );
  });

  it('returns to Login', async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: createAuthMock() },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RegisterPage);

    await fixture.componentInstance.goToLogin();

    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
