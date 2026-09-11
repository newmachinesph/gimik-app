import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';

/**
 * Getting a Google ID token from the device, and nothing more.
 *
 * The token is the whole point: it is the only thing the server will accept,
 * and the only thing this module returns. Whatever Google says about the
 * person's name or picture is ignored here, because the server re-reads it
 * from the token it verifies rather than trusting a client to report it.
 *
 * Deliberately given the *web* client id. On Android the native library will
 * not mint an ID token at all without one, and the token it does mint is then
 * addressed to that web client - which is why the API accepts it as an
 * audience. The Android client id exists but is never named in code: Google
 * matches it by package name and signing fingerprint.
 */

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

/** False when no client id was built in, so the UI can hide the button. */
export const hasGoogleSignIn = WEB_CLIENT_ID.length > 0;

/** The person dismissed the sheet. Not an error to show, just a non-event. */
export class GoogleCancelled extends Error {
  constructor() {
    super('Google sign-in cancelled');
    this.name = 'GoogleCancelled';
  }
}

/** Google could not produce a token. Worth showing; the cause is in `message`. */
export class GoogleUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleUnavailable';
  }
}

let configured = false;

function configure(): void {
  if (configured) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  configured = true;
}

/**
 * Opens Google's account picker and returns the resulting ID token.
 *
 * Signs out of Google first so the picker always appears. Without it the
 * library silently reuses the last account, which looks like a bug the moment
 * someone wants to switch - and on a shared test device, it is one.
 */
export async function getGoogleIdToken(): Promise<string> {
  if (!hasGoogleSignIn) {
    throw new GoogleUnavailable('This build has no Google client id');
  }
  configure();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    await GoogleSignin.signOut().catch(() => {});

    const response = await GoogleSignin.signIn();
    if (response.type !== 'success') throw new GoogleCancelled();

    const idToken = response.data.idToken;
    if (!idToken) {
      // Almost always a configuration mismatch rather than a runtime fault:
      // the signing fingerprint or package name does not match the Android
      // OAuth client, so Google signs the person in but withholds the token.
      throw new GoogleUnavailable('Google returned no ID token for this build');
    }
    return idToken;
  } catch (cause) {
    if (cause instanceof GoogleCancelled || cause instanceof GoogleUnavailable) throw cause;
    if (isErrorWithCode(cause)) {
      if (cause.code === statusCodes.SIGN_IN_CANCELLED) throw new GoogleCancelled();
      if (cause.code === statusCodes.IN_PROGRESS) throw new GoogleCancelled();
      throw new GoogleUnavailable(`Google sign-in failed (${cause.code})`);
    }
    throw new GoogleUnavailable('Google sign-in failed');
  }
}

/** Clears the Google session so the next sign-in starts from the picker. */
export async function forgetGoogle(): Promise<void> {
  if (!hasGoogleSignIn || !configured) return;
  await GoogleSignin.signOut().catch(() => {});
}
