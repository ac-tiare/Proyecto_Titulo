import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { finalize, map } from 'rxjs';

import { apiErrorMessage } from '../../core/api/api-error';
import { AuthSessionService } from '../../core/api/auth-session.service';
import {
  SafetyPlan,
  SafetyPlanRequest,
  TrustedContact,
  TrustedContactRequest,
} from '../../core/api/api.models';
import { SafetyPlanApiService } from '../../core/api/safety-plan-api.service';
import { TrustedContactApiService } from '../../core/api/trusted-contact-api.service';
import {
  GuestSafetyPlanService,
  SafetyPlanContact,
} from '../../core/guest-safety-plan.service';

export type SafetyPlanSectionId =
  | 'warning-signs'
  | 'coping-actions'
  | 'support-places'
  | 'trusted-contacts';

type PlanMode = 'loading' | 'guest' | 'account' | 'error';

interface SafetyPlanSection {
  id: SafetyPlanSectionId;
  title: string;
  description: string;
  prompt: string;
}

interface QuickViewItem {
  text: string;
  phone?: string;
}

interface QuickViewSection {
  title: string;
  items: QuickViewItem[];
}

const emptyPlan = (): SafetyPlan => ({
  id: '',
  warningSigns: [],
  copingActions: [],
  safePlaces: [],
  updatedAt: '',
});

@Component({
  selector: 'app-safety-plan',
  templateUrl: './safety-plan.page.html',
  styleUrl: './safety-plan.page.scss',
  imports: [IonButton, IonContent, IonIcon, RouterLink],
})
export class SafetyPlanPage {
  private readonly authSession = inject(AuthSessionService);
  private readonly safetyPlanApi = inject(SafetyPlanApiService);
  private readonly trustedContactApi = inject(TrustedContactApiService);
  private readonly guestPlanStore = inject(GuestSafetyPlanService);

  readonly sections: readonly SafetyPlanSection[] = [
    {
      id: 'warning-signs',
      title: 'Mis señales de alerta',
      description:
        'Cambios o situaciones que pueden avisarme que necesito hacer una pausa o pedir apoyo.',
      prompt: 'Escribe una señal por línea. Puedes elegir una sugerencia o agregar la tuya.',
    },
    {
      id: 'coping-actions',
      title: 'Acciones que me ayudan',
      description:
        'Actividades pequeñas y seguras que puedo probar para sentirme acompañado o recuperar calma.',
      prompt: 'Escribe una acción por línea. Puedes elegir una sugerencia o agregar la tuya.',
    },
    {
      id: 'support-places',
      title: 'Lugares de apoyo',
      description:
        'Espacios o lugares donde puedo sentirme más acompañado y seguro.',
      prompt: 'Escribe un lugar por línea. Puedes elegir una sugerencia o agregar la tuya.',
    },
    {
      id: 'trusted-contacts',
      title: 'Mis contactos de confianza',
      description:
        'Personas a quienes podría contactar y cómo pedirles que me acompañen.',
      prompt: 'Agrega una persona de confianza y la forma de contactarla.',
    },
  ];

  readonly suggestions: Readonly<
    Partial<Record<Exclude<SafetyPlanSectionId, 'trusted-contacts'>, readonly string[]>>
  > = {
    'warning-signs': [
      'Palpitaciones o falta de aire',
      'Mucho ruido me abruma',
      'Ganas de llorar',
      'Mente acelerada',
      'Tensión en hombros',
    ],
    'coping-actions': [
      'Hacer pausa de respiración 1 min',
      'Enfoque sensorial 5-4-3-2-1',
      'Ponerme audífonos con lluvia',
      'Sentarme o apoyarme en el vagón',
    ],
    'support-places': [
      'Asiento cerca de ventana',
      'Zona de asistencia en estación Metro',
      'Mi habitación',
      'Casa de un familiar',
      'Parque tranquilo',
    ],
  };

  readonly mode = signal<PlanMode>('loading');
  readonly guestMode = computed(() => this.mode() === 'guest');
  readonly sessionWarning = signal('');
  readonly plan = signal<SafetyPlan>(emptyPlan());
  readonly editingSection = signal<SafetyPlanSectionId | null>(null);
  readonly draftText = signal('');
  readonly draftEntry = signal('');
  readonly draftEntries = computed(() =>
    this.draftText()
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal('');
  readonly saveError = signal('');
  readonly saveMessage = signal('');
  readonly trustedContacts = signal<SafetyPlanContact[]>([]);
  readonly contactsLoading = signal(true);
  readonly contactsError = signal('');
  readonly contactPage = signal(1);
  readonly contactPageSize = 20;
  readonly contactTotalPages = signal(0);
  readonly contactEditorOpen = signal(false);
  readonly editingContactId = signal<string | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);
  readonly contactName = signal('');
  readonly contactNameTouched = signal(false);
  readonly contactNameError = computed(() => {
    if (!this.contactNameTouched()) return '';
    const name = this.contactName().trim();
    if (!name) return 'Ingresa el nombre de la persona.';
    return name.length > 100 ? 'El nombre no puede superar 100 caracteres.' : '';
  });
  readonly contactPhone = signal('');
  readonly contactPhoneTouched = signal(false);
  readonly contactPhoneError = computed(() => {
    if (!this.contactPhoneTouched()) return '';
    const phone = this.normalizedPhone(this.contactPhone());
    if (!phone) return 'Ingresa un teléfono de contacto.';
    return /^\+?[0-9]{7,15}$/.test(phone)
      ? ''
      : 'Usa entre 7 y 15 dígitos; puedes incluir el prefijo +.';
  });
  readonly contactRelationship = signal('');
  readonly contactDetails = signal('');
  readonly contactSaving = signal(false);
  readonly contactFormError = signal('');
  readonly contactNotice = signal('');
  readonly quickViewOpen = signal(false);
  readonly completedCount = computed(
    () => this.sections.filter((section) => this.isSectionComplete(section.id)).length,
  );
  readonly progressPercent = computed(() => (this.completedCount() / 4) * 100);
  readonly quickViewSections = computed<QuickViewSection[]>(() => {
    const plan = this.plan();
    const sections: QuickViewSection[] = [
      { title: 'Mis señales de alerta', items: plan.warningSigns.map((text) => ({ text })) },
      { title: 'Acciones que me ayudan', items: plan.copingActions.map((text) => ({ text })) },
      { title: 'Lugares de apoyo', items: plan.safePlaces.map((text) => ({ text })) },
      {
        title: 'Mis contactos de confianza',
        items: this.trustedContacts().map((contact) => ({
          text: [contact.name, contact.relationship, contact.details]
            .filter(Boolean)
            .join(' · '),
          phone: contact.phone,
        })),
      },
    ];
    return sections.filter((section) => section.items.length > 0);
  });
  readonly hasSavedContent = computed(() => this.quickViewSections().length > 0);
  readonly visibleContacts = computed(() => {
    const contacts = this.trustedContacts();
    if (this.guestMode()) {
      const start = (this.contactPage() - 1) * this.contactPageSize;
      return contacts.slice(start, start + this.contactPageSize);
    }
    return contacts;
  });

  ionViewWillEnter(): void {
    this.mode.set('loading');
    this.loading.set(true);
    this.contactsLoading.set(true);
    this.loadError.set('');
    this.sessionWarning.set('');
    this.authSession.restore().subscribe({
      next: (user) => {
        if (user) {
          this.mode.set('account');
          this.loadPlan();
          this.loadContacts();
        } else {
          this.mode.set('guest');
          this.loadGuestData();
        }
      },
      error: (error: unknown) => {
        this.mode.set('guest');
        this.sessionWarning.set(
          `No pudimos comprobar tu cuenta. Este plan se abrirá y guardará solo en este dispositivo hasta que haya conexión. ${apiErrorMessage(error)}`,
        );
        this.loadGuestData();
      },
    });
  }

  loadPlan(): void {
    if (this.guestMode()) {
      this.loadGuestData();
      return;
    }
    if (this.mode() !== 'account') return;

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

  loadContacts(): void {
    if (this.guestMode()) {
      this.loadGuestData();
      return;
    }
    if (this.mode() !== 'account') return;

    this.contactsLoading.set(true);
    this.contactsError.set('');
    this.trustedContactApi
      .list(this.contactPage(), this.contactPageSize)
      .pipe(finalize(() => this.contactsLoading.set(false)))
      .subscribe({
        next: (result) => {
          if (!result.items.length && this.contactPage() > 1 && result.pagination.total) {
            this.contactPage.update((page) => page - 1);
            this.loadContacts();
            return;
          }
          this.trustedContacts.set(result.items.map((contact) => this.toPlanContact(contact)));
          this.contactTotalPages.set(result.pagination.totalPages);
        },
        error: (error: unknown) =>
          this.contactsError.set(apiErrorMessage(error)),
      });
  }

  openEditor(sectionId: SafetyPlanSectionId): void {
    if (sectionId === 'trusted-contacts') return;
    this.saveError.set('');
    this.saveMessage.set('');
    this.draftText.set(this.sectionEntries(sectionId).join('\n'));
    this.draftEntry.set('');
    this.editingSection.set(sectionId);
  }

  addSuggestion(
    sectionId: Exclude<SafetyPlanSectionId, 'trusted-contacts'>,
    suggestion: string,
  ): void {
    if (this.editingSection() !== sectionId) return;
    const entries = this.draftEntries();
    const normalizedSuggestion = suggestion.toLocaleLowerCase();
    const selected = entries.some(
      (entry) => entry.toLocaleLowerCase() === normalizedSuggestion,
    );
    this.draftText.set(
      selected
        ? entries
            .filter((entry) => entry.toLocaleLowerCase() !== normalizedSuggestion)
            .join('\n')
        : [...entries, suggestion].join('\n'),
    );
    this.saveError.set('');
  }

  isSuggestionSelected(suggestion: string): boolean {
    return this.draftEntries().some(
      (entry) => entry.toLocaleLowerCase() === suggestion.toLocaleLowerCase(),
    );
  }

  updateDraftEntry(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.draftEntry.set(event.target.value);
    }
  }

  addDraftEntry(): void {
    const entry = this.draftEntry().trim();
    if (!entry || entry.length > 200) return;
    const entries = this.draftEntries();
    if (entries.some((saved) => saved.toLocaleLowerCase() === entry.toLocaleLowerCase())) {
      this.saveError.set('Esa idea ya está en la lista.');
      return;
    }
    this.draftText.set([...entries, entry].join('\n'));
    this.draftEntry.set('');
    this.saveError.set('');
  }

  removeDraftEntry(entry: string): void {
    this.draftText.set(
      this.draftEntries().filter((saved) => saved !== entry).join('\n'),
    );
    this.saveError.set('');
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
    if (this.guestMode()) {
      try {
        this.guestPlanStore.save({
          plan: request,
          contacts: this.trustedContacts(),
        });
        this.plan.set({
          ...request,
          id: 'guest-plan',
          updatedAt: new Date().toISOString(),
        });
        this.completeSectionSave();
      } catch (error) {
        this.saveError.set(this.localErrorMessage(error));
        this.saving.set(false);
      }
      return;
    }

    this.safetyPlanApi
      .save(request)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (plan) => {
          this.plan.set(plan);
          this.completeSectionSave();
        },
        error: (error: unknown) =>
          this.saveError.set(apiErrorMessage(error)),
      });
  }

  cancelEdit(): void {
    this.editingSection.set(null);
    this.draftText.set('');
    this.draftEntry.set('');
    this.saveError.set('');
  }

  sectionEntries(sectionId: SafetyPlanSectionId): readonly string[] {
    if (sectionId === 'warning-signs') return this.plan().warningSigns;
    if (sectionId === 'coping-actions') return this.plan().copingActions;
    if (sectionId === 'support-places') return this.plan().safePlaces;
    return [];
  }

  sectionLabel(sectionId: SafetyPlanSectionId): string {
    return this.sectionEntries(sectionId).length
      ? 'Editar sección'
      : 'Completar sección';
  }

  isSectionComplete(sectionId: SafetyPlanSectionId): boolean {
    if (sectionId === 'trusted-contacts') return this.trustedContacts().length > 0;
    return this.sectionEntries(sectionId).length > 0;
  }

  selectContactPage(page: number): void {
    if (page < 1 || page > this.contactTotalPages()) return;
    this.contactPage.set(page);
    if (this.guestMode()) return;
    this.loadContacts();
  }

  startContactCreate(): void {
    this.clearContactForm();
    this.editingContactId.set(null);
    this.contactFormError.set('');
    this.contactNotice.set('');
    this.contactEditorOpen.set(true);
  }

  startContactEdit(contact: SafetyPlanContact): void {
    this.contactName.set(contact.name);
    this.contactPhone.set(contact.phone);
    this.contactNameTouched.set(false);
    this.contactPhoneTouched.set(false);
    this.contactRelationship.set(contact.relationship ?? '');
    this.contactDetails.set(contact.details ?? '');
    this.editingContactId.set(contact.id);
    this.contactFormError.set('');
    this.contactNotice.set('');
    this.contactEditorOpen.set(true);
  }

  updateContactName(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.contactName.set(event.target.value);
      this.contactFormError.set('');
    }
  }

  updateContactPhone(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.contactPhone.set(event.target.value);
      this.contactFormError.set('');
    }
  }

  touchContactName(): void {
    this.contactNameTouched.set(true);
  }

  touchContactPhone(): void {
    this.contactPhoneTouched.set(true);
  }

  updateContactRelationship(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.contactRelationship.set(event.target.value);
    }
  }

  updateContactDetails(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) {
      this.contactDetails.set(event.target.value);
    }
  }

  saveContact(): void {
    if (this.contactSaving()) return;
    this.contactNameTouched.set(true);
    this.contactPhoneTouched.set(true);
    const input: TrustedContactRequest = {
      name: this.contactName().trim(),
      phone: this.normalizedPhone(this.contactPhone()),
      relationship: this.contactRelationship().trim() || null,
      details: this.contactDetails().trim() || null,
    };
    if (this.contactNameError() || this.contactPhoneError()) {
      this.contactFormError.set('Revisa los campos marcados antes de guardar.');
      return;
    }

    this.contactSaving.set(true);
    this.contactFormError.set('');
    this.contactNotice.set('');
    if (this.guestMode()) {
      const current = this.trustedContacts();
      const contactId = this.editingContactId();
      const contact: SafetyPlanContact = {
        id: contactId ?? this.createGuestContactId(),
        name: input.name,
        phone: input.phone,
        relationship: input.relationship ?? null,
        details: input.details ?? null,
      };
      const contacts = contactId
        ? current.map((item) => (item.id === contactId ? contact : item))
        : [contact, ...current];
      try {
        this.saveGuestData(this.planAsRequest(), contacts);
        this.trustedContacts.set(contacts);
        this.contactPage.set(1);
        this.contactTotalPages.set(Math.ceil(contacts.length / this.contactPageSize));
        this.finishContactSave(contactId);
      } catch (error) {
        this.contactFormError.set(this.localErrorMessage(error));
        this.contactSaving.set(false);
      }
      return;
    }

    const contactId = this.editingContactId();
    const request = contactId
      ? this.trustedContactApi.update(contactId, input)
      : this.trustedContactApi.create(input).pipe(map(() => undefined));
    request.pipe(finalize(() => this.contactSaving.set(false))).subscribe({
      next: () => {
        this.contactPage.set(1);
        this.finishContactSave(contactId);
        this.loadContacts();
      },
      error: (error: unknown) =>
        this.contactFormError.set(apiErrorMessage(error)),
    });
  }

  cancelContactEdit(): void {
    if (this.contactSaving()) return;
    this.contactEditorOpen.set(false);
    this.editingContactId.set(null);
    this.contactFormError.set('');
    this.clearContactForm();
  }

  confirmDeleteContact(contactId: string): void {
    this.confirmDeleteId.set(contactId);
    this.contactFormError.set('');
  }

  cancelDeleteContact(): void {
    this.confirmDeleteId.set(null);
  }

  deleteContact(contactId: string): void {
    if (this.contactSaving()) return;
    this.contactSaving.set(true);
    this.contactFormError.set('');
    if (this.guestMode()) {
      const contacts = this.trustedContacts().filter((item) => item.id !== contactId);
      try {
        this.saveGuestData(this.planAsRequest(), contacts);
        this.trustedContacts.set(contacts);
        this.contactTotalPages.set(Math.ceil(contacts.length / this.contactPageSize));
        if (this.contactPage() > this.contactTotalPages() && this.contactPage() > 1) {
          this.contactPage.update((page) => page - 1);
        }
        this.confirmDeleteId.set(null);
        this.contactNotice.set('El contacto fue eliminado de este dispositivo.');
        this.contactSaving.set(false);
      } catch (error) {
        this.contactFormError.set(this.localErrorMessage(error));
        this.contactSaving.set(false);
      }
      return;
    }

    this.trustedContactApi
      .delete(contactId)
      .pipe(finalize(() => this.contactSaving.set(false)))
      .subscribe({
        next: () => {
          this.confirmDeleteId.set(null);
          this.contactNotice.set('El contacto fue eliminado.');
          this.loadContacts();
        },
        error: (error: unknown) => {
          this.confirmDeleteId.set(null);
          this.contactFormError.set(apiErrorMessage(error));
        },
      });
  }

  openQuickView(): void {
    if (this.hasSavedContent()) this.quickViewOpen.set(true);
  }

  closeQuickView(): void {
    this.quickViewOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  closeQuickViewOnEscape(): void {
    if (this.quickViewOpen()) this.closeQuickView();
  }

  private loadGuestData(): void {
    this.loading.set(true);
    this.contactsLoading.set(true);
    this.loadError.set('');
    this.contactsError.set('');
    try {
      const data = this.guestPlanStore.load();
      this.plan.set({
        ...data.plan,
        id: 'guest-plan',
        updatedAt: '',
      });
      this.trustedContacts.set(data.contacts);
      this.contactTotalPages.set(Math.ceil(data.contacts.length / this.contactPageSize));
    } catch (error) {
      const message = this.localErrorMessage(error);
      this.loadError.set(message);
      this.contactsError.set(message);
    } finally {
      this.loading.set(false);
      this.contactsLoading.set(false);
    }
  }

  private saveGuestData(
    plan: SafetyPlanRequest,
    contacts: SafetyPlanContact[],
  ): void {
    this.guestPlanStore.save({ plan, contacts });
  }

  private planAsRequest(): SafetyPlanRequest {
    return {
      warningSigns: [...this.plan().warningSigns],
      copingActions: [...this.plan().copingActions],
      safePlaces: [...this.plan().safePlaces],
    };
  }

  private toPlanContact(contact: TrustedContact): SafetyPlanContact {
    return {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      details: contact.details,
    };
  }

  private completeSectionSave(): void {
    this.editingSection.set(null);
    this.draftText.set('');
    this.draftEntry.set('');
    this.saveMessage.set(
      this.guestMode()
        ? 'Tu plan se guardó en este dispositivo.'
        : 'Tu plan de seguridad fue actualizado.',
    );
    this.saving.set(false);
  }

  private finishContactSave(contactId: string | null): void {
    this.contactSaving.set(false);
    this.contactEditorOpen.set(false);
    this.contactNotice.set(
      contactId
        ? this.guestMode()
          ? 'El contacto fue actualizado en este dispositivo.'
          : 'El contacto fue actualizado.'
        : this.guestMode()
          ? 'El contacto fue guardado en este dispositivo.'
          : 'El contacto fue agregado.',
    );
    this.editingContactId.set(null);
    this.clearContactForm();
  }

  private clearContactForm(): void {
    this.contactName.set('');
    this.contactNameTouched.set(false);
    this.contactPhone.set('');
    this.contactPhoneTouched.set(false);
    this.contactRelationship.set('');
    this.contactDetails.set('');
  }

  private createGuestContactId(): string {
    return `guest-contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private normalizedPhone(phone: string): string {
    return phone.trim().replace(/[\s().-]/g, '');
  }

  private localErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'No se pudo acceder al plan guardado en este dispositivo.';
  }
}
