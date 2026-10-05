import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProfilePage } from './profile.page';

describe('ProfilePage', () => {
  it('explains that there is no login or saved profile yet', async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('no hay un perfil personal');
    expect(content).toContain('no tiene registro ni inicio de sesión');
    expect(content).toContain('No recopila ni guarda información de perfil');
  });
});
