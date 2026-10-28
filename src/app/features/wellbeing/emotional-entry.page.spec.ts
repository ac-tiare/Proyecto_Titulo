import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { EmotionalSessionService } from './emotional-session';
import { EmotionalEntryPage } from './emotional-entry.page';

describe('EmotionalEntryPage', () => {
  const configure = async () =>
    TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [provideRouter([])],
    }).compileComponents();

  it('shows all required mood, emotion, note, and date fields accessibly', async () => {
    await configure();

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
    await configure();

    const session = TestBed.inject(EmotionalSessionService);
    session.startDraft('mal');
    const fixture = TestBed.createComponent(EmotionalEntryPage);
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
  });

  it('shows the optional field only while Otra is selected', async () => {
    await configure();

    const fixture = TestBed.createComponent(EmotionalEntryPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain(
      '¿Qué otra emoción sientes?',
    );

    fixture.componentInstance.toggleEmotion('otra');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      '¿Qué otra emoción sientes?',
    );

    fixture.componentInstance.toggleEmotion('otra');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain(
      '¿Qué otra emoción sientes?',
    );
  });

  it('validates required fields and does not save an incomplete record', async () => {
    await configure();

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

  it('saves valid records once in session memory and reports the persistence limit', async () => {
    await configure();

    const session = TestBed.inject(EmotionalSessionService);
    session.startDraft('bien');
    const fixture = TestBed.createComponent(EmotionalEntryPage);
    fixture.detectChanges();

    fixture.componentInstance.toggleEmotion('otra');
    fixture.componentInstance.updateOtherEmotion('Alivio');
    fixture.componentInstance.toggleEmotion('calma');
    fixture.componentInstance.updateNote('Hoy me siento con calma.');
    fixture.componentInstance.save();
    fixture.detectChanges();

    expect(session.records()).toHaveLength(1);
    expect(session.records()[0]).toMatchObject({
      moodId: 'bien',
      emotionIds: ['otra', 'calma'],
      otherEmotion: 'Alivio',
      note: 'Hoy me siento con calma.',
    });
    expect(fixture.componentInstance.saveMessage()).toContain(
      'se perderá al cerrar o recargar la app',
    );
    expect(fixture.nativeElement.querySelector('.save-button').disabled).toBe(true);

    fixture.componentInstance.save();
    expect(session.records()).toHaveLength(1);
  });

  it('allows valid saves without optional text', async () => {
    await configure();

    const session = TestBed.inject(EmotionalSessionService);
    session.startDraft('bien');
    const fixture = TestBed.createComponent(EmotionalEntryPage);
    fixture.detectChanges();
    fixture.componentInstance.toggleEmotion('esperanza');

    fixture.componentInstance.save();

    expect(session.records()[0]).toMatchObject({
      moodId: 'bien',
      emotionIds: ['esperanza'],
      note: '',
      otherEmotion: '',
    });
  });

  it('discards an unconfirmed draft when closing the registration', async () => {
    await configure();

    const fixture = TestBed.createComponent(EmotionalEntryPage);
    const session = TestBed.inject(EmotionalSessionService);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    session.startDraft('bien');
    await fixture.componentInstance.finish();

    expect(session.selectedMood()).toBeNull();
    expect(session.draft()).toBeNull();
    expect(session.records()).toHaveLength(0);
    expect(navigate).toHaveBeenCalledWith(['/inicio']);
  });
});
