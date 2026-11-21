import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ExplorePage } from './explore.page';

describe('ExplorePage', () => {
  it('offers the full offline catalog, featured calm practice, and official help', async () => {
    await TestBed.configureTestingModule({
      imports: [ExplorePage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ExplorePage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.exercise-card')).toHaveLength(7);
    expect(fixture.nativeElement.textContent).toContain('Respirar a tu manera');
    expect(fixture.nativeElement.textContent).toContain('Enfoque sensorial 5-4-3-2-1');
    expect(fixture.nativeElement.textContent).toContain('Mucho ruido en el metro');
    const exerciseCards = Array.from(
      fixture.nativeElement.querySelectorAll('.exercise-card'),
    ) as HTMLAnchorElement[];
    expect(
      exerciseCards.some((card) =>
        card.getAttribute('href')?.startsWith('/apoyo/sobrecarga?returnTo=explorar'),
      ),
    ).toBe(true);
    expect(
      exerciseCards.every((card) =>
        card.getAttribute('href')?.includes('returnTo=explorar'),
      ),
    ).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Lectura para despejar la mente');
    expect(fixture.nativeElement.textContent).toContain('Sonidos para aislar el ruido');
    expect(fixture.nativeElement.textContent).toContain('Soltar pensamientos intrusivos');
    expect(fixture.nativeElement.textContent).toContain('Soltar tensión del cuerpo');
    expect(fixture.nativeElement.querySelector('.featured-card')).not.toBeNull();
    expect(
      fixture.nativeElement
        .querySelector('.featured-action')
        ?.getAttribute('href'),
    ).toBe('/apoyo/calmarme?returnTo=explorar');
    expect(fixture.nativeElement.textContent).toContain('Recursos oficiales de ayuda');
    expect(
      fixture.nativeElement.querySelector('.urgent-help')?.getAttribute('href'),
    ).toBe('/necesito-ayuda');
  });

  it('filters practices instantly by intention and hides the featured card outside Todas', async () => {
    await TestBed.configureTestingModule({
      imports: [ExplorePage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ExplorePage);
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.filter-chip'),
    ) as HTMLButtonElement[];

    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      'Todas',
      'Calma rápida',
      'Sobrecarga y ruido',
      'Sonidos',
      'Lecturas',
    ]);

    buttons[1].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.exercise-card')).toHaveLength(3);
    expect(fixture.nativeElement.querySelector('.featured-card')).toBeNull();

    buttons[2].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.exercise-card')).toHaveLength(2);

    buttons[3].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.exercise-card')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Sonidos para aislar el ruido');

    buttons[4].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.exercise-card')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Lectura para despejar la mente');

    buttons[0].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.exercise-card')).toHaveLength(7);
    expect(fixture.nativeElement.querySelector('.featured-card')).not.toBeNull();
  });
});
