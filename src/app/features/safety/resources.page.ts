import { Component, computed, inject, signal } from '@angular/core';
import {
  IonAccordion,
  IonAccordionGroup,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonItem,
  IonIcon,
  IonLabel,
  IonSpinner,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

import {
  ResourceApiService,
  ResourceCategoryId,
  ResourceDetail,
  ResourceSummary,
} from '../../core/api/resource-api.service';

const categoryLabels: Record<ResourceCategoryId, string> = {
  'bienestar-emocional': 'Bienestar emocional',
  'senales-alerta': 'Señales de alerta',
  autocuidado: 'Autocuidado',
  'busqueda-ayuda-prevencion': 'Búsqueda de ayuda y prevención',
};

@Component({
  selector: 'app-resources',
  templateUrl: './resources.page.html',
  styleUrl: './resources.page.scss',
  imports: [
    IonAccordion,
    IonAccordionGroup,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonChip,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonSpinner,
  ],
})
export class ResourcesPage {
  private readonly resourceApi = inject(ResourceApiService);
  private requestId = 0;
  readonly selectedCategory = signal<ResourceCategoryId | 'todas'>('todas');
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly resourceItems = signal<ResourceSummary[]>([]);
  readonly details = signal<Record<string, ResourceDetail>>({});
  readonly detailLoading = signal<Record<string, boolean>>({});
  readonly detailErrors = signal<Record<string, string>>({});
  readonly categories: Array<{
    id: ResourceCategoryId | 'todas';
    label: string;
  }> = [
    { id: 'todas', label: 'Todas' },
    { id: 'bienestar-emocional', label: categoryLabels['bienestar-emocional'] },
    { id: 'senales-alerta', label: categoryLabels['senales-alerta'] },
    { id: 'autocuidado', label: categoryLabels.autocuidado },
    {
      id: 'busqueda-ayuda-prevencion',
      label: categoryLabels['busqueda-ayuda-prevencion'],
    },
  ];
  readonly resources = computed(() => {
    const category = this.selectedCategory();
    return category === 'todas'
      ? this.resourceItems()
      : this.resourceItems().filter((resource) => resource.category === category);
  });

  ionViewWillEnter(): void {
    void this.loadResources();
  }

  selectCategory(category: ResourceCategoryId | 'todas'): Promise<void> {
    this.selectedCategory.set(category);
    return this.loadResources();
  }

  async loadResources(): Promise<void> {
    const requestId = ++this.requestId;
    const category = this.selectedCategory();
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const resources = await firstValueFrom(
        this.resourceApi.list(category === 'todas' ? undefined : category),
      );
      if (requestId === this.requestId) this.resourceItems.set(resources);
    } catch {
      if (requestId === this.requestId) {
        this.errorMessage.set('No se pudieron cargar los recursos.');
      }
    } finally {
      if (requestId === this.requestId) this.loading.set(false);
    }
  }

  async loadDetail(id: string): Promise<void> {
    if (this.details()[id] || this.detailLoading()[id]) return;

    this.detailLoading.update((current) => ({ ...current, [id]: true }));
    this.detailErrors.update((current) => ({ ...current, [id]: '' }));
    try {
      const detail = await firstValueFrom(this.resourceApi.get(id));
      this.details.update((current) => ({ ...current, [id]: detail }));
    } catch {
      this.detailErrors.update((current) => ({
        ...current,
        [id]: 'No se pudo cargar el contenido.',
      }));
    } finally {
      this.detailLoading.update((current) => ({ ...current, [id]: false }));
    }
  }

  categoryName(category: ResourceCategoryId): string {
    return categoryLabels[category];
  }

  retryDetail(id: string): void {
    this.detailLoading.update((current) => ({ ...current, [id]: false }));
    void this.loadDetail(id);
  }
}
