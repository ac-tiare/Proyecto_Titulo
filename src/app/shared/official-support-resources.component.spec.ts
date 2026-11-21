import { TestBed } from '@angular/core/testing';

import { OfficialSupportResourcesComponent } from './official-support-resources.component';

describe('OfficialSupportResourcesComponent', () => {
  it('renders direct phone links and secure official websites from local data', async () => {
    await TestBed.configureTestingModule({
      imports: [OfficialSupportResourcesComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(OfficialSupportResourcesComponent);
    fixture.detectChanges();

    const calls = Array.from(
      fixture.nativeElement.querySelectorAll('.call-action'),
    ) as HTMLAnchorElement[];
    expect(calls.map((link) => link.getAttribute('href'))).toEqual([
      'tel:*4141',
      'tel:6003607777',
      'tel:1411',
      'tel:1412',
      'tel:800400035',
      'tel:131',
    ]);
    expect(fixture.nativeElement.textContent).toContain('Llamar 600 360 7777');
    expect(fixture.nativeElement.textContent).toContain(
      'Los sitios web necesitan conexión.',
    );

    const externalLinks = Array.from(
      fixture.nativeElement.querySelectorAll('a[target="_blank"]'),
    ) as HTMLAnchorElement[];
    expect(externalLinks.length).toBeGreaterThan(0);
    expect(
      externalLinks.every(
        (link) => link.getAttribute('rel') === 'noopener noreferrer',
      ),
    ).toBe(true);
    expect(
      externalLinks.some(
        (link) => link.getAttribute('href') === 'https://todomejora.org/hora-segura/',
      ),
    ).toBe(true);
    fixture.destroy();
  });
});
