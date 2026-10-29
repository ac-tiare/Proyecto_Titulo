import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';
import { finalize } from 'rxjs';

import { apiErrorMessage } from '../../core/api/api-error';
import { SafetyPlan, SafetyPlanRequest } from '../../core/api/api.models';
import { SafetyPlanApiService } from '../../core/api/safety-plan-api.service';

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
  private readonly safetyPlanApi = inject(SafetyPlanApiService);

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
      title: 'Lugares de apoyo',
      description:
        'Espacios o lugares donde puedo sentirme más acompañado y seguro.',
      prompt: 'Escribe un lugar por línea.',
    },
    {
      id: 'trusted-contacts',
      title: 'Mis contactos de confianza',
      description:
        'Personas a quienes podría contactar y cómo pedirles que me acompañen.',
      prompt: 'Escribe un nombre y una forma de contacto por línea.',
    },
  ];

  readonly plan = signal<SafetyPlan>({
    id: '',
    warningSigns: [],
    copingActions: [],
    safePlaces: [],
    updatedAt: '',
  });
  readonly editingSection = signal<SafetyPlanSectionId | null>(null);
  readonly draftText = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal('');
  readonly saveError = signal('');
  readonly saveMessage = signal('');

  ionViewWillEnter(): void {
    this.loadPlan();
  }

  loadPlan(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.safetyPlanApi
      .get()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (plan) => this.plan.set(plan),
        error: (error: unknown) =>
          this.loadError.set(apiErrorMessage(error)),
      });
  }

  openEditor(sectionId: SafetyPlanSectionId): void {
    if (sectionId === 'trusted-contacts') return;
    this.saveError.set('');
    this.saveMessage.set('');
    this.draftText.set(this.sectionEntries(sectionId).join('\n'));
    this.editingSection.set(sectionId);
  }

  updateDraft(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) {
      this.draftText.set(event.target.value);
    }
  }

  saveSection(sectionId: SafetyPlanSectionId): void {
    if (sectionId === 'trusted-contacts' || this.saving()) return;
    const entries = this.draftText()
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean);
    const request: SafetyPlanRequest = {
      warningSigns:
        sectionId === 'warning-signs' ? entries : this.plan().warningSigns,
      copingActions:
        sectionId === 'coping-actions' ? entries : this.plan().copingActions,
      safePlaces:
        sectionId === 'support-places' ? entries : this.plan().safePlaces,
    };

    this.saving.set(true);
    this.saveError.set('');
    this.saveMessage.set('');
    this.safetyPlanApi
      .save(request)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (plan) => {
          this.plan.set(plan);
          this.editingSection.set(null);
          this.draftText.set('');
          this.saveMessage.set('Tu plan de seguridad fue actualizado.');
        },
        error: (error: unknown) =>
          this.saveError.set(apiErrorMessage(error)),
      });
  }

  cancelEdit(): void {
    this.editingSection.set(null);
    this.draftText.set('');
  }

  sectionEntries(sectionId: SafetyPlanSectionId): readonly string[] {
    if (sectionId === 'warning-signs') return this.plan().warningSigns;
    if (sectionId === 'coping-actions') return this.plan().copingActions;
    if (sectionId === 'support-places') return this.plan().safePlaces;
    return [];
  }

  sectionLabel(sectionId: SafetyPlanSectionId): string {
    if (sectionId === 'support-places') return 'Agregar lugar de apoyo';
    return this.sectionEntries(sectionId).length
      ? 'Editar sección'
      : 'Completar sección';
  }

  isSectionComplete(sectionId: SafetyPlanSectionId): boolean {
    return sectionId !== 'trusted-contacts' && this.sectionEntries(sectionId).length > 0;
  }
}
