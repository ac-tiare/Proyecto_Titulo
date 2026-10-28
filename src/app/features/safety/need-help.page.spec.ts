import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

import { Capacitor } from '@capacitor/core';
import { NeedHelpPage } from './need-help.page';

const capacitorMock = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: capacitorMock.isNativePlatform },
}));

describe('NeedHelpPage', () => {
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

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    alert.onDidDismiss.mockResolvedValue({ role: 'cancel' });
    alertController.create.mockResolvedValue(alert);
    toastController.create.mockResolvedValue(toast);

    await TestBed.configureTestingModule({
      imports: [NeedHelpPage],
      providers: [
        provideRouter([]),
        { provide: AlertController, useValue: alertController },
        { provide: ToastController, useValue: toastController },
      ],
    }).compileComponents();
  });

  it('shows the official line, direct shortcuts, and contact-storage limitation', () => {
    const fixture = TestBed.createComponent(NeedHelpPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Línea nacional *4141');
    expect(content).toContain('Si hay peligro inmediato');
    expect(content).toContain('no se envían automáticamente');
    expect(content).toContain('los datos remotos no se han eliminado');
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll('ion-button[routerlink]'),
        (button: Element) => button.getAttribute('href'),
      ),
    ).toEqual([
      '/red-apoyo',
      '/red-apoyo',
      '/plan-seguridad',
      '/mi-bienestar',
    ]);
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

  it('opens the official call intent only after user confirmation', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    alert.onDidDismiss.mockResolvedValue({ role: 'confirm' });
    const clickedUris: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function (this: HTMLAnchorElement) {
        clickedUris.push(this.href);
      },
    );
    const page = TestBed.createComponent(NeedHelpPage).componentInstance;

    await page.callOfficialLine();

    expect(clickedUris).toEqual(['tel:*4141']);
    expect(alert.present).toHaveBeenCalledOnce();
    expect(toastController.create).not.toHaveBeenCalled();
  });
});
