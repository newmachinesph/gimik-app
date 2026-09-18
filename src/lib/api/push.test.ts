import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  constants: {
    expoConfig: { extra: { eas: { projectId: 'gimik-project' as string | undefined } } },
    easConfig: { projectId: undefined as string | undefined },
  },
  platform: { OS: 'android' },
  device: { isDevice: true },
  client: { hasApi: true },
  notifications: {
    setNotificationHandler: vi.fn(),
    setNotificationChannelAsync: vi.fn(),
    getPermissionsAsync: vi.fn(),
    requestPermissionsAsync: vi.fn(),
    getExpoPushTokenAsync: vi.fn(),
    AndroidImportance: { DEFAULT: 3 },
  },
  push: { register: vi.fn(), forget: vi.fn() },
}));

vi.mock('expo-constants', () => ({ default: mocks.constants }));
vi.mock('expo-device', () => mocks.device);
vi.mock('expo-notifications', () => mocks.notifications);
vi.mock('react-native', () => ({ Platform: mocks.platform }));
vi.mock('./client', () => mocks.client);
vi.mock('./endpoints', () => ({ push: mocks.push }));

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  mocks.constants.expoConfig.extra.eas.projectId = 'gimik-project';
  mocks.constants.easConfig.projectId = undefined;
  mocks.platform.OS = 'android';
  mocks.device.isDevice = true;
  mocks.client.hasApi = true;
  mocks.notifications.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
  mocks.notifications.requestPermissionsAsync.mockResolvedValue({ granted: true });
  mocks.notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[test]' });
});

describe('push registration', () => {
  it('creates the Android channel before permissions and registers with the EAS project', async () => {
    const { registerForPush } = await import('./push');
    await expect(registerForPush()).resolves.toBe('ExponentPushToken[test]');
    expect(mocks.notifications.setNotificationChannelAsync).toHaveBeenCalledWith('default', {
      name: 'Gimik', importance: 3, vibrationPattern: [0, 180, 90, 180],
    });
    expect(mocks.notifications.setNotificationChannelAsync.mock.invocationCallOrder[0])
      .toBeLessThan(mocks.notifications.getPermissionsAsync.mock.invocationCallOrder[0]);
    expect(mocks.notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'gimik-project' });
    expect(mocks.push.register).toHaveBeenCalledWith({ token: 'ExponentPushToken[test]', platform: 'android' });
  });

  it('uses the native EAS project fallback on iOS without creating an Android channel', async () => {
    mocks.platform.OS = 'ios';
    mocks.constants.expoConfig.extra.eas.projectId = undefined;
    mocks.constants.easConfig.projectId = 'native-project';
    mocks.notifications.getPermissionsAsync.mockResolvedValue({ granted: true });
    const { registerForPush } = await import('./push');
    await registerForPush();
    expect(mocks.notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(mocks.notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(mocks.notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'native-project' });
  });

  it('does not fetch a token when permission is denied', async () => {
    mocks.notifications.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });
    const { registerForPush } = await import('./push');
    await expect(registerForPush()).resolves.toBeNull();
    expect(mocks.notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(mocks.notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(mocks.push.register).not.toHaveBeenCalled();
  });

  it('does not fetch a token without an EAS project', async () => {
    mocks.constants.expoConfig.extra.eas.projectId = undefined;
    const { registerForPush } = await import('./push');
    await expect(registerForPush()).resolves.toBeNull();
    expect(mocks.notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('handles unavailable FCM credentials without failing sign-in', async () => {
    mocks.notifications.getExpoPushTokenAsync.mockRejectedValue(new Error('FCM unavailable'));
    const { registerForPush } = await import('./push');
    await expect(registerForPush()).resolves.toBeNull();
    expect(mocks.push.register).not.toHaveBeenCalled();
  });

  it('removes the registered token on sign-out', async () => {
    const { registerForPush, unregisterForPush } = await import('./push');
    await registerForPush();
    await unregisterForPush();
    await unregisterForPush();
    expect(mocks.push.forget).toHaveBeenCalledTimes(1);
    expect(mocks.push.forget).toHaveBeenCalledWith({ token: 'ExponentPushToken[test]', platform: 'android' });
  });
});
