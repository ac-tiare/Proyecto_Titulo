import { Component, inject } from '@angular/core';
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

  readonly moods: readonly { id: MoodId; label: string; emoji: string }[] = [
    { id: 'muy-bien', label: 'Muy bien', emoji: '😄' },
    { id: 'bien', label: 'Bien', emoji: '🙂' },
    { id: 'mas-o-menos', label: 'Regular', emoji: '😐' },
    { id: 'mal', label: 'Mal', emoji: '😔' },
    { id: 'muy-mal', label: 'Muy mal', emoji: '😣' },
  ];

  async selectMood(moodId: MoodId): Promise<void> {
    this.emotionalSession.select(moodId);
    await this.router.navigate(['/registro-emocional']);
  }
}
