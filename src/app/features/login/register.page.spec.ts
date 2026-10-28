import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { RegisterPage } from './register.page';

describe('RegisterPage', () => {
  const configure = async () =>
    TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([])],
    }).compileComponents();

  it('shows the four labeled fields and independent password visibility controls', async () => {
    await configure();

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

  it('validates required fields, email, password length, and confirmation', async () => {
    await configure();

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
  });

  it('keeps form data and explicitly reports that no account is created', async () => {
    await configure();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.componentInstance.updateField('name', ' Alex ');
    fixture.componentInstance.updateField('email', 'alex@example.cl');
    fixture.componentInstance.updateField('password', 'secure-password');
    fixture.componentInstance.updateField('confirmPassword', 'secure-password');

    await fixture.componentInstance.submit();

    expect(fixture.componentInstance.values().name).toBe(' Alex ');
    expect(fixture.componentInstance.confirmation()).toContain(
      'no se creó ni guardó ninguna cuenta',
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('returns to Login', async () => {
    await configure();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RegisterPage);

    await fixture.componentInstance.goToLogin();

    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
