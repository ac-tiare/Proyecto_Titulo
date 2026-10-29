import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { apiInterceptor } from '../../core/api/api.interceptor';
import { Page, TrustedContact } from '../../core/api/api.models';
import { SupportNetworkPage } from './support-network.page';

describe('SupportNetworkPage', () => {
  let httpTesting: HttpTestingController;

  const configure = async () =>
    TestBed.configureTestingModule({
      imports: [SupportNetworkPage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    })
      .compileComponents()
      .then(() => {
        httpTesting = TestBed.inject(HttpTestingController);
      });

  const contact = (
    overrides: Partial<TrustedContact> = {},
  ): TrustedContact => ({
    id: 'contact-id',
    userId: 'user-id',
    name: 'Persona de confianza',
    phone: '+56912345678',
    relationship: 'Amistad',
    details: 'Prefiero que me llame',
    createdAt: '2026-10-28T12:00:00.000Z',
    updatedAt: '2026-10-28T12:00:00.000Z',
    ...overrides,
  });

  const response = (
    items: TrustedContact[],
    page = 1,
    pageSize = 20,
    total = items.length,
  ): { data: Page<TrustedContact> } => ({
    data: {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    },
  });

  afterEach(() => httpTesting.verify());

  it('loads and displays the account contact list with an honest empty state', async () => {
    await configure();

    const fixture = TestBed.createComponent(SupportNetworkPage);
    const page = fixture.componentInstance;
    page.loadContacts();
    httpTesting.expectOne('/api/contactos?page=1&pageSize=20')
      .flush(response([]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Aún no tienes contactos guardados',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Ver opciones de ayuda',
    );
    expect(page.pagination().total).toBe(0);
  });

  it('creates a contact and confirms it only after the backend saves it', async () => {
    await configure();

    const fixture = TestBed.createComponent(SupportNetworkPage);
    const page = fixture.componentInstance;
    page.startCreate();
    page.name.set('Persona de confianza');
    page.phone.set('+56912345678');
    page.relationship.set('Amistad');
    page.details.set('Prefiero que me llame');
    page.saveContact();

    const createRequest = httpTesting.expectOne('/api/contactos');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      name: 'Persona de confianza',
      phone: '+56912345678',
      relationship: 'Amistad',
      details: 'Prefiero que me llame',
    });
    createRequest.flush({ data: contact() }, { status: 201, statusText: 'Created' });
    httpTesting.expectOne('/api/contactos?page=1&pageSize=20')
      .flush(response([contact()]));
    fixture.detectChanges();

    expect(page.contacts()).toEqual([contact()]);
    expect(page.editorOpen()).toBe(false);
    expect(page.notice()).toBe('El contacto fue agregado.');
    expect(fixture.nativeElement.textContent).toContain('Persona de confianza');
  });

  it('updates and deletes contacts only after successful API responses', async () => {
    await configure();

    const fixture = TestBed.createComponent(SupportNetworkPage);
    const page = fixture.componentInstance;
    page.loadContacts();
    httpTesting.expectOne('/api/contactos?page=1&pageSize=20')
      .flush(response([contact()]));

    page.startEdit(contact());
    page.name.set('Contacto actualizado');
    page.saveContact();
    const updateRequest = httpTesting.expectOne('/api/contactos/contact-id');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toMatchObject({
      name: 'Contacto actualizado',
    });
    updateRequest.flush(null, { status: 204, statusText: 'No Content' });
    httpTesting.expectOne('/api/contactos?page=1&pageSize=20')
      .flush(response([contact({ name: 'Contacto actualizado' })]));
    expect(page.notice()).toBe('El contacto fue actualizado.');

    page.confirmDelete('contact-id');
    expect(page.confirmDeleteId()).toBe('contact-id');
    page.deleteContact('contact-id');
    const deleteRequest = httpTesting.expectOne('/api/contactos/contact-id');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null, { status: 204, statusText: 'No Content' });
    httpTesting.expectOne('/api/contactos?page=1&pageSize=20')
      .flush(response([]));

    expect(page.contacts()).toEqual([]);
    expect(page.confirmDeleteId()).toBeNull();
    expect(page.notice()).toBe('El contacto fue eliminado.');
  });

  it('keeps the form open and shows an error when a save fails', async () => {
    await configure();

    const fixture = TestBed.createComponent(SupportNetworkPage);
    const page = fixture.componentInstance;
    page.startCreate();
    page.name.set('Contacto');
    page.phone.set('123');
    page.saveContact();

    httpTesting.expectOne('/api/contactos').flush(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ingresa un teléfono válido.',
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(page.editorOpen()).toBe(true);
    expect(page.formError()).toBe('Ingresa un teléfono válido.');
    expect(page.name()).toBe('Contacto');
  });
});
