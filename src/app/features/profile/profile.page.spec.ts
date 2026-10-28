import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProfilePage } from './profile.page';

describe('ProfilePage', () => {
  const configure = async () =>
    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [provideRouter([])],
    }).compileComponents();

  it('shows a clear placeholder profile and existing settings', async () => {
    await configure();

    const fixture = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Usuario CONTIGO');
    expect(fixture.nativeElement.textContent).toContain('Correo no disponible');
    expect(fixture.nativeElement.textContent).toContain('Mi Perfil');
    expect(fixture.nativeElement.textContent).toContain('Editar información del perfil');
    expect(fixture.nativeElement.textContent).toContain('Notificaciones');
    expect(fixture.nativeElement.textContent).toContain('Privacidad y seguridad');
    expect(fixture.nativeElement.textContent).toContain('Cerrar sesión');
  });

  it('applies profile edits as a local preview and validates the email', async () => {
    await configure();

    const fixture = TestBed.createComponent(ProfilePage);
    const page = fixture.componentInstance;

    page.openProfileEditor();
    page.draftName.set('Alex actualizado');
    page.draftEmail.set('correo-invalido');
    page.saveProfile();

    expect(page.editError()).toBe('Ingresa un correo electrónico válido.');
    expect(page.profileName()).toBe('Usuario CONTIGO');

    page.draftEmail.set('alex.nuevo@example.cl');
    page.saveProfile();

    expect(page.profileName()).toBe('Alex actualizado');
    expect(page.profileEmail()).toBe('alex.nuevo@example.cl');
    expect(page.feedback()).toContain('no se guardan');
    expect(page.editingProfile()).toBe(false);
  });

  it('opens notification and privacy settings and updates local preferences', async () => {
    await configure();

    const fixture = TestBed.createComponent(ProfilePage);
    const page = fixture.componentInstance;

    page.toggleNotifications();
    expect(page.notificationsOpen()).toBe(true);
    expect(page.remindersEnabled()).toBe(true);
    page.toggleReminders();
    expect(page.remindersEnabled()).toBe(false);
    page.toggleWellbeingTips();
    expect(page.wellbeingTipsEnabled()).toBe(true);

    page.togglePrivacy();
    expect(page.privacyOpen()).toBe(true);
  });

  it('does not simulate signing out when account sessions are inactive', async () => {
    await configure();

    const fixture = TestBed.createComponent(ProfilePage);
    fixture.componentInstance.signOut();

    expect(fixture.componentInstance.errorMessage()).toContain(
      'no hay una sesión que cerrar',
    );
    expect(fixture.componentInstance.noticeOpen()).toBe(true);
  });
});
