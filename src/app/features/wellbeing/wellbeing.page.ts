import { Component } from '@angular/core';
import { IonButton, IonContent } from '@ionic/angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-wellbeing',
  templateUrl: './wellbeing.page.html',
  styleUrl: './wellbeing.page.scss',
  imports: [IonButton, IonContent, RouterLink],
})
export class WellbeingPage {}
