import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { LoginPage } from './login.page';

describe('LoginPage', () => {
  it('shows labeled fields and an accessible password visibility toggle', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([])],
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
    expect(content).toContain('Modo demostración');
    expect(content).toContain('No ingreses contraseñas reales');
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

  it('continues to Inicio in demo mode without processing credentials', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);

    await fixture.componentInstance.continueDemo();
    await fixture.componentInstance.continueDemo();

    expect(navigate).toHaveBeenNthCalledWith(1, ['/inicio']);
    expect(navigate).toHaveBeenNthCalledWith(2, ['/inicio']);
  });

  it('shows a local notice for unavailable recovery without navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([])],
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
      providers: [provideRouter([])],
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
