import { TestBed } from '@angular/core/testing';

import { ResourcesPage } from './resources.page';

describe('ResourcesPage', () => {
  it('filters articles by category and keeps the selected articles available', async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcesPage],
    }).compileComponents();

    const fixture = TestBed.createComponent(ResourcesPage);
    const page = fixture.componentInstance;
    fixture.detectChanges();

    expect(page.categories.filter(({ id }) => id !== 'todas')).toHaveLength(4);
    expect(page.resources()).toHaveLength(7);
    page.selectCategory('alertas');
    fixture.detectChanges();

    expect(page.resources()).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain(
      'Observa cambios que te preocupan',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Haz una pausa y respira a tu ritmo',
    );
  });

  it('shows full articles and Chilean support channels in expandable details', async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcesPage],
    }).compileComponents();

    const fixture = TestBed.createComponent(ResourcesPage);
    const page = fixture.componentInstance;
    page.selectCategory('prevencion');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('*4141');
    expect(fixture.nativeElement.textContent).toContain('Salud Responde');
    expect(fixture.nativeElement.textContent).toContain('SENDA');
    expect(fixture.nativeElement.textContent).toContain('Fundación Todo Mejora');
    expect(fixture.nativeElement.querySelector('ion-accordion')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="tel:*4141"]')).not.toBeNull();
    expect(page.resources()).toHaveLength(1);
  });
});
