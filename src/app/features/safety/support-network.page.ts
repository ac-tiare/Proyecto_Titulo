import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';
import { finalize, Observable } from 'rxjs';

import { apiErrorMessage } from '../../core/api/api-error';
import {
  Page,
  TrustedContact,
  TrustedContactRequest,
} from '../../core/api/api.models';
import { TrustedContactApiService } from '../../core/api/trusted-contact-api.service';

@Component({
  selector: 'app-support-network',
  templateUrl: './support-network.page.html',
  styleUrl: './support-network.page.scss',
  imports: [IonButton, IonContent, RouterLink],
})
export class SupportNetworkPage {
  private readonly trustedContactApi = inject(TrustedContactApiService);

  readonly contacts = signal<TrustedContact[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal('');
  readonly formError = signal('');
  readonly notice = signal('');
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly pagination = signal<Page<TrustedContact>['pagination']>({
    page: 1,
    pageSize: this.pageSize,
    total: 0,
    totalPages: 0,
  });
  readonly editorOpen = signal(false);
  readonly editingContactId = signal<string | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);
  readonly name = signal('');
  readonly phone = signal('');
  readonly relationship = signal('');
  readonly details = signal('');

  ionViewWillEnter(): void {
    this.loadContacts();
  }

  loadContacts(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.trustedContactApi
      .list(this.page(), this.pageSize)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          if (!result.items.length && this.page() > 1 && result.pagination.total) {
            this.page.update((page) => page - 1);
            this.loadContacts();
            return;
          }
          this.contacts.set(result.items);
          this.pagination.set(result.pagination);
        },
        error: (error: unknown) =>
          this.loadError.set(apiErrorMessage(error)),
      });
  }

  startCreate(): void {
    this.clearForm();
    this.editingContactId.set(null);
    this.editorOpen.set(true);
  }

  startEdit(contact: TrustedContact): void {
    this.name.set(contact.name);
    this.phone.set(contact.phone);
    this.relationship.set(contact.relationship ?? '');
    this.details.set(contact.details ?? '');
    this.editingContactId.set(contact.id);
    this.formError.set('');
    this.notice.set('');
    this.editorOpen.set(true);
  }

  updateName(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.name.set(event.target.value);
    }
  }

  updatePhone(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.phone.set(event.target.value);
    }
  }

  updateRelationship(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.relationship.set(event.target.value);
    }
  }

  updateDetails(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) {
      this.details.set(event.target.value);
    }
  }

  saveContact(): void {
    if (this.saving()) return;
    const input: TrustedContactRequest = {
      name: this.name().trim(),
      phone: this.phone().trim(),
      relationship: this.relationship().trim() || null,
      details: this.details().trim() || null,
    };

    this.saving.set(true);
    this.formError.set('');
    this.notice.set('');

    const contactId = this.editingContactId();
    const request: Observable<unknown> = contactId
      ? this.trustedContactApi.update(contactId, input)
      : this.trustedContactApi.create(input);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.editorOpen.set(false);
        this.page.set(1);
        this.notice.set(
          contactId
            ? 'El contacto fue actualizado.'
            : 'El contacto fue agregado.',
        );
        this.editingContactId.set(null);
        this.clearForm();
        this.loadContacts();
      },
      error: (error: unknown) => this.formError.set(apiErrorMessage(error)),
    });
  }

  cancelEdit(): void {
    if (this.saving()) return;
    this.editorOpen.set(false);
    this.editingContactId.set(null);
    this.formError.set('');
    this.clearForm();
  }

  confirmDelete(contactId: string): void {
    this.confirmDeleteId.set(contactId);
    this.formError.set('');
  }

  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  deleteContact(contactId: string): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.formError.set('');
    this.trustedContactApi
      .delete(contactId)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.confirmDeleteId.set(null);
          this.notice.set('El contacto fue eliminado.');
          this.loadContacts();
        },
        error: (error: unknown) => {
          this.confirmDeleteId.set(null);
          this.formError.set(apiErrorMessage(error));
        },
      });
  }

  selectPage(page: number): void {
    if (page < 1 || page > this.pagination().totalPages) return;
    this.page.set(page);
    this.loadContacts();
  }

  private clearForm(): void {
    this.name.set('');
    this.phone.set('');
    this.relationship.set('');
    this.details.set('');
  }
}
