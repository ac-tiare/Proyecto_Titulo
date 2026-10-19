import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

import { Capacitor } from '@capacitor/core';
import { SafetyPlanSupportService } from './safety-plan-support.service';
import { NeedHelpPage } from './need-help.page';

const capacitorMock = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: capacitorMock.isNativePlatform },
}));

describe('NeedHelpPage', () => {
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
  const alert = {
    present: vi.fn(),
    onDidDismiss: vi.fn(),
  };
  const toast = { present: vi.fn() };
  const alertController = {
    create: vi.fn(),
  };
  const toastController = {
    create: vi.fn(),
  };
  let supportService: ReturnType<typeof createSupportService>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    alert.onDidDismiss.mockResolvedValue({ role: 'cancel' });
    alertController.create.mockResolvedValue(alert);
    toastController.create.mockResolvedValue(toast);
    supportService = createSupportService();

    await TestBed.configureTestingModule({
      imports: [NeedHelpPage],
      providers: [
        provideRouter([]),
        { provide: SafetyPlanSupportService, useValue: supportService },
        { provide: AlertController, useValue: alertController },
        { provide: ToastController, useValue: toastController },
      ],
    }).compileComponents();
  });

  it('shows the official line and the three requested shortcuts', () => {
    const fixture = TestBed.createComponent(NeedHelpPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Línea nacional *4141');
    expect(content).toContain('Si hay peligro inmediato');
    expect(content).toContain('no se envían automáticamente');
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll('ion-button[routerlink]'),
        (button: Element) => button.getAttribute('href'),
      ),
    ).toEqual(['/plan-seguridad', '/red-apoyo', '/plan-seguridad', '/mi-bienestar']);
  });

  it('loads saved people and excludes saved places', async () => {
    supportService.list.mockResolvedValue([
      contact,
      { ...contact, id: 'place-1', name: 'Biblioteca', type: 'place' },
    ]);
    const fixture = TestBed.createComponent(NeedHelpPage);
    await fixture.componentInstance.loadContacts();
    fixture.detectChanges();

    expect(fixture.componentInstance.contacts()).toEqual([contact]);
    expect(fixture.nativeElement.textContent).toContain('Alex');
    expect(fixture.nativeElement.textContent).not.toContain('Biblioteca');
  });

  it('requires confirmation and explains the number on devices without phone intents', async () => {
    alert.onDidDismiss.mockResolvedValue({ role: 'confirm' });
    const page = TestBed.createComponent(NeedHelpPage).componentInstance;

    await page.callOfficialLine();

    expect(alertController.create).toHaveBeenCalledWith(
      expect.objectContaining({
        header: '¿Iniciar llamada?',
        message: expect.stringContaining('*4141'),
      }),
    );
    expect(toastController.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Marca *4141'),
      }),
    );
    expect(toast.present).toHaveBeenCalledOnce();
  });

  it('does not launch a call when the user cancels the confirmation', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click');
    const page = TestBed.createComponent(NeedHelpPage).componentInstance;

    await page.callOfficialLine();

    expect(click).not.toHaveBeenCalled();
    expect(toastController.create).not.toHaveBeenCalled();
  });

  it('opens a confirmed call or SMS only after user confirmation', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    alert.onDidDismiss.mockResolvedValue({ role: 'confirm' });
    const clickedUris: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function (this: HTMLAnchorElement) {
        clickedUris.push(this.href);
      },
    );
    const page = TestBed.createComponent(NeedHelpPage).componentInstance;

    await page.callContact(contact);
    await page.messageContact(contact);

    expect(clickedUris).toEqual([
      'tel:+56912345678',
      'sms:+56912345678',
    ]);
    expect(alert.present).toHaveBeenCalledTimes(2);
    expect(toastController.create).not.toHaveBeenCalled();
  });

  it('shows Firestore errors rather than silently treating them as no contacts', async () => {
    supportService.list.mockRejectedValue(new Error('permission-denied'));
    const fixture = TestBed.createComponent(NeedHelpPage);

    await fixture.componentInstance.loadContacts();
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toContain(
      'reglas de Firestore',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Aún no tienes personas guardadas.',
    );
  });
});
