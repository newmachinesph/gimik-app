import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import type { AppleSignInIn } from './schema';

/**
 * Getting a Sign in with Apple credential from the device, and nothing more.
 *
 * The identity token is what the server verifies. The authorization code lets
 * it fetch a refresh token so account deletion can revoke Apple access. The
 * name is sent because Apple only reveals it on the very first authorization
 * and never puts it in the token.
 */

/** iOS only; Android never shows the button. */
export const hasAppleSignIn = Platform.OS === 'ios';

/** The person dismissed the sheet. Not an error to show, just a non-event. */
export class AppleCancelled extends Error {
  constructor() {
    super('Apple sign-in cancelled');
    this.name = 'AppleCancelled';
  }
}

export async function getAppleCredential(): Promise<AppleSignInIn> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const name = [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean)
      .join(' ');
    return {
      identity_token: credential.identityToken ?? '',
      authorization_code: credential.authorizationCode,
      name: name || null,
    };
  } catch (cause) {
    if ((cause as { code?: string })?.code === 'ERR_REQUEST_CANCELED') throw new AppleCancelled();
    throw cause;
  }
}
