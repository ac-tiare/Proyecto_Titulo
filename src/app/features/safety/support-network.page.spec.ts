import { TestBed } from '@angular/core/testing';

import { SupportNetworkPage } from './support-network.page';

describe('SupportNetworkPage', () => {
  it('does not show fabricated or saved support contacts', async () => {
    await TestBed.configureTestingModule({
      imports: [SupportNetworkPage],
    }).compileComponents();

    const fixture = TestBed.createComponent(SupportNetworkPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Todavía no hay contactos guardados');
    expect(content).toContain('Esta versión no añade ni guarda contactos');
    expect(fixture.nativeElement.querySelector('a[href^="tel:"]')).toBeNull();
  });
});
