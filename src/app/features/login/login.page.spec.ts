import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { LoginPage } from './login.page';

describe('LoginPage', () => {
  const configure = async () =>
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([])],
    }).compileComponents();

  it('shows labeled fields and an accessible password visibility toggle', async () => {
    await configure();

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

  it('requires credentials before displaying the inactive-authentication notice', async () => {
    await configure();

    const fixture = TestBed.createComponent(LoginPage);
    await fixture.componentInstance.signIn();
    expect(fixture.componentInstance.errorMessage()).toContain(
      'Ingresa tu correo electrónico y contraseña.',
    );
    expect(fixture.componentInstance.noticeOpen()).toBe(false);
  });

  it('does not authenticate or navigate when credentials are submitted', async () => {
    await configure();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl');
    const fixture = TestBed.createComponent(LoginPage);
    fixture.componentInstance.email.set('alex@example.cl');
    fixture.componentInstance.password.set('secure-password');

    await fixture.componentInstance.signIn();

    expect(fixture.componentInstance.noticeOpen()).toBe(true);
    expect(fixture.componentInstance.noticeMessage()).toContain(
      'no se ha iniciado ninguna sesión',
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows a local notice for unavailable recovery without navigation', async () => {
    await configure();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
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
    await configure();

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
