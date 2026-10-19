import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';

import {
  SafetyPlanSupportService,
  SafetySupportEntry,
} from './safety-plan-support.service';

@Component({
  selector: 'app-support-network',
  templateUrl: './support-network.page.html',
  styleUrl: './support-network.page.scss',
  imports: [IonButton, IonContent, RouterLink],
})
export class SupportNetworkPage {
  private readonly supportService = inject(SafetyPlanSupportService);

  readonly contacts = signal<readonly SafetySupportEntry[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal('');

  ionViewWillEnter(): void {
    void this.loadContacts();
  }

  async loadContacts(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const entries = await this.supportService.list();
      this.contacts.set(entries.filter((entry) => entry.type === 'person'));
    } catch (error) {
      this.loadError.set(
        `No fue posible cargar tus contactos de confianza. Revisa tu conexión y las reglas de Firestore. ${this.errorDetails(error)}`,
      );
    } finally {
      this.loading.set(false);
    }
  }

  private errorDetails(error: unknown): string {
    return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
  }
}
