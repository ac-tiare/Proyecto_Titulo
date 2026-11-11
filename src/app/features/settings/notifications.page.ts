import { Component, inject, signal } from '@angular/core';
import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonToggle,
} from '@ionic/angular';

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
  imports: [IonContent, IonIcon, IonItem, IonLabel, IonList, IonNote, IonToggle],
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
  readonly preferencesLoaded = signal(false);
  readonly errorMessage = signal('');
  readonly syncMessage = signal('');
  private userId: string | null = null;

  ionViewWillEnter(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.syncMessage.set('');
    this.userId = null;
    this.hasUser.set(false);
    this.preferencesLoaded.set(false);
    this.authSession
      .restore()
      .subscribe({
        next: (user) => {
          if (!user) {
            this.userId = null;
            this.hasUser.set(false);
            this.errorMessage.set('Inicia sesión para administrar tus avisos.');
            this.loading.set(false);
            return;
          }

          this.userId = user.id;
          this.hasUser.set(true);
          void this.synchronizePreferences(user.id);
        },
        error: (error: unknown) => {
          this.errorMessage.set(apiErrorMessage(error));
          this.loading.set(false);
        },
      });
  }

  private async synchronizePreferences(userId: string): Promise<void> {
    try {
      const result = await this.preferencesService.synchronize(userId);
      this.preferences.set(result.preferences);
      this.preferencesLoaded.set(true);
      if (result.syncState === 'pending') {
        this.syncMessage.set(
          'Tus cambios están guardados en este dispositivo y pendientes de sincronización.',
        );
      } else if (result.syncState === 'stale') {
        this.syncMessage.set(
          'Se muestran tus últimas preferencias guardadas en este dispositivo; podrían estar desactualizadas.',
        );
      }
    } catch (error) {
      this.preferencesLoaded.set(false);
      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : apiErrorMessage(error),
      );
    } finally {
      this.loading.set(false);
    }
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

      const result = await this.preferencesService.update(
        userId,
        preference,
        enabled,
      );
      this.preferences.set(result.preferences);
      this.syncMessage.set(
        result.syncState === 'pending'
          ? 'El cambio quedó guardado en este dispositivo y está pendiente de sincronización.'
          : '',
      );
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
