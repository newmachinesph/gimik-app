import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Switch, View } from 'react-native';
import { toast } from 'sonner-native';

import { VisibilityChips } from '@/components/visibility-chips';
import {
  Card,
  Chip,
  Divider,
  GhostButton,
  GoraIcon,
  NavRow,
  RowList,
  Screen,
  Section,
  SectionHead,
  TopBar,
  Txt,
} from '@/components/ui';
import { deleteAccount } from '@/lib/actions';
import { signOut } from '@/lib/api/session';
import * as WebBrowser from 'expo-web-browser';

import { DEMO } from '@/data/demo';
import { SITE_URL } from '@/lib/links';
import { C } from '@/lib/tokens';
import { useApp, type DemoState } from '@/store';

/** Defaults, quiet lists, and the way out. Nothing here is needed daily. */
/** Whatever the manifest says, so the footer cannot drift from the build. */
const APP_VERSION = Constants.expoConfig?.version ?? '';

export default function Settings() {
  const { t } = useTranslation();
  const demoState = useApp((s) => s.demoState);
  const source = useApp((s) => s.source);
  const hidden = useApp((s) => s.hiddenPeople);
  const unhide = useApp((s) => s.unhidePerson);
  const defaultVisibility = useApp((s) => s.defaultVisibility);
  const remember = useApp((s) => s.rememberVisibility);
  const setDefaultVisibility = useApp((s) => s.setDefaultVisibility);
  const loadDemo = useApp((s) => s.loadDemo);

  const states: { value: DemoState; label: string }[] = [
    { value: 'fresh', label: t('s.settings.developer.fresh') },
    { value: 'week-in', label: t('s.settings.developer.weekIn') },
    { value: 'veteran', label: t('s.settings.developer.veteran') },
  ];

  const confirm = (title: string, body: string, action: string, onPress: () => void) =>
    Alert.alert(title, body, [{ text: t('s.settings.keep'), style: 'cancel' }, { text: action, style: 'destructive', onPress }]);

  // Clears the stored tokens as well as the store: a signed-out device that
  // keeps a refresh token is still signed in as far as the server is concerned.
  const leave = () => {
    void signOut().finally(() => router.replace('/welcome' as never));
  };

  /**
   * Demo data and a live session are mutually exclusive.
   *
   * `loadDemo` flips the store to fabricated rows but leaves the auth token
   * where it is, which produced the worst of both: signed in, showing invented
   * data, realtime disconnected, and writes going nowhere. Signing out first
   * means "demo" always means exactly what it says.
   */
  const enterDemo = (state: DemoState, label: string) => {
    const load = () => {
      loadDemo(state, DEMO[state]());
      toast(t('s.toasts.demoLoaded', { state: label }));
    };
    if (source === 'api') void signOut().finally(load);
    else load();
  };

  // Deleting is not signing out. The confirmation promises the account and
  // everything hanging off it is gone, so the server is told before the device
  // forgets - and if that call fails, nothing is pretended to have happened.
  const destroy = () => {
    void deleteAccount()
      .then(() => signOut())
      .then(() => router.replace('/welcome' as never))
      .catch(() => toast(t('s.settings.deleteFailed')));
  };

  return (
    <Screen inset={false}>
      <TopBar title={t('s.settings.title')} />

      <Section>
        <SectionHead title={t('s.settings.newSomedays.title')} subtitle={t('s.settings.newSomedays.subtitle')} />
        <Card className="p-4">
          <VisibilityChips value={defaultVisibility} onChange={(next) => setDefaultVisibility(next, remember)} />
          <Divider className="my-4" />
          <View className="flex-row items-center">
            <View className="flex-1 pr-4">
              <Txt variant="label" className="text-brand-ink">{t('s.settings.askEveryKeep.title')}</Txt>
              <Txt variant="caption">{t('s.settings.askEveryKeep.body')}</Txt>
            </View>
            <Switch value={!remember} onValueChange={(value) => setDefaultVisibility(defaultVisibility, !value)} trackColor={{ true: C.ink, false: C.rule }} thumbColor={C.paper} />
          </View>
        </Card>
      </Section>

      <Section>
        <SectionHead title={t('s.settings.hidden.title')} subtitle={hidden.length ? t('s.settings.hidden.some') : t('s.settings.hidden.none')} />
        {hidden.length ? (
          <RowList>
            {hidden.map((name) => (
              <NavRow
                key={name}
                title={name}
                chevron={false}
                trailing={<Txt variant="caption">{t('s.settings.hidden.unhide')}</Txt>}
                onPress={() => { unhide(name); toast(t('s.toasts.unhidden', { name: name.split(' ')[0] })); }}
              />
            ))}
          </RowList>
        ) : null}
      </Section>

      <Section>
        <SectionHead title={t('s.settings.account')} />
        <RowList>
          <NavRow icon="people" title={t('s.settings.editProfile')} size="lg" onPress={() => router.push('/edit-profile' as never)} />
          <NavRow
            icon="close"
            title={t('s.settings.signOut')}
            size="lg"
            chevron={false}
            onPress={() => confirm(t('s.settings.signOutTitle'), t('s.settings.signOutBody'), t('s.settings.signOut'), leave)}
          />
          <NavRow
            icon="warning"
            tone="danger"
            title={t('s.settings.deleteAccount')}
            size="lg"
            chevron={false}
            onPress={() => confirm(t('s.settings.deleteTitle'), t('s.settings.deleteBody'), t('s.settings.delete'), destroy)}
          />
        </RowList>
      </Section>

      <Section>
        <SectionHead title={t('s.settings.legal.title')} />
        <RowList>
          {/* App Review requires a reachable privacy policy from inside any
              app that holds an account. Both open the marketing site rather
              than duplicating the text into the bundle, so one edit updates
              what every installed version shows. */}
          <NavRow
            icon="lock"
            title={t('s.settings.legal.privacy')}
            size="lg"
            onPress={() => { void WebBrowser.openBrowserAsync(`${SITE_URL}/privacy`); }}
          />
          <NavRow
            icon="info"
            title={t('s.settings.legal.terms')}
            size="lg"
            onPress={() => { void WebBrowser.openBrowserAsync(`${SITE_URL}/terms`); }}
          />
          <NavRow
            icon="help"
            title={t('s.settings.legal.support')}
            size="lg"
            onPress={() => { void WebBrowser.openBrowserAsync(`${SITE_URL}/support`); }}
          />
        </RowList>
      </Section>

      {__DEV__ ? (
        <Section>
          <SectionHead title={t('s.settings.developer.title')} subtitle={t('s.settings.developer.subtitle')} />
          <View className="flex-row gap-2">
            {states.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                selected={demoState === item.value}
                onPress={() => enterDemo(item.value, item.label)}
              />
            ))}
          </View>
          <View className="mt-4">
            <GhostButton
              label={t('s.settings.reset')}
              tone="muted"
              onPress={() => confirm(t('s.settings.resetTitle'), t('s.settings.resetBody'), t('s.settings.resetConfirm'), () => {
                void signOut().finally(() => {
                  toast(t('s.toasts.resetDone'));
                  router.replace('/welcome' as never);
                });
              })}
            />
          </View>
        </Section>
      ) : null}

      <View className="flex-row items-center mt-2">
        <GoraIcon name="info" size={14} color={C.inkMuted} />
        {/* The demo caveat is worth saying, because nothing on that build is
            real. Against a server there is nothing to warn about, so this is
            just the name and version - the endpoint is a developer's business,
            not a person's.

            The version is read from the manifest rather than written here. The
            line used to say "Gora v2 demo - flat data, no server" whatever the
            build was doing: v2 is the codebase generation, not the product,
            which shipped as 1.0.0, and the app had had a server for a while.
            Both halves of that were stale, which is what a hardcoded string
            does eventually. */}
        <Txt variant="caption" className="ml-2">
          {t(source === 'api' ? 's.settings.footerLive' : 's.settings.footer', { version: APP_VERSION })}
        </Txt>
      </View>
    </Screen>
  );
}
