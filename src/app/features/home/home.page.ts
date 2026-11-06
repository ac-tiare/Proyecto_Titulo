import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
} from '@ionic/angular';
import { EmotionalSessionService, MoodId } from '../wellbeing/emotional-session';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  imports: [IonButton, IonContent, IonIcon, RouterLink],
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly emotionalSession = inject(EmotionalSessionService);

  readonly selectedMood = signal<MoodId | null>(null);
  readonly moods: readonly { id: MoodId; label: string; emoji: string }[] = [
    { id: 'muy-bien', label: 'Muy bien', emoji: '😄' },
    { id: 'bien', label: 'Bien', emoji: '🙂' },
    { id: 'mas-o-menos', label: 'Regular', emoji: '😐' },
    { id: 'mal', label: 'Mal', emoji: '😔' },
    { id: 'muy-mal', label: 'Muy mal', emoji: '😣' },
  ];

  readonly moodAdvice: Record<MoodId, { title: string; tips: readonly string[] }> = {
    'muy-bien': {
      title: 'Disfruta y cuida este momento',
      tips: [
        'Date un momento para reconocer qué te está haciendo sentir bien.',
        'Comparte esta energía con alguien de confianza, si te apetece.',
        'Guarda una idea de lo que te ayuda para volver a ella otro día.',
      ],
    },
    bien: {
      title: 'Sostén lo que te hace bien',
      tips: [
        'Haz una pausa breve y nota cómo se siente tu cuerpo.',
        'Mantén algún hábito sencillo que te ayude a estar en equilibrio.',
        'Si puedes, dedica un momento a algo que disfrutes.',
      ],
    },
    'mas-o-menos': {
      title: 'Ve paso a paso',
      tips: [
        'Ponle nombre a lo que sientes, sin juzgarte por ello.',
        'Prueba respirar despacio y apoyar los pies firmemente en el suelo.',
        'Elige una tarea pequeña y amable para este momento.',
      ],
    },
    mal: {
      title: 'Acompáñate con amabilidad',
      tips: [
        'Permítete sentir sin exigirte resolverlo todo ahora.',
        'Busca un lugar tranquilo y toma unas respiraciones pausadas.',
        'Considera contarle a alguien de confianza cómo estás.',
      ],
    },
    'muy-mal': {
      title: 'Prioriza tu seguridad y busca apoyo',
      tips: [
        'Ve a un lugar donde te sientas más seguro y haz una cosa pequeña a la vez.',
        'Contacta a alguien de confianza y dile claramente que necesitas compañía.',
        'Si estás en peligro inmediato, busca ayuda de emergencia en tu zona.',
      ],
    },
  };

  selectMood(moodId: MoodId): void {
    this.selectedMood.update((selected) => selected === moodId ? null : moodId);
  }

  async openMoodEntry(moodId: MoodId): Promise<void> {
    this.emotionalSession.startDraft(moodId);
    await this.router.navigate(['/registro-emocional']);
  }
}
