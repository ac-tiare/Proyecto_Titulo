import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonToast } from '@ionic/angular';
import { AuthService } from '../../core/firebase/auth.service';
import { authErrorMessage } from '../../core/firebase/auth-error-message';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
  imports: [IonButton, IonContent, IonToast, RouterLink],
})
export class ProfilePage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly errorMessage = signal('');
  readonly noticeOpen = signal(false);
  readonly signingOut = signal(false);

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
