import { TestBed } from '@angular/core/testing';

import { ResourcesPage } from './resources.page';

describe('ResourcesPage', () => {
  it('labels information as general and excludes unverified emergency contacts', async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcesPage],
    }).compileComponents();

    const fixture = TestBed.createComponent(ResourcesPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('información general');
    expect(content).toContain('no se publican teléfonos ni servicios específicos');
    expect(content).not.toContain('teléfono de emergencia');
    expect(fixture.nativeElement.querySelector('a[href^="tel:"]')).toBeNull();
  });
});
