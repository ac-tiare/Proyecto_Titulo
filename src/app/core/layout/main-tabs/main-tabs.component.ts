import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

@Component({
  selector: 'app-main-tabs',
  templateUrl: './main-tabs.component.html',
  styleUrl: './main-tabs.component.scss',
  imports: [
    IonButton,
    IonButtons,
    IonHeader,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonTabs,
    IonTitle,
    IonToolbar,
    RouterLink,
  ],
})
export class MainTabsComponent {}
