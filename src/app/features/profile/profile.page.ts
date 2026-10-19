import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonToast } from '@ionic/angular';
import { AuthService } from '../../core/firebase/auth.service';
import { authErrorMessage } from '../../core/firebase/auth-error-message';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
  imports: [IonButton, IonContent, IonIcon, IonToast, RouterLink],
})
export class ProfilePage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  private readonly updatedName = signal<string | null>(null);
  private readonly updatedEmail = signal<string | null>(null);
  readonly profileName = computed(
    () => this.updatedName() ?? this.user()?.displayName ?? 'Usuario CONTIGO',
  );
  readonly profileEmail = computed(
    () => this.updatedEmail() ?? this.user()?.email ?? 'Correo no disponible',
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
  readonly signingOut = signal(false);

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

  async signOut(): Promise<void> {
    this.signingOut.set(true);
    this.errorMessage.set('');
    try {
      await this.auth.signOut();
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      this.errorMessage.set(authErrorMessage(error));
      this.noticeOpen.set(true);
    } finally {
      this.signingOut.set(false);
    }
  }
}
