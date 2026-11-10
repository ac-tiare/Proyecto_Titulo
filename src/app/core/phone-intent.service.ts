import { Capacitor } from '@capacitor/core';
import { inject, Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class PhoneIntentService {
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  async confirmAndOpen(
    number: string,
    action: 'call' | 'sms',
    name: string,
  ): Promise<void> {
    const isCall = action === 'call';
    const alert = await this.alertController.create({
      header: isCall ? '¿Iniciar llamada?' : '¿Abrir mensajes?',
      message: isCall
        ? `Se abrirá la aplicación de teléfono para llamar a ${name} (${number}). La llamada solo comenzará si la confirmas en tu dispositivo.`
        : `Se abrirá la aplicación de mensajes para escribir a ${name} (${number}). El mensaje no se enviará hasta que lo redactes y pulses enviar.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: isCall ? 'Continuar a llamada' : 'Continuar a mensajes',
          role: 'confirm',
        },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') return;

    if (!this.supportsPhoneIntents()) {
      const toast = await this.toastController.create({
        message: isCall
          ? `Este dispositivo no puede iniciar llamadas desde la app. Marca ${number} desde un teléfono.`
          : `Este dispositivo no puede abrir mensajes desde la app. Puedes contactar a ${name} al ${number} desde un teléfono.`,
        duration: 5000,
        position: 'bottom',
      });
      await toast.present();
      return;
    }

    const link = document.createElement('a');
    const scheme = action === 'call' ? 'tel' : 'sms';
    link.href = `${scheme}:${this.phoneNumberForIntent(number)}`;
    link.click();
  }

  private supportsPhoneIntents(): boolean {
    if (Capacitor.isNativePlatform()) return true;
    return (
      navigator.maxTouchPoints > 0 &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  private phoneNumberForIntent(phone: string): string {
    return phone.replace(/[^\d+*#,;]/g, '');
  }
}
