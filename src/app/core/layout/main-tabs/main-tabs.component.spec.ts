import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MainTabsComponent } from './main-tabs.component';

describe('MainTabsComponent', () => {
  it('routes Avisos to notification preferences without exposing logout', async () => {
    await TestBed.configureTestingModule({
      imports: [MainTabsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(MainTabsComponent);
    fixture.detectChanges();

    const avisos = fixture.nativeElement.querySelector(
      'ion-tab-button[tab="configuracion-notificaciones"]',
    ) as HTMLElement | null;
    expect(avisos?.getAttribute('href')).toBe(
      '/configuracion-notificaciones',
    );
    expect(avisos?.getAttribute('aria-label')).toBe('Avisos');
    expect(fixture.componentInstance).not.toHaveProperty('logout');
  });
});
