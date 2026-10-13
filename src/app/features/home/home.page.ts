import {
  Component,
  HostListener,
  inject,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
} from '@ionic/angular';
import { EmotionalSessionService, MoodId } from '../wellbeing/emotional-session';

interface HomeScrollGesture {
  pointerId: number;
  startY: number;
  startScrollTop: number;
  scrollElement: HTMLElement | null;
  moved: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  imports: [IonButton, IonContent, IonIcon, RouterLink],
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly emotionalSession = inject(EmotionalSessionService);
  private readonly content = viewChild.required(IonContent);
  private scrollElement: HTMLElement | null = null;
  private scrollGesture: HomeScrollGesture | null = null;

  readonly moods: readonly { id: MoodId; label: string; emoji: string }[] = [
    { id: 'muy-bien', label: 'Muy bien', emoji: '😄' },
    { id: 'bien', label: 'Bien', emoji: '🙂' },
    { id: 'mas-o-menos', label: 'Regular', emoji: '😐' },
    { id: 'mal', label: 'Mal', emoji: '😔' },
    { id: 'muy-mal', label: 'Muy mal', emoji: '😣' },
  ];

  startMobileMouseScroll(event: PointerEvent): void {
    const target = event.target;
    if (
      event.pointerType !== 'mouse' ||
      event.button !== 0 ||
      window.innerWidth > 600 ||
      (target instanceof Element &&
        target.closest('a, button, input, textarea, select, [role="button"]'))
    ) {
      return;
    }

    const gesture: HomeScrollGesture = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: this.scrollElement?.scrollTop ?? 0,
      scrollElement: this.scrollElement,
      moved: false,
    };
    this.scrollGesture = gesture;

    if (!gesture.scrollElement) {
      void this.content()
        .getScrollElement()
        .then((element) => {
          this.scrollElement = element;
          if (this.scrollGesture === gesture) {
            gesture.scrollElement = element;
            gesture.startScrollTop = element.scrollTop;
          }
        });
    }
  }

  @HostListener('window:pointermove', ['$event'])
  moveMobileMouseScroll(event: PointerEvent): void {
    const gesture = this.scrollGesture;
    if (
      !gesture ||
      gesture.pointerId !== event.pointerId ||
      !gesture.scrollElement
    ) {
      return;
    }

    const distanceY = gesture.startY - event.clientY;
    if (!gesture.moved && Math.abs(distanceY) < 6) {
      return;
    }

    gesture.moved = true;
    gesture.scrollElement.scrollTop = gesture.startScrollTop + distanceY;
    event.preventDefault();
  }

  @HostListener('window:pointerup', ['$event'])
  @HostListener('window:pointercancel', ['$event'])
  finishMobileMouseScroll(event: PointerEvent): void {
    const gesture = this.scrollGesture;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    this.scrollGesture = null;
  }

  async selectMood(moodId: MoodId): Promise<void> {
    this.emotionalSession.startDraft(moodId);
    await this.router.navigate(['/registro-emocional']);
  }
}
