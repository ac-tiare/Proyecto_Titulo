import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { EmotionalSessionService } from './emotional-session';
import { EmotionalEntryPage } from './emotional-entry.page';

describe('EmotionalEntryPage', () => {
  it('shows all required mood, emotion, note, and date fields accessibly', async () => {
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmotionalEntryPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('¿Cómo te sientes hoy?');
    expect(content).toContain('¿Qué emociones estás sintiendo?');
    expect(content).toContain('¿Quieres agregar algo?');
    expect(content).toContain('Fecha del registro:');
    expect(content).toContain('Guardar registro');

    const moods = fixture.nativeElement.querySelectorAll('[role="radio"]');
    expect(Array.from(moods, (button: Element) => button.textContent?.trim())).toEqual([
      '😄Muy bien',
      '🙂Bien',
      '😐Regular',
      '😔Mal',
      '😣Muy mal',
    ]);
    expect(fixture.nativeElement.querySelectorAll('[role="checkbox"]')).toHaveLength(8);
  });

  it('starts with the mood selected on Inicio and allows replacing it', async () => {
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmotionalEntryPage);
    const session = TestBed.inject(EmotionalSessionService);
    session.startDraft('mal');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        'button[role="radio"][aria-checked="true"]',
      )?.textContent,
    ).toContain('Mal');

    fixture.componentInstance.selectMood('bien');
    fixture.detectChanges();

    expect(session.selectedMood()).toBe('bien');
    expect(
      fixture.nativeElement.querySelectorAll(
        'button[role="radio"][aria-checked="true"]',
      ),
    ).toHaveLength(1);
    expect(session.records()).toHaveLength(0);
  });

  it('reflects emotional choices as editable draft selections', async () => {
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmotionalEntryPage);
    fixture.detectChanges();

    fixture.componentInstance.selectMood('bien');
    fixture.componentInstance.toggleEmotion('calma');
    fixture.componentInstance.toggleEmotion('esperanza');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[role="radio"][aria-checked="true"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelectorAll(
        '[role="checkbox"][aria-checked="true"]',
      ),
    ).toHaveLength(2);
  });

  it('validates required fields and does not save an incomplete draft', async () => {
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmotionalEntryPage);
    const session = TestBed.inject(EmotionalSessionService);
    fixture.detectChanges();

    fixture.componentInstance.save();

    expect(fixture.componentInstance.saveMessage()).toContain(
      'Selecciona un estado emocional.',
    );
    expect(fixture.componentInstance.saveMessage()).toContain(
      'Selecciona al menos una emoción.',
    );
    expect(session.records()).toHaveLength(0);
  });

  it('saves one valid temporary record once, with the optional note', async () => {
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const session = TestBed.inject(EmotionalSessionService);
    session.startDraft('bien');
    const fixture = TestBed.createComponent(EmotionalEntryPage);
    fixture.detectChanges();

    fixture.componentInstance.toggleEmotion('calma');
    fixture.componentInstance.updateNote('Hoy me siento con calma.');
    fixture.componentInstance.save();
    fixture.componentInstance.save();
    fixture.detectChanges();

    expect(session.records()).toHaveLength(1);
    expect(session.records()[0]).toMatchObject({
      moodId: 'bien',
      emotionIds: ['calma'],
      note: 'Hoy me siento con calma.',
    });
    expect(fixture.componentInstance.saveMessage()).toBe(
      'Tu registro emocional fue guardado.',
    );
    expect(fixture.nativeElement.querySelector('.save-button').disabled).toBe(true);
  });

  it('allows a valid save without an optional note', async () => {
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const session = TestBed.inject(EmotionalSessionService);
    session.startDraft('bien');
    const fixture = TestBed.createComponent(EmotionalEntryPage);
    fixture.detectChanges();

    fixture.componentInstance.toggleEmotion('esperanza');
    fixture.componentInstance.save();

    expect(session.records()).toHaveLength(1);
    expect(session.records()[0].note).toBe('');
  });

  it('discards an unconfirmed draft when closing the registration', async () => {
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmotionalEntryPage);
    const session = TestBed.inject(EmotionalSessionService);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    session.startDraft('bien');
    await fixture.componentInstance.finish();

    expect(session.selectedMood()).toBeNull();
    expect(session.records()).toHaveLength(0);
    expect(navigate).toHaveBeenCalledWith(['/inicio']);
  });
});
