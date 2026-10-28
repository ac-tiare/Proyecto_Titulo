import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';

@Component({
  selector: 'app-support-network',
  templateUrl: './support-network.page.html',
  styleUrl: './support-network.page.scss',
  imports: [IonButton, IonContent, RouterLink],
})
export class SupportNetworkPage {}
