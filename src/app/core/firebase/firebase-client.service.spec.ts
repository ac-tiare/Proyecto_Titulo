import { TestBed } from '@angular/core/testing';

import { FirebaseClientService } from './firebase-client.service';

describe('FirebaseClientService', () => {
  it('initializes Firebase once and exposes Auth and Firestore for the configured app', async () => {
    await TestBed.configureTestingModule({
      providers: [FirebaseClientService],
    }).compileComponents();

    const client = TestBed.inject(FirebaseClientService);

    expect(client.app.options.projectId).toBe('contigo-19ef0');
    expect(client.auth.app).toBe(client.app);
    expect(client.firestore.app).toBe(client.app);
    expect(TestBed.inject(FirebaseClientService)).toBe(client);
  });
});
