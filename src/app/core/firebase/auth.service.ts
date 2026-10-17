import { inject, Injectable, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';

import { FirebaseClientService } from './firebase-client.service';

export class AccountCreatedProfileUpdateError extends Error {
  constructor(error: unknown) {
    super(
      'Firebase creó la cuenta, pero no pudo actualizar el nombre del perfil.',
      { cause: error },
    );
    this.name = 'AccountCreatedProfileUpdateError';
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebase = inject(FirebaseClientService);
  private readonly currentUser = signal<User | null>(null);
  private readonly authErrorState = signal<Error | null>(null);
  private readonly authStateReady: Promise<void>;

  readonly user = this.currentUser.asReadonly();
  readonly authError = this.authErrorState.asReadonly();

  constructor() {
    this.authStateReady = new Promise((resolve) => {
      onAuthStateChanged(
        this.firebase.auth,
        (user) => {
          this.currentUser.set(user);
          this.authErrorState.set(null);
          resolve();
        },
        (error) => {
          this.authErrorState.set(error);
          this.currentUser.set(null);
          resolve();
        },
      );
    });
  }

  async waitForAuthState(): Promise<User | null> {
    await this.authStateReady;
    return this.currentUser();
  }

  async signIn(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(
      this.firebase.auth,
      email.trim(),
      password,
    );
    this.currentUser.set(credential.user);
    return credential.user;
  }

  async register(name: string, email: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(
      this.firebase.auth,
      email.trim(),
      password,
    );
    this.currentUser.set(credential.user);
    try {
      await updateProfile(credential.user, { displayName: name.trim() });
    } catch (error) {
      throw new AccountCreatedProfileUpdateError(error);
    }
    return credential.user;
  }

  async signOut(): Promise<void> {
    await signOut(this.firebase.auth);
    this.currentUser.set(null);
  }
}
