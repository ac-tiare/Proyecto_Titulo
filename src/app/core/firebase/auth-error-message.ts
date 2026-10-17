import { FirebaseError } from 'firebase/app';
import { AccountCreatedProfileUpdateError } from './auth.service';

export function authErrorMessage(error: unknown): string {
  if (error instanceof AccountCreatedProfileUpdateError) {
    return 'La cuenta fue creada, pero no se pudo guardar el nombre del perfil. Tu sesión quedó iniciada; avisa al equipo antes de continuar.';
  }

  if (!(error instanceof FirebaseError)) {
    return 'No fue posible completar la operación. Inténtalo nuevamente.';
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return 'Ingresa un correo electrónico válido.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'El correo o la contraseña no son correctos.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese correo electrónico.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Hubo demasiados intentos. Espera un momento e inténtalo nuevamente.';
    case 'auth/network-request-failed':
      return 'No fue posible conectar con Firebase. Revisa tu conexión e inténtalo nuevamente.';
    case 'auth/operation-not-allowed':
      return 'El acceso por correo y contraseña no está habilitado en Firebase.';
    default:
      return 'No fue posible completar la operación. Inténtalo nuevamente.';
  }
}
