import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { User } from 'firebase/auth';

import { AuthService } from '../../core/firebase/auth.service';
import { ProfilePage } from './profile.page';

describe('ProfilePage', () => {
  it('shows the authenticated profile name and email', async () => {
    const user = { displayName: 'Alex', email: 'alex@example.cl' } as User;
    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { user: signal(user), signOut: vi.fn() },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Alex');
    expect(fixture.nativeElement.textContent).toContain('alex@example.cl');
    expect(fixture.nativeElement.textContent).toContain('Mi Perfil');
    expect(fixture.nativeElement.textContent).toContain('Editar información del perfil');
    expect(fixture.nativeElement.textContent).toContain('Notificaciones');
    expect(fixture.nativeElement.textContent).toContain('Privacidad y seguridad');
    expect(fixture.nativeElement.textContent).toContain('Cerrar sesión');
  });

  it('applies simulated profile edits and validates the email', async () => {
    const user = { displayName: 'Alex', email: 'alex@example.cl' } as User;
    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { user: signal(user), signOut: vi.fn() },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfilePage);
    const page = fixture.componentInstance;

    page.openProfileEditor();
    page.draftName.set('Alex actualizado');
    page.draftEmail.set('correo-invalido');
    page.saveProfile();

    expect(page.editError()).toBe('Ingresa un correo electrónico válido.');
    expect(page.profileName()).toBe('Alex');

    page.draftEmail.set('alex.nuevo@example.cl');
    page.saveProfile();

    expect(page.profileName()).toBe('Alex actualizado');
    expect(page.profileEmail()).toBe('alex.nuevo@example.cl');
    expect(page.feedback()).toContain('no se guardan');
    expect(page.editingProfile()).toBe(false);
  });

  it('opens notification and privacy settings and updates local notification preferences', async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: signal(null), signOut: vi.fn() } },
      ],
    }).compileComponents();

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

  it('closes the Firebase session and replaces the page with Login', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: signal(null), signOut } },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ProfilePage);

    await fixture.componentInstance.signOut();

    expect(signOut).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });
});
