import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../core/firebase/auth.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  const createAuthMock = () => ({
    signIn: vi.fn().mockResolvedValue({ uid: 'user-1' }),
  });

  it('shows labeled fields and an accessible password visibility toggle', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: createAuthMock() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    const email = fixture.nativeElement.querySelector(
      'ion-input[name="email"]',
    ) as HTMLIonInputElement;
    const password = fixture.nativeElement.querySelector(
      'ion-input[name="password"]',
    ) as HTMLIonInputElement;
    const visibilityButton = fixture.nativeElement.querySelector(
      '.visibility-button',
    );

    expect(content).toContain('Bienvenido/a');
    expect(content).toContain('Tu espacio de apoyo y bienestar');
    expect(content).not.toContain('Modo demostración');
    expect(email.getAttribute('label')).toBe('Correo electrónico');
    expect(password.getAttribute('label')).toBe('Contraseña');
    expect(password.type).toBe('password');
    expect(visibilityButton.getAttribute('aria-label')).toBe('Mostrar contraseña');

    visibilityButton.click();
    fixture.detectChanges();

    expect(password.type).toBe('text');
    expect(visibilityButton.getAttribute('aria-label')).toBe('Ocultar contraseña');
    expect(visibilityButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('requires credentials before calling Firebase Authentication', async () => {
    const auth = createAuthMock();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginPage);
    await fixture.componentInstance.signIn();

    expect(fixture.componentInstance.errorMessage()).toContain(
      'Ingresa tu correo electrónico y contraseña.',
    );
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it('authenticates and navigates to Inicio by default', async () => {
    const auth = createAuthMock();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.componentInstance.email.set(' alex@example.cl ');
    fixture.componentInstance.password.set('secure-password');

    await fixture.componentInstance.signIn();

    expect(auth.signIn).toHaveBeenCalledWith(
      ' alex@example.cl ',
      'secure-password',
    );
    expect(navigate).toHaveBeenCalledWith('/inicio', { replaceUrl: true });
  });

  it('shows an authentication error instead of navigating', async () => {
    const auth = createAuthMock();
    auth.signIn.mockRejectedValue(new Error('network'));
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.componentInstance.email.set('alex@example.cl');
    fixture.componentInstance.password.set('bad-password');

    await fixture.componentInstance.signIn();

    expect(fixture.componentInstance.errorMessage()).toContain(
      'No fue posible completar la operación.',
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows a local notice for unavailable recovery without navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: createAuthMock() },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelectorAll(
      'ion-button.text-action',
    ) as NodeListOf<HTMLIonButtonElement>;

    actions[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.noticeOpen()).toBe(true);
    expect(fixture.componentInstance.noticeMessage()).toContain(
      'recuperación de contraseña aún no está disponible',
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('navigates to Crear Cuenta from Login', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: createAuthMock() },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    const createAccount = fixture.nativeElement.querySelector(
      '.create-account',
    ) as HTMLIonButtonElement;
    createAccount.click();

    expect(navigate).toHaveBeenCalledWith(['/crear-cuenta']);
  });
});
