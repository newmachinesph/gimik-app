import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const google = vi.hoisted(() => ({
  configure: vi.fn(),
  hasPlayServices: vi.fn(),
  signOut: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: google,
  isErrorWithCode: () => false,
  statusCodes: {},
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'web.apps.googleusercontent.com');
  vi.stubEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', 'ios.apps.googleusercontent.com');
  google.hasPlayServices.mockResolvedValue(true);
  google.signOut.mockResolvedValue(null);
  google.signIn.mockResolvedValue({ type: 'success', data: { idToken: 'test-id-token' } });
});

afterEach(() => vi.unstubAllEnvs());

describe('Google client configuration', () => {
  it('configures both OAuth clients and returns the native ID token', async () => {
    const { getGoogleIdToken } = await import('./google');
    await expect(getGoogleIdToken()).resolves.toBe('test-id-token');
    expect(google.configure).toHaveBeenCalledWith({
      webClientId: 'web.apps.googleusercontent.com',
      iosClientId: 'ios.apps.googleusercontent.com',
    });
    await getGoogleIdToken();
    expect(google.configure).toHaveBeenCalledTimes(1);
  });

  it('preserves Android-only configuration without an iOS client', async () => {
    vi.stubEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', '');
    const { getGoogleIdToken } = await import('./google');
    await getGoogleIdToken();
    expect(google.configure).toHaveBeenCalledWith({ webClientId: 'web.apps.googleusercontent.com' });
  });

  it('does not start native sign-in without a web client', async () => {
    vi.stubEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', '');
    const { getGoogleIdToken, hasGoogleSignIn } = await import('./google');
    expect(hasGoogleSignIn).toBe(false);
    await expect(getGoogleIdToken()).rejects.toThrow('This build has no Google client id');
    expect(google.configure).not.toHaveBeenCalled();
  });
});
