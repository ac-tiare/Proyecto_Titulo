import { Injectable } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseClientService {
  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly firestore: Firestore;

  constructor() {
    this.app = getApps().some((app) => app.name === '[DEFAULT]')
      ? getApp()
      : initializeApp(environment.firebaseConfig);
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app);
  }
}
