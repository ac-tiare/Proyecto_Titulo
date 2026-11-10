import { Component, inject, signal } from '@angular/core';
import { IonContent, IonItem, IonLabel, IonList, IonNote, IonToggle } from '@ionic/angular';
import { finalize } from 'rxjs';

import { apiErrorMessage } from '../../core/api/api-error';
import { AuthSessionService } from '../../core/api/auth-session.service';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferenceKey,
  NotificationPreferences,
} from '../../core/notifications/notification-preferences.service';
import { NotificationPreferencesService } from '../../core/notifications/notification-preferences.service';
import { NotificationPermissionService } from '../../core/notifications/notification-permission.service';

@Component({
  selector: 'app-settings-notifications',
  templateUrl: './notifications.page.html',
  styleUrl: './notifications.page.scss',
  imports: [IonContent, IonItem, IonLabel, IonList, IonNote, IonToggle],
})
export class NotificationsPage {
  private readonly authSession = inject(AuthSessionService);
  private readonly preferencesService = inject(NotificationPreferencesService);
  private readonly permissionService = inject(NotificationPermissionService);
  readonly preferences = signal<NotificationPreferences>({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
  });
  readonly loading = signal(true);
  readonly updating = signal(false);
  readonly hasUser = signal(false);
  readonly errorMessage = signal('');
  private userId: string | null = null;

  ionViewWillEnter(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.userId = null;
    this.hasUser.set(false);
    this.authSession
      .restore()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (user) => {
          if (!user) {
            this.userId = null;
            this.hasUser.set(false);
            this.errorMessage.set('Inicia sesión para administrar tus avisos.');
            return;
          }

          try {
            this.preferences.set(this.preferencesService.load(user.id));
            this.userId = user.id;
            this.hasUser.set(true);
          } catch (error) {
            this.userId = null;
            this.hasUser.set(false);
            this.errorMessage.set(
              error instanceof Error
                ? error.message
                : 'No se pudieron cargar tus preferencias.',
            );
          }
        },
        error: (error: unknown) =>
          this.errorMessage.set(apiErrorMessage(error)),
      });
  }

  async setPreference(
    preference: NotificationPreferenceKey,
    enabled: boolean,
  ): Promise<void> {
    if (this.updating()) return;

    const userId = this.userId;
    if (!userId) {
      this.errorMessage.set('Inicia sesión para administrar tus avisos.');
      return;
    }

    this.errorMessage.set('');
    this.updating.set(true);
    try {
      if (enabled && !(await this.permissionService.ensurePermission())) {
        this.errorMessage.set(
          'No se activó el aviso porque el permiso fue denegado. Puedes habilitarlo en los ajustes de tu dispositivo.',
        );
        return;
      }

      const updated = { ...this.preferences(), [preference]: enabled };
      this.preferencesService.save(userId, updated);
      this.preferences.set(updated);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar tu preferencia.',
      );
    } finally {
      this.updating.set(false);
    }
  }
}
