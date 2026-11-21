import { TestBed } from '@angular/core/testing';

import { GuestSafetyPlanService } from './guest-safety-plan.service';

describe('GuestSafetyPlanService', () => {
  let service: GuestSafetyPlanService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(GuestSafetyPlanService);
  });

  it('starts with an empty plan and persists guest entries and contacts', () => {
    const data = service.load();
    expect(data).toEqual({
      plan: { warningSigns: [], copingActions: [], safePlaces: [] },
      contacts: [],
    });

    data.plan.warningSigns.push('Mucho ruido me abruma');
    data.contacts.push({
      id: 'guest-contact-1',
      name: 'Alex',
      phone: '+56912345678',
      relationship: 'Amistad',
      details: null,
    });
    service.save(data);

    expect(service.load()).toEqual(data);
  });

  it('rejects malformed stored plans instead of silently replacing them', () => {
    localStorage.setItem('contigo.guest-safety-plan', '{invalid');

    expect(() => service.load()).toThrow(
      'El plan guardado en este dispositivo no tiene un formato válido.',
    );
  });
});
