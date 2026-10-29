import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonToast } from '@ionic/angular';
import { concatMap, finalize, from, tap } from 'rxjs';

import { apiErrorMessage } from '../../core/api/api-error';
import { AuthSessionService } from '../../core/api/auth-session.service';
import { AuthStateService } from '../../core/api/auth-state.service';
import {
  PersonalDataApiService,
  type PersonalDataExport,
} from '../../core/api/personal-data-api.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
  imports: [IonButton, IonContent, IonIcon, IonToast, RouterLink],
})
export class ProfilePage {
  private readonly authSession = inject(AuthSessionService);
  private readonly authState = inject(AuthStateService);
  private readonly personalDataApi = inject(PersonalDataApiService);
  readonly profileName = computed(() => {
    const user = this.authState.user();
    return user
      ? [user.name, user.surname].filter(Boolean).join(' ')
      : 'Usuario CONTIGO';
  });
  readonly profileEmail = computed(
    () => this.authState.user()?.email ?? 'Correo no disponible',
  );
  readonly profileLoading = signal(true);
  readonly isSavingProfile = signal(false);
  readonly isSigningOut = signal(false);
  readonly loadError = signal('');
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
  readonly isExportingData = signal(false);
  readonly isDeletingAccount = signal(false);
  readonly deleteAccountOpen = signal(false);
  readonly deleteAccountConfirmation = signal('');
  readonly privacyError = signal('');
  readonly privacyFeedback = signal('');

  ionViewWillEnter(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.profileLoading.set(true);
    this.loadError.set('');
    this.authSession
      .restore()
      .pipe(finalize(() => this.profileLoading.set(false)))
      .subscribe({
        next: (user) => {
          if (!user) this.loadError.set('Inicia sesión para ver tu perfil.');
        },
        error: (error: unknown) =>
          this.loadError.set(apiErrorMessage(error)),
      });
  }

  get profileInitial(): string {
    return this.profileName().trim().charAt(0).toLocaleUpperCase('es-CL') || 'C';
  }

  openProfileEditor(): void {
    const user = this.authState.user();
    if (!user) {
      this.editError.set('No pudimos comprobar tu sesión. Inténtalo nuevamente.');
      return;
    }
    this.draftName.set(user.name);
    this.draftEmail.set(user.email);
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
    if (this.isSavingProfile()) return;
    const name = this.draftName().trim();
    const email = this.draftEmail().trim();
    const user = this.authState.user();
    if (!user) {
      this.editError.set('Inicia sesión nuevamente para editar tu perfil.');
      return;
    }
    if (!name) {
      this.editError.set('Ingresa tu nombre.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.editError.set('Ingresa un correo electrónico válido.');
      return;
    }

    this.editError.set('');
    this.feedback.set('');
    this.isSavingProfile.set(true);
    this.authSession
      .updateProfile({ name, email, surname: user.surname })
      .pipe(finalize(() => this.isSavingProfile.set(false)))
      .subscribe({
        next: () => {
          this.editingProfile.set(false);
          this.feedback.set('Los cambios de tu perfil fueron guardados.');
        },
        error: (error: unknown) =>
          this.editError.set(apiErrorMessage(error)),
      });
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

  exportPersonalData(): void {
    if (this.isExportingData()) return;
    this.privacyError.set('');
    this.privacyFeedback.set('');
    this.isExportingData.set(true);

    this.personalDataApi
      .exportData()
      .pipe(
        concatMap((data) => from(this.downloadExport(data))),
        finalize(() => this.isExportingData.set(false)),
      )
      .subscribe({
        next: (shared) => {
          if (shared) {
            this.privacyFeedback.set('La copia de tus datos está lista.');
          }
        },
        error: (error: unknown) =>
          this.privacyError.set(apiErrorMessage(error)),
      });
  }

  toggleDeleteAccount(): void {
    this.deleteAccountOpen.update((open) => !open);
    this.deleteAccountConfirmation.set('');
    this.privacyError.set('');
    this.privacyFeedback.set('');
  }

  updateDeleteAccountConfirmation(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.deleteAccountConfirmation.set(event.target.value);
    }
  }

  deleteAccount(): void {
    if (
      this.isDeletingAccount() ||
      this.deleteAccountConfirmation() !== 'ELIMINAR MI CUENTA'
    ) {
      return;
    }

    this.privacyError.set('');
    this.privacyFeedback.set('');
    this.isDeletingAccount.set(true);
    let accountDeleted = false;

    this.personalDataApi
      .deleteAccount()
      .pipe(
        tap(() => {
          accountDeleted = true;
        }),
        concatMap(() => this.authSession.completeAccountDeletion()),
        finalize(() => this.isDeletingAccount.set(false)),
      )
      .subscribe({
        error: (error: unknown) => {
          this.privacyError.set(
            accountDeleted
              ? 'La cuenta se eliminó, pero no se completó el cierre local. Vuelve a iniciar sesión para verificarlo.'
              : apiErrorMessage(error),
          );
        },
      });
  }

  toggleReminders(): void {
    this.remindersEnabled.update((enabled) => !enabled);
  }

  toggleWellbeingTips(): void {
    this.wellbeingTipsEnabled.update((enabled) => !enabled);
  }

  signOut(): void {
    if (this.isSigningOut()) return;
    this.errorMessage.set('');
    this.isSigningOut.set(true);
    this.authSession
      .logout()
      .pipe(finalize(() => this.isSigningOut.set(false)))
      .subscribe({
        error: (error: unknown) => {
          this.errorMessage.set(apiErrorMessage(error));
          this.noticeOpen.set(true);
        },
      });
  }

  private async downloadExport(data: PersonalDataExport): Promise<boolean> {
    const file = new File(
      [JSON.stringify(data, null, 2)],
      `contigo-datos-${new Date().toISOString().slice(0, 10)}.json`,
      { type: 'application/json' },
    );

    if (
      navigator.share &&
      navigator.canShare?.({ files: [file] })
    ) {
      try {
        await navigator.share({ files: [file], title: 'Datos de CONTIGO' });
        return true;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return false;
        }
        throw error;
      }
    }

    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }
}
