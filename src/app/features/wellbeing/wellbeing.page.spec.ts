import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { WellbeingPage } from './wellbeing.page';

describe('WellbeingPage', () => {
  it('shows an honest empty state instead of invented personal history', async () => {
    await TestBed.configureTestingModule({
      imports: [WellbeingPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(WellbeingPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Todavía no hay registros');
    expect(content).toContain('no se guardan estados emocionales');
    expect(content).not.toContain('tendencias personales');
  });
});
