import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { EmotionalSessionService } from './emotional-session';
import { EmotionalEntryPage } from './emotional-entry.page';

describe('EmotionalEntryPage', () => {
  it('reflects an emotional choice as a temporary selection', async () => {
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmotionalEntryPage);
    fixture.detectChanges();

    fixture.componentInstance.selectMood('bien');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tu selección es temporal');
    expect(fixture.nativeElement.textContent).toContain('Selección temporal');
    expect(
      fixture.nativeElement.querySelector('button[aria-pressed="true"]'),
    ).not.toBeNull();
  });

  it('clears the temporary selection when closing the registration', async () => {
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmotionalEntryPage);
    const session = TestBed.inject(EmotionalSessionService);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    session.select('bien');
    await fixture.componentInstance.finish();

    expect(session.selectedMood()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/inicio']);
  });
});
