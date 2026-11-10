import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({ providedIn: 'root' })
export class NotificationPermissionService {
  async ensurePermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      const current = await LocalNotifications.checkPermissions();
      if (current.display === 'granted') return true;

      const requested = await LocalNotifications.requestPermissions();
      return requested.display === 'granted';
    }

    if (typeof Notification === 'undefined') {
      throw new Error('Este dispositivo no admite notificaciones.');
    }

    if (Notification.permission === 'granted') return true;
    return (await Notification.requestPermission()) === 'granted';
  }
}
