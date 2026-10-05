import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
  imports: [IonButton, IonContent, RouterLink],
})
export class ProfilePage {}
