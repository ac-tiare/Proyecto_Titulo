import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { apiInterceptor } from '../../core/api/api.interceptor';
import { AuthSessionService } from '../../core/api/auth-session.service';
import { SafetyPlan, TrustedContact } from '../../core/api/api.models';
import { SafetyPlanPage } from './safety-plan.page';

const user = {
  id: 'user-id',
  name: 'Alex',
  surname: null,
  email: 'alex@example.cl',
};

describe('SafetyPlanPage', () => {
  let httpTesting: HttpTestingController;

  const configure = async (
    restoredUser: typeof user | null = user,
    restorationError?: Error,
  ) =>
    TestBed.configureTestingModule({
      imports: [SafetyPlanPage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthSessionService,
          useValue: {
            restore: () =>
              restorationError
                ? throwError(() => restorationError)
                : of(restoredUser),
          },
        },
      ],
    })
      .compileComponents()
      .then(() => {
        httpTesting = TestBed.inject(HttpTestingController);
      });

  const savedPlan = (overrides: Partial<SafetyPlan> = {}): SafetyPlan => ({
    id: 'plan-id',
    warningSigns: [],
    copingActions: [],
    safePlaces: [],
    updatedAt: '2026-10-28T12:00:00.000Z',
    ...overrides,
  });

  const savedContact = (): TrustedContact => ({
    id: 'contact-id',
    userId: 'user-id',
    name: 'Alex',
    phone: '+56912345678',
    relationship: 'Amistad',
    details: null,
    createdAt: '2026-10-28T12:00:00.000Z',
    updatedAt: '2026-10-28T12:00:00.000Z',
  });

  beforeEach(() => localStorage.clear());
  afterEach(() => httpTesting.verify());

  it('loads the account plan and manages contacts in a single stage', async () => {
    await configure();

    const fixture = TestBed.createComponent(SafetyPlanPage);
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    httpTesting.expectOne('/api/plan-seguridad').flush({
      data: savedPlan({
        warningSigns: ['Me cuesta concentrarme'],
        safePlaces: ['Plaza cercana'],
      }),
    });
    httpTesting.expectOne('/api/contactos?page=1&pageSize=20').flush({
      data: {
        items: [savedContact()],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
      },
    });
    fixture.detectChanges();

    expect(page.mode()).toBe('account');
    expect(page.completedCount()).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Me cuesta concentrarme');
    expect(fixture.nativeElement.textContent).toContain('Alex');
    expect(fixture.nativeElement.querySelector('.guest-note')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.trusted-contact [href="tel:+56912345678"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('ion-button[routerlink="/red-apoyo"]'),
    ).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.contacts-preview')).toHaveLength(0);
  });

  it('adds one-tap suggestions and persists plan sections through the account API', async () => {
    await configure();

    const page = TestBed.createComponent(SafetyPlanPage).componentInstance;
    page.ionViewWillEnter();
    httpTesting.expectOne('/api/plan-seguridad').flush({
      data: savedPlan({ copingActions: ['Respirar con calma'] }),
    });
    httpTesting.expectOne('/api/contactos?page=1&pageSize=20').flush({
      data: {
        items: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      },
    });

    page.openEditor('warning-signs');
    page.addSuggestion('warning-signs', 'Mucho ruido me abruma');
    expect(page.draftText()).toBe('Mucho ruido me abruma');
    expect(page.isSuggestionSelected('mucho ruido me abruma')).toBe(true);
    page.addSuggestion('warning-signs', 'mucho ruido me abruma');
    expect(page.draftText()).toBe('');
    page.addSuggestion('warning-signs', 'Mucho ruido me abruma');
    expect(page.draftText()).toBe('Mucho ruido me abruma');

    page.saveSection('warning-signs');
    const request = httpTesting.expectOne('/api/plan-seguridad');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      warningSigns: ['Mucho ruido me abruma'],
      copingActions: ['Respirar con calma'],
      safePlaces: [],
    });
    request.flush({
      data: savedPlan({
        warningSigns: ['Mucho ruido me abruma'],
        copingActions: ['Respirar con calma'],
      }),
    });

    expect(page.sectionEntries('warning-signs')).toEqual([
      'Mucho ruido me abruma',
    ]);
    expect(page.completedCount()).toBe(2);
  });

  it('adds and removes custom ideas without allowing duplicates', async () => {
    await configure(null);

    const page = TestBed.createComponent(SafetyPlanPage).componentInstance;
    page.openEditor('warning-signs');
    page.draftEntry.set('  Me ayuda caminar  ');
    page.addDraftEntry();
    expect(page.draftEntries()).toEqual(['Me ayuda caminar']);
    expect(page.draftEntry()).toBe('');

    page.draftEntry.set('me ayuda caminar');
    page.addDraftEntry();
    expect(page.draftEntries()).toEqual(['Me ayuda caminar']);
    expect(page.saveError()).toBe('Esa idea ya está en la lista.');

    page.removeDraftEntry('Me ayuda caminar');
    expect(page.draftEntries()).toEqual([]);
    expect(page.saveError()).toBe('');
  });

  it('persists guest plan entries locally without calling authenticated APIs', async () => {
    await configure(null);

    const fixture = TestBed.createComponent(SafetyPlanPage);
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    expect(page.mode()).toBe('guest');

    page.openEditor('coping-actions');
    page.addSuggestion('coping-actions', 'Hacer pausa de respiración 1 min');
    page.saveSection('coping-actions');

    expect(page.sectionEntries('coping-actions')).toEqual([
      'Hacer pausa de respiración 1 min',
    ]);
    expect(JSON.parse(localStorage.getItem('contigo.guest-safety-plan') ?? '{}'))
      .toMatchObject({
        plan: { copingActions: ['Hacer pausa de respiración 1 min'] },
        contacts: [],
      });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'se guarda solo en este dispositivo',
    );
    httpTesting.expectNone('/api/plan-seguridad');
    httpTesting.expectNone('/api/contactos?page=1&pageSize=20');
  });

  it('saves guest contacts locally and exposes a direct telephone link', async () => {
    await configure(null);

    const fixture = TestBed.createComponent(SafetyPlanPage);
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    page.contactName.set('Alex');
    page.contactPhone.set('+56 9 1234-5678');
    page.contactRelationship.set('Amistad');
    page.saveContact();
    fixture.detectChanges();

    expect(page.trustedContacts()).toHaveLength(1);
    expect(page.isSectionComplete('trusted-contacts')).toBe(true);
    expect(
      fixture.nativeElement.querySelector('.trusted-contact [href="tel:+56912345678"]'),
    ).not.toBeNull();
    expect(JSON.parse(localStorage.getItem('contigo.guest-safety-plan') ?? '{}')
      .contacts[0]).toMatchObject({
      name: 'Alex',
      phone: '+56912345678',
      relationship: 'Amistad',
    });
    const contactId = page.trustedContacts()[0].id;
    page.startContactEdit(page.trustedContacts()[0]);
    page.contactName.set('Alexandra');
    page.saveContact();
    expect(page.trustedContacts()[0].name).toBe('Alexandra');

    page.confirmDeleteContact(contactId);
    page.deleteContact(contactId);
    expect(page.trustedContacts()).toEqual([]);
    expect(JSON.parse(localStorage.getItem('contigo.guest-safety-plan') ?? '{}')
      .contacts).toEqual([]);
    httpTesting.expectNone('/api/contactos?page=1&pageSize=20');
  });

  it('creates account contacts through the existing API and reloads the list', async () => {
    await configure();

    const page = TestBed.createComponent(SafetyPlanPage).componentInstance;
    page.ionViewWillEnter();
    httpTesting.expectOne('/api/plan-seguridad').flush({ data: savedPlan() });
    httpTesting.expectOne('/api/contactos?page=1&pageSize=20').flush({
      data: {
        items: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      },
    });

    page.contactName.set('Alex');
    page.contactPhone.set('+56912345678');
    page.saveContact();
    const request = httpTesting.expectOne('/api/contactos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Alex',
      phone: '+56912345678',
      relationship: null,
      details: null,
    });
    request.flush({ data: savedContact() });

    httpTesting.expectOne('/api/contactos?page=1&pageSize=20').flush({
      data: {
        items: [savedContact()],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        },
      },
    });
    expect(page.trustedContacts().map((contact) => contact.name)).toEqual([
      'Alex',
    ]);
  });

  it('opens a large quick view containing only saved plan sections', async () => {
    await configure(null);

    const fixture = TestBed.createComponent(SafetyPlanPage);
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    page.openEditor('warning-signs');
    page.draftText.set('Mente acelerada');
    page.saveSection('warning-signs');
    page.openQuickView();
    fixture.detectChanges();

    const quickView = fixture.nativeElement.querySelector('.quick-view');
    expect(quickView?.textContent).toContain('Mente acelerada');
    expect(quickView?.textContent).not.toContain('Acciones que me ayudan');
    expect(quickView?.textContent).not.toContain('Lugares de apoyo');
  });

  it('keeps the guest plan available when the account check is offline', async () => {
    localStorage.setItem(
      'contigo.guest-safety-plan',
      JSON.stringify({
        plan: {
          warningSigns: ['Mucho ruido me abruma'],
          copingActions: [],
          safePlaces: [],
        },
        contacts: [],
      }),
    );
    await configure(null, new Error('offline'));

    const page = TestBed.createComponent(SafetyPlanPage).componentInstance;
    page.ionViewWillEnter();

    expect(page.mode()).toBe('guest');
    expect(page.sectionEntries('warning-signs')).toEqual([
      'Mucho ruido me abruma',
    ]);
    expect(page.sessionWarning()).toContain('solo en este dispositivo');
    httpTesting.expectNone('/api/plan-seguridad');
    httpTesting.expectNone('/api/contactos?page=1&pageSize=20');
  });
});
