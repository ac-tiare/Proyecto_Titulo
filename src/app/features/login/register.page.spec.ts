import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { RegisterPage } from './register.page';

describe('RegisterPage', () => {
  it('shows the four labeled fields and independent password visibility controls', async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([])],
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
    expect(fixture.nativeElement.textContent).toContain('Modo demostración');

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

  it('shows required, email format, and password match errors', async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();

    fixture.componentInstance.submit();
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
    fixture.componentInstance.updateField('password', 'demo');
    fixture.componentInstance.updateField('confirmPassword', 'otra');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Ingresa un correo electrónico válido.',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Las contraseñas no coinciden.',
    );
    expect(fixture.componentInstance.confirmation()).toBe('');
  });

  it('confirms valid demo registration and clears entered personal data', async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(RegisterPage);
    fixture.componentInstance.updateField('name', 'Alex');
    fixture.componentInstance.updateField('email', 'alex@example.cl');
    fixture.componentInstance.updateField('password', 'demo-password');
    fixture.componentInstance.updateField('confirmPassword', 'demo-password');

    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.componentInstance.confirmation()).toContain(
      'No se creó una cuenta real.',
    );
    expect(fixture.componentInstance.values()).toEqual({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  });

  it('returns to Login', async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RegisterPage);

    await fixture.componentInstance.goToLogin();

    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
