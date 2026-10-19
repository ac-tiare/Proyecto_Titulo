import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';
import {
  SafetyPlanSupportService,
  SafetySupportEntry,
  SafetySupportType,
} from './safety-plan-support.service';

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
  private readonly supportService = inject(SafetyPlanSupportService);

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
  readonly supportEntries = signal<readonly SafetySupportEntry[]>([]);
  readonly supportLoading = signal(false);
  readonly supportLoadError = signal('');
  readonly supportMutationError = signal('');
  readonly supportNotice = signal('');
  readonly supportFormOpen = signal(false);
  readonly supportSaving = signal(false);
  readonly deletingSupportId = signal<string | null>(null);
  readonly deleteConfirmationId = signal<string | null>(null);
  readonly editingSupportId = signal<string | null>(null);
  readonly supportType = signal<SafetySupportType>('person');
  readonly supportName = signal('');
  readonly supportDetails = signal('');
  readonly supportPhone = signal('');

  ionViewWillEnter(): void {
    void this.loadSupportEntries();
  }

  async loadSupportEntries(): Promise<void> {
    this.supportLoading.set(true);
    this.supportLoadError.set('');
    try {
      this.supportEntries.set(await this.supportService.list());
    } catch (error) {
      this.supportLoadError.set(
        `No fue posible cargar las personas y lugares de apoyo. Revisa tu conexión y las reglas de Firestore. ${this.errorDetails(error)}`,
      );
    } finally {
      this.supportLoading.set(false);
    }
  }

  openSupportForm(): void {
    this.editingSupportId.set(null);
    this.supportType.set('person');
    this.supportName.set('');
    this.supportDetails.set('');
    this.supportPhone.set('');
    this.supportMutationError.set('');
    this.supportNotice.set('');
    this.deleteConfirmationId.set(null);
    this.supportFormOpen.set(true);
  }

  editSupportEntry(entry: SafetySupportEntry): void {
    this.editingSupportId.set(entry.id);
    this.supportType.set(entry.type);
    this.supportName.set(entry.name);
    this.supportDetails.set(entry.details);
    this.supportPhone.set(entry.phone);
    this.supportMutationError.set('');
    this.supportNotice.set('');
    this.deleteConfirmationId.set(null);
    this.supportFormOpen.set(true);
  }

  updateSupportType(event: Event): void {
    if (
      event.target instanceof HTMLSelectElement &&
      (event.target.value === 'person' || event.target.value === 'place')
    ) {
      this.supportType.set(event.target.value);
      if (event.target.value === 'place') {
        this.supportPhone.set('');
      }
    }
  }

  updateSupportName(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.supportName.set(event.target.value);
    }
  }

  updateSupportDetails(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) {
      this.supportDetails.set(event.target.value);
    }
  }

  updateSupportPhone(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.supportPhone.set(event.target.value);
    }
  }

  async saveSupportEntry(): Promise<void> {
    const name = this.supportName().trim();
    const details = this.supportDetails().trim();
    if (!name || name.length > 100) {
      this.supportMutationError.set('El nombre debe tener entre 1 y 100 caracteres.');
      return;
    }
    if (details.length > 300) {
      this.supportMutationError.set('Los detalles no pueden superar los 300 caracteres.');
      return;
    }

    this.supportSaving.set(true);
    this.supportMutationError.set('');
    this.supportNotice.set('');
    try {
      const entryId = this.editingSupportId();
      const input = {
        type: this.supportType(),
        name,
        details,
        phone: this.supportPhone(),
      };
      if (entryId) {
        await this.supportService.update(entryId, input);
        this.supportNotice.set('El registro de apoyo fue actualizado.');
      } else {
        await this.supportService.create(input);
        this.supportNotice.set('El registro de apoyo fue agregado.');
      }
      this.supportFormOpen.set(false);
      await this.loadSupportEntries();
    } catch (error) {
      this.supportMutationError.set(
        `No fue posible guardar el registro en Cloud Firestore. ${this.errorDetails(error)}`,
      );
    } finally {
      this.supportSaving.set(false);
    }
  }

  cancelSupportEdit(): void {
    this.supportFormOpen.set(false);
    this.supportMutationError.set('');
  }

  cancelSupportDelete(): void {
    this.deleteConfirmationId.set(null);
  }

  async deleteSupportEntry(entry: SafetySupportEntry): Promise<void> {
    if (this.deleteConfirmationId() !== entry.id) {
      this.deleteConfirmationId.set(entry.id);
      return;
    }
    this.deletingSupportId.set(entry.id);
    this.supportMutationError.set('');
    this.supportNotice.set('');
    try {
      await this.supportService.delete(entry.id);
      this.deleteConfirmationId.set(null);
      this.supportNotice.set('El registro de apoyo fue eliminado.');
      await this.loadSupportEntries();
    } catch (error) {
      this.supportMutationError.set(
        `No fue posible eliminar el registro de Cloud Firestore. ${this.errorDetails(error)}`,
      );
    } finally {
      this.deletingSupportId.set(null);
    }
  }

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
    return sectionId === 'support-places'
      ? this.supportEntries().length > 0
      : this.sectionEntries(sectionId).length > 0;
  }

  supportTypeLabel(type: SafetySupportType): string {
    return type === 'person' ? 'Persona' : 'Lugar';
  }

  private errorDetails(error: unknown): string {
    return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
  }
}
