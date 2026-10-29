export interface AuthenticatedUser {
  id: string;
  name: string;
  surname: string | null;
  email: string;
}
