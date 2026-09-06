import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { hasApi } from './client';
import { push } from './endpoints';

/**
 * Being reachable when the app is closed.
 *
 * Everything the product does socially waits on somebody answering: an invite,
 * a message, a friend request. Ably carries those to a running app and nowhere
 * else, so until now an answer arrived only if the other person happened to be
 * looking at Gora already - and invites lapse after a week.
 *
 * Three things worth knowing about this file:
 *
 * **Permission is asked once, and never at launch.** A cold permission prompt on
 * first open is the one people decline out of hand. This runs after sign-in,
 * when there is an account and a notification has something to be about.
 *
 * **It is safe to call repeatedly.** Expo can rotate a token at any time, and a
 * stale one is somebody who quietly stops hearing from the app - so the client
 * presents whatever it holds on every start rather than only when it changes.
 *
 * **It never throws.** An emulator, a declined prompt, no projectId in a bare
 * build - all ordinary. Notifications are a courtesy; failing to arrange them
 * must not take the screen down with them.
 */

/** How a notification behaves when it lands while the app is foregrounded. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // Banner and sound even in-app: the realtime layer has already refetched
    // the data, but a message landing while you are on another screen is still
    // news, and the alternative is a silent change nobody notices.
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let registered: string | null = null;

/**
 * Ask, obtain a token, and tell the server. Returns the token, or null when
 * notifications are not available - a normal outcome, not a failure.
 */
export async function registerForPush(): Promise<string | null> {
  if (!hasApi || !Device.isDevice) return null;
  try {
    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;
    if (!granted && existing.canAskAgain) {
      granted = (await Notifications.requestPermissionsAsync()).granted;
    }
    if (!granted) return null;

    if (Platform.OS === 'android') {
      // Android needs the channel to exist before anything can be delivered to
      // it, and the id has to match what the server sends ("default").
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Gora',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 180, 90, 180],
      });
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    if (!token) return null;
    await push.register({ token, platform: Platform.OS });
    registered = token;
    return token;
  } catch {
    // Declined, offline, an emulator - and on Android, an app without FCM
    // credentials, which is the usual reason in development:
    //
    //   Unable to get Firebase Messaging instance. Did you configure
    //   `googleServicesFile` path in app config?
    //
    // Expo push on Android needs a google-services.json from a Firebase
    // project, referenced as android.googleServicesFile, and the FCM key
    // uploaded to Expo. Until that exists this returns null on every start and
    // the app is simply unreachable when closed - which is a missing
    // credential, not a broken client, and not worth a crash or a warning on
    // somebody's screen either way.
    return null;
  }
}

/**
 * Stop reaching this handset. Called on sign-out.
 *
 * Keyed on the token rather than the account on purpose: signing out of a phone
 * you borrowed should stop that phone, not every device you own.
 */
export async function unregisterForPush(): Promise<void> {
  if (!registered) return;
  const token = registered;
  registered = null;
  try {
    await push.forget({ token, platform: Platform.OS });
  } catch {
    // The row is stale rather than wrong; the server prunes what Expo rejects.
  }
}
