import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';

export type SafetyPlanSectionId =
  | 'warning-signs'
  | 'coping-actions'
  | 'support-places'
  | 'trusted-contacts';

interface SafetyPlanSection {
  id: SafetyPlanSectionId;
  title: string;
  description: string;
  prompt: string;
}

@Component({
  selector: 'app-safety-plan',
  templateUrl: './safety-plan.page.html',
  styleUrl: './safety-plan.page.scss',
  imports: [IonButton, IonContent, RouterLink],
})
export class SafetyPlanPage {
  readonly sections: readonly SafetyPlanSection[] = [
    {
      id: 'warning-signs',
      title: 'Mis señales de alerta',
      description:
        'Cambios o situaciones que pueden avisarme que necesito hacer una pausa o pedir apoyo.',
      prompt: 'Escribe una señal por línea. Por ejemplo: me cuesta concentrarme.',
    },
    {
      id: 'coping-actions',
      title: 'Acciones que me ayudan',
      description:
        'Actividades pequeñas y seguras que puedo probar para sentirme acompañado o recuperar calma.',
      prompt: 'Escribe una acción por línea. Por ejemplo: salir a caminar un momento.',
    },
    {
      id: 'support-places',
      title: 'Personas y lugares de apoyo',
      description:
        'Personas, espacios o lugares donde puedo sentirme más acompañado y seguro.',
      prompt: 'Escribe una persona o lugar por línea.',
    },
    {
      id: 'trusted-contacts',
      title: 'Mis contactos de confianza',
      description:
        'Personas a quienes podría contactar y cómo pedirles que me acompañen.',
      prompt: 'Escribe un nombre y una forma de contacto por línea.',
    },
  ];

  readonly plan = signal<Record<SafetyPlanSectionId, readonly string[]>>({
    'warning-signs': [],
    'coping-actions': [],
    'support-places': [],
    'trusted-contacts': [],
  });
  readonly editingSection = signal<SafetyPlanSectionId | null>(null);
  readonly draftText = signal('');
  openEditor(sectionId: SafetyPlanSectionId): void {
    this.draftText.set((this.plan()[sectionId] ?? []).join('\n'));
    this.editingSection.set(sectionId);
  }

  updateDraft(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) {
      this.draftText.set(event.target.value);
    }
  }

  saveSection(sectionId: SafetyPlanSectionId): void {
    const entries = this.draftText()
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean);
    this.plan.update((plan) => ({ ...plan, [sectionId]: entries }));
    this.editingSection.set(null);
  }

  cancelEdit(): void {
    this.editingSection.set(null);
    this.draftText.set('');
  }

  sectionEntries(sectionId: SafetyPlanSectionId): readonly string[] {
    return this.plan()[sectionId];
  }

  sectionLabel(sectionId: SafetyPlanSectionId): string {
    if (sectionId === 'support-places') return 'Agregar persona o lugar';
    return this.sectionEntries(sectionId).length
      ? 'Editar sección'
      : 'Completar sección';
  }

  isSectionComplete(sectionId: SafetyPlanSectionId): boolean {
    return sectionId !== 'support-places' && this.sectionEntries(sectionId).length > 0;
  }
}
