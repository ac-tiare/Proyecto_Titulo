import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonToast } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
  imports: [IonButton, IonContent, IonIcon, IonToast, RouterLink],
})
export class ProfilePage {
  private readonly updatedName = signal<string | null>(null);
  private readonly updatedEmail = signal<string | null>(null);
  readonly profileName = computed(
    () => this.updatedName() ?? 'Usuario CONTIGO',
  );
  readonly profileEmail = computed(
    () => this.updatedEmail() ?? 'Correo no disponible',
  );
  readonly editingProfile = signal(false);
  readonly draftName = signal('');
  readonly draftEmail = signal('');
  readonly editError = signal('');
  readonly feedback = signal('');
  readonly notificationsOpen = signal(false);
  readonly privacyOpen = signal(false);
  readonly remindersEnabled = signal(true);
  readonly wellbeingTipsEnabled = signal(false);
  readonly errorMessage = signal('');
  readonly noticeOpen = signal(false);

  get profileInitial(): string {
    return this.profileName().trim().charAt(0).toLocaleUpperCase('es-CL') || 'C';
  }

  openProfileEditor(): void {
    this.draftName.set(this.profileName());
    this.draftEmail.set(
      this.profileEmail() === 'Correo no disponible' ? '' : this.profileEmail(),
    );
    this.editError.set('');
    this.feedback.set('');
    this.editingProfile.set(true);
  }

  updateDraftName(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.draftName.set(event.target.value);
    }
  }

  updateDraftEmail(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.draftEmail.set(event.target.value);
    }
  }

  saveProfile(): void {
    const name = this.draftName().trim();
    const email = this.draftEmail().trim();
    if (!name) {
      this.editError.set('Ingresa tu nombre.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.editError.set('Ingresa un correo electrónico válido.');
      return;
    }

    this.updatedName.set(name);
    this.updatedEmail.set(email);
    this.editingProfile.set(false);
    this.feedback.set(
      'Cambios de vista previa aplicados en esta sesión; todavía no se guardan en tu cuenta.',
    );
  }

  cancelProfileEdit(): void {
    this.editingProfile.set(false);
    this.editError.set('');
  }

  toggleNotifications(): void {
    this.notificationsOpen.update((open) => !open);
  }

  togglePrivacy(): void {
    this.privacyOpen.update((open) => !open);
  }

  toggleReminders(): void {
    this.remindersEnabled.update((enabled) => !enabled);
  }

  toggleWellbeingTips(): void {
    this.wellbeingTipsEnabled.update((enabled) => !enabled);
  }

  signOut(): void {
    this.errorMessage.set(
      'La gestión de sesiones está temporalmente inactiva; no hay una sesión que cerrar.',
    );
    this.noticeOpen.set(true);
  }
}
