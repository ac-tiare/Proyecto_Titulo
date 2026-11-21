import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';

import { OfficialSupportResourcesComponent } from '../../shared/official-support-resources.component';

type ExploreFilterId = 'all' | 'calm' | 'overload' | 'sounds' | 'reading';
type ExerciseCategory = Exclude<ExploreFilterId, 'all'>;

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrl: './explore.page.scss',
  imports: [IonContent, IonIcon, OfficialSupportResourcesComponent, RouterLink],
})
export class ExplorePage {
  readonly activeFilter = signal<ExploreFilterId>('all');
  readonly filters: readonly { id: ExploreFilterId; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'calm', label: 'Calma rápida' },
    { id: 'overload', label: 'Sobrecarga y ruido' },
    { id: 'sounds', label: 'Sonidos' },
    { id: 'reading', label: 'Lecturas' },
  ];
  readonly exercises = [
    {
      title: 'Respirar a tu manera',
      description: 'Una guía visual y silenciosa para hacer una pausa.',
      modality: '1 min · Visual',
      route: '/apoyo/respirar',
      illustration: 'assets/illustrations/breathing-waves.svg',
      category: 'calm',
    },
    {
      title: 'Enfoque sensorial 5-4-3-2-1',
      description: 'Recorre los sentidos a tu ritmo, sin escribir.',
      modality: '2 min · Visual',
      route: '/apoyo/enraizar',
      illustration: 'assets/illustrations/sensory-window.svg',
      category: 'overload',
    },
    {
      title: 'Mucho ruido en el metro',
      description: 'Un refugio visual y corporal para recuperar espacio.',
      modality: '2 min · Visual',
      route: '/apoyo/sobrecarga',
      illustration: 'assets/illustrations/quiet-sound.svg',
      category: 'overload',
    },
    {
      title: 'Lectura para despejar la mente',
      description: 'Unos pasos breves para descansar la atención.',
      modality: '3 min · Lectura',
      route: '/apoyo/despejar',
      illustration: 'assets/illustrations/open-book.svg',
      category: 'reading',
    },
    {
      title: 'Sonidos para aislar el ruido',
      description: 'Paisajes sonoros suaves, generados localmente.',
      modality: '3–5 min · Audio opcional',
      route: '/apoyo/sonidos',
      illustration: 'assets/illustrations/sound-shield.svg',
      category: 'sounds',
    },
    {
      title: 'Soltar pensamientos intrusivos',
      description: 'Mira un pensamiento con un poco más de distancia.',
      modality: '2 min · Visual',
      route: '/apoyo/pensamientos',
      illustration: 'assets/illustrations/thought-distance.svg',
      category: 'calm',
    },
    {
      title: 'Soltar tensión del cuerpo',
      description: 'Una guía discreta para hombros, manos y mandíbula.',
      modality: '90 seg · Visual',
      route: '/apoyo/cuerpo',
      illustration: 'assets/illustrations/body-release.svg',
      category: 'calm',
    },
  ] as const;
  readonly filteredExercises = computed(() => {
    const activeFilter = this.activeFilter();
    return activeFilter === 'all'
      ? this.exercises
      : this.exercises.filter(({ category }) => category === activeFilter);
  });
  readonly showFeaturedPractice = computed(
    () => this.activeFilter() === 'all',
  );
  selectFilter(filter: ExploreFilterId): void {
    this.activeFilter.set(filter);
  }
}
