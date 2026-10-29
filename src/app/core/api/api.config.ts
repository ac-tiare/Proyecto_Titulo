import { Capacitor } from '@capacitor/core';

import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    CONTIGO_CONFIG?: {
      apiBaseUrl?: string;
    };
  }
}

const configuredUrl = window.CONTIGO_CONFIG?.apiBaseUrl?.trim();
const baseUrl = (configuredUrl || environment.apiBaseUrl).replace(/\/+$/, '');

if (
  Capacitor.isNativePlatform() &&
  environment.production &&
  !/^https:\/\//i.test(baseUrl)
) {
  throw new Error(
    'Configure a public HTTPS API base URL for the native production app.',
  );
}

export const apiBaseUrl = baseUrl;
