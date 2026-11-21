import { Component } from '@angular/core';
import { IonIcon } from '@ionic/angular';

import { officialSupportResources } from '../core/official-support-resources';

@Component({
  selector: 'app-official-support-resources',
  templateUrl: './official-support-resources.component.html',
  styleUrl: './official-support-resources.component.scss',
  imports: [IonIcon],
})
export class OfficialSupportResourcesComponent {
  readonly resources = officialSupportResources;
}
