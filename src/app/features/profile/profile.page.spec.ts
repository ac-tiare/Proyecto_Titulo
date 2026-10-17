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
    expect(fixture.nativeElement.textContent).toContain('Cerrar sesión');
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
