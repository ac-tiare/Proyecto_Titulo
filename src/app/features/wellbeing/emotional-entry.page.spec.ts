import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { EmotionalSessionService } from './emotional-session';
import { EmotionalRecordsService } from './emotional-records.service';
import { EmotionalEntryPage } from './emotional-entry.page';

describe('EmotionalEntryPage', () => {
  const createRecordsMock = () => ({
    save: vi.fn().mockResolvedValue(undefined),
  });

  it('shows all required mood, emotion, note, and date fields accessibly', async () => {
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [
        provideRouter([]),
        { provide: EmotionalRecordsService, useValue: createRecordsMock() },
      ],
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
      providers: [
        provideRouter([]),
        { provide: EmotionalRecordsService, useValue: createRecordsMock() },
      ],
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
  });

  it('shows the optional field only while Otra is selected', async () => {
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [
        provideRouter([]),
        { provide: EmotionalRecordsService, useValue: createRecordsMock() },
      ],
    }).compileComponents();

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

  it('validates required fields and does not write an incomplete record', async () => {
    const records = createRecordsMock();
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [
        provideRouter([]),
        { provide: EmotionalRecordsService, useValue: records },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmotionalEntryPage);
    fixture.detectChanges();

    await fixture.componentInstance.save();

    expect(fixture.componentInstance.saveMessage()).toContain(
      'Selecciona un estado emocional.',
    );
    expect(fixture.componentInstance.saveMessage()).toContain(
      'Selecciona al menos una emoción.',
    );
    expect(records.save).not.toHaveBeenCalled();
  });

  it('saves a valid record once and confirms only after Firestore resolves', async () => {
    const records = createRecordsMock();
    let resolveSave!: () => void;
    records.save.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      }),
    );
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [
        provideRouter([]),
        { provide: EmotionalRecordsService, useValue: records },
      ],
    }).compileComponents();

    const session = TestBed.inject(EmotionalSessionService);
    session.startDraft('bien');
    const fixture = TestBed.createComponent(EmotionalEntryPage);
    fixture.detectChanges();

    fixture.componentInstance.toggleEmotion('otra');
    fixture.componentInstance.updateOtherEmotion('Alivio');
    fixture.componentInstance.toggleEmotion('calma');
    fixture.componentInstance.updateNote('Hoy me siento con calma.');

    const firstSave = fixture.componentInstance.save();
    await fixture.componentInstance.save();
    expect(fixture.componentInstance.saving()).toBe(true);
    expect(fixture.componentInstance.saveMessage()).toBe('');
    expect(records.save).toHaveBeenCalledOnce();
    expect(records.save).toHaveBeenCalledWith({
      moodId: 'bien',
      emotionIds: ['otra', 'calma'],
      note: 'Hoy me siento con calma.',
      otherEmotion: 'Alivio',
    });

    resolveSave();
    await firstSave;
    fixture.detectChanges();
    expect(fixture.componentInstance.saveMessage()).toBe(
      'Tu registro emocional fue guardado.',
    );
    expect(fixture.nativeElement.querySelector('.save-button').disabled).toBe(true);
  });

  it('allows valid saves without optional text', async () => {
    const records = createRecordsMock();
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [
        provideRouter([]),
        { provide: EmotionalRecordsService, useValue: records },
      ],
    }).compileComponents();

    const session = TestBed.inject(EmotionalSessionService);
    session.startDraft('bien');
    const fixture = TestBed.createComponent(EmotionalEntryPage);
    fixture.detectChanges();
    fixture.componentInstance.toggleEmotion('otra');
    fixture.componentInstance.toggleEmotion('esperanza');

    await fixture.componentInstance.save();

    expect(records.save).toHaveBeenCalledWith({
      moodId: 'bien',
      emotionIds: ['otra', 'esperanza'],
      note: '',
      otherEmotion: '',
    });
  });

  it('shows Firestore errors and allows retrying the save', async () => {
    const records = createRecordsMock();
    records.save.mockRejectedValueOnce(new Error('permission-denied'));
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [
        provideRouter([]),
        { provide: EmotionalRecordsService, useValue: records },
      ],
    }).compileComponents();

    const session = TestBed.inject(EmotionalSessionService);
    session.startDraft('bien');
    const fixture = TestBed.createComponent(EmotionalEntryPage);
    fixture.detectChanges();
    fixture.componentInstance.toggleEmotion('calma');

    await fixture.componentInstance.save();

    expect(fixture.componentInstance.saveMessage()).toContain(
      'permisos de Firestore',
    );
    expect(fixture.nativeElement.querySelector('.save-button').disabled).toBe(false);
  });

  it('discards an unconfirmed draft when closing the registration', async () => {
    await TestBed.configureTestingModule({
      imports: [EmotionalEntryPage],
      providers: [
        provideRouter([]),
        { provide: EmotionalRecordsService, useValue: createRecordsMock() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmotionalEntryPage);
    const session = TestBed.inject(EmotionalSessionService);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    session.startDraft('bien');
    await fixture.componentInstance.finish();

    expect(session.selectedMood()).toBeNull();
    expect(session.draft()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/inicio']);
  });
});
