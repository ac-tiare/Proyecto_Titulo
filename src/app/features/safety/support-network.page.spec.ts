import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SafetyPlanSupportService } from './safety-plan-support.service';
import { SupportNetworkPage } from './support-network.page';

describe('SupportNetworkPage', () => {
  const contact = {
    id: 'contact-1',
    type: 'person' as const,
    name: 'Alex',
    details: 'Puede acompañarme',
    phone: '+56912345678',
    createdAt: 1,
    updatedAt: 1,
  };
  const createSupportService = () => ({
    list: vi.fn().mockResolvedValue([]),
  });

  it('shows saved people and a link to manage them', async () => {
    const supportService = createSupportService();
    supportService.list.mockResolvedValue([contact]);
    await TestBed.configureTestingModule({
      imports: [SupportNetworkPage],
      providers: [
        provideRouter([]),
        { provide: SafetyPlanSupportService, useValue: supportService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SupportNetworkPage);
    await fixture.componentInstance.loadContacts();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Alex');
    expect(fixture.nativeElement.textContent).toContain('+56912345678');
    expect(fixture.nativeElement.querySelector('ion-button')?.getAttribute('href'))
      .toBe('/plan-seguridad');
  });

  it('offers to add contacts when none are saved', async () => {
    await TestBed.configureTestingModule({
      imports: [SupportNetworkPage],
      providers: [
        provideRouter([]),
        {
          provide: SafetyPlanSupportService,
          useValue: createSupportService(),
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SupportNetworkPage);
    await fixture.componentInstance.loadContacts();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Todavía no hay contactos guardados',
    );
    expect(fixture.nativeElement.textContent).toContain('Agregar contacto');
  });

  it('shows Firestore errors rather than treating them as an empty contact list', async () => {
    const supportService = createSupportService();
    supportService.list.mockRejectedValue(new Error('permission-denied'));
    await TestBed.configureTestingModule({
      imports: [SupportNetworkPage],
      providers: [
        provideRouter([]),
        { provide: SafetyPlanSupportService, useValue: supportService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SupportNetworkPage);
    await fixture.componentInstance.loadContacts();
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toContain(
      'reglas de Firestore',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Todavía no hay contactos guardados',
    );
  });
});
