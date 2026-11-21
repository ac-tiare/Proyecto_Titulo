import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MainTabsComponent } from './main-tabs.component';

describe('MainTabsComponent', () => {
  it('exposes exactly four functional main tabs without a logout action', async () => {
    await TestBed.configureTestingModule({
      imports: [MainTabsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(MainTabsComponent);
    fixture.detectChanges();

    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll('ion-tab-button'),
    ) as HTMLElement[];
    expect(tabs).toHaveLength(4);
    expect(tabs.map((tab) => tab.getAttribute('href'))).toEqual([
      '/inicio',
      '/explorar',
      '/mi-plan',
      '/bienestar',
    ]);
    expect(tabs.map((tab) => tab.getAttribute('aria-label'))).toEqual([
      'Inicio',
      'Explorar',
      'Mi Plan',
      'Bienestar',
    ]);
    expect(
      fixture.nativeElement
        .querySelector('ion-tab-button[aria-label="Explorar"] ion-icon')
        ?.getAttribute('name'),
    ).toBe('compass-outline');
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll('.tab-icon-wrap'),
        (icon: HTMLElement) => icon.parentElement?.getAttribute('aria-label'),
      ),
    ).toEqual(['Inicio', 'Explorar', 'Mi Plan', 'Bienestar']);
    expect(fixture.componentInstance).not.toHaveProperty('logout');
  });

  it('keeps profile and urgent help actions in the shared header', async () => {
    await TestBed.configureTestingModule({
      imports: [MainTabsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(MainTabsComponent);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('ion-button.profile-button')?.getAttribute('href'),
    ).toBe('/perfil');
    const help = fixture.nativeElement.querySelector(
      'ion-button.help-button',
    ) as HTMLElement | null;
    expect(help?.getAttribute('href')).toBe('/necesito-ayuda');
    expect(help?.getAttribute('aria-label')).toBe('Necesito ayuda');
  });

  it('keeps the profile and urgent help actions in the shared header', async () => {
    await TestBed.configureTestingModule({
      imports: [MainTabsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(MainTabsComponent);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('ion-button.profile-button')?.getAttribute('href'),
    ).toBe('/perfil');
    expect(
      fixture.nativeElement.querySelector('ion-button.help-button')?.getAttribute('href'),
    ).toBe('/necesito-ayuda');
  });
});
