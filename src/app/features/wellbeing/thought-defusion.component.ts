import { Component, computed, signal } from '@angular/core';

type ThoughtStep = 1 | 2 | 3;

@Component({
  selector: 'app-thought-defusion',
  templateUrl: './thought-defusion.component.html',
  styleUrl: './thought-defusion.component.scss',
})
export class ThoughtDefusionComponent {
  readonly thoughts = [
    'Siento que pierdo el control',
    'Tengo demasiadas cosas encima',
    'No puedo con este lugar',
  ];
  readonly reframes = [
    'Puedo ir de a poco; no tengo que resolverlo todo ahora.',
    'Este pensamiento está aquí, y también puedo volver a este momento.',
  ];
  readonly step = signal<ThoughtStep>(1);
  readonly selectedThought = signal<string | null>(null);
  readonly selectedReframe = signal<string | null>(null);
  readonly canContinue = computed(() => {
    if (this.step() === 1) return this.selectedThought() !== null;
    if (this.step() === 3) return this.selectedReframe() !== null;
    return true;
  });

  selectThought(thought: string): void {
    this.selectedThought.set(thought);
  }

  selectReframe(reframe: string): void {
    this.selectedReframe.set(reframe);
  }

  nextStep(): void {
    if (!this.canContinue() || this.step() >= 3) return;
    this.step.update((step) => (step + 1) as ThoughtStep);
  }

  previousStep(): void {
    if (this.step() <= 1) return;
    this.step.update((step) => (step - 1) as ThoughtStep);
  }

  restart(): void {
    this.step.set(1);
    this.selectedThought.set(null);
    this.selectedReframe.set(null);
  }
}
