import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { Platform, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppleButton, GoogleButton } from '@/components/auth-buttons';
import { ApiError, NetworkError } from '@/lib/api';
import { hasApi, signUp, signInWithGoogle } from '@/lib/api/session';
import { GoogleCancelled, hasGoogleSignIn } from '@/lib/api/google';
import { InterestBank } from '@/components/interest-bank';
import { SomedayTile } from '@/components/someday-tile';
import { Avatar, Chip, Field, GhostButton, IconButton, InlineNotice, PrimaryButton, SearchField, SecondaryButton, Txt } from '@/components/ui';
import { addProfilePhoto, keep, updateProfile } from '@/lib/actions';
import { PH_CITIES } from '@/lib/cities';
import { useDeck } from '@/lib/feed';
import { interestCategories } from '@/lib/interests';
import { keyboardFooterLayout } from '@/lib/keyboard-layout';
import { WANTS } from '@/lib/mock';
import { PHOTO } from '@/lib/photos';
import { useApp, type Gender } from '@/store';

type Step = 'story' | 'account' | 'profile' | 'photo' | 'city' | 'about' | 'interests' | 'picks';
const ORDER: Step[] = ['story', 'account', 'profile', 'photo', 'city', 'about', 'interests', 'picks'];
/** How many somedays the starter grid offers. Three is the minimum to continue. */
const STARTER_PICKS = 12;
/** Nothing is decided or stale during onboarding; the deck starts empty. */
const NOTHING: ReadonlySet<string> = new Set();
const STORY = [
  { key: 'keep', photo: PHOTO.surf },
  { key: 'seen', photo: PHOTO.market },
  { key: 'lock', photo: PHOTO.summit },
] as const;

/**
 * The corpus order: three-page story -> account -> name, birthday, gender
 * (fixed after this) -> first photo -> city -> interests -> starter picks ->
 * the deck, picks already kept.
 */
export default function Onboarding() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ step?: Step }>();
  const insets = useSafeAreaInsets();
  const update = useApp((s) => s.updateProfile);
  const setOnboarded = useApp((s) => s.setOnboarded);
  const [step, setStep] = useState<Step>(params.step && ORDER.includes(params.step) ? params.step : 'story');
  const [page, setPage] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const footerPaddingBottom = insets.bottom + 12;
  const keyboardFooter = keyboardFooterLayout(footerHeight, footerPaddingBottom);
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);

  /**
   * Google covers signing up as well as signing in - the server decides which
   * it was - so this skips the rest of the form and lands on the deck. The
   * profile steps stay reachable later from Edit profile.
   */
  const withGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.replace('/(tabs)/home' as never);
    } catch (cause) {
      if (cause instanceof GoogleCancelled) return;
      if (cause instanceof NetworkError) setError(t('s.onboarding.account.failed'));
      else setError(t('s.onboarding.account.failed'));
    } finally {
      setBusy(false);
    }
  };
  const [cityQuery, setCityQuery] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [work, setWork] = useState('');
  const [education, setEducation] = useState('');
  const [needs, setNeeds] = useState<string[]>([]);
  /**
   * The starter grid, live. Empty in demo builds and until the first page
   * lands, which is what the bundled fallback below is for. By the time this
   * step is reached the interests have already been PATCHed, so the ranking
   * behind it has them.
   */
  const starter = useDeck('All', NOTHING as Set<string>, NOTHING as Set<string>);
  // The deck's first page lands the moment the account exists - before the
  // interests step - so it was ranked with no interests at all and read as A-Z.
  // Re-rank once on arrival, now that the PATCH has gone through.
  const refreshStarter = starter.retry;
  useEffect(() => {
    if (step === 'picks') refreshStarter();
    // Only on arriving at the step; retry is a fresh function every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  const [picks, setPicks] = useState<string[]>([]);
  const index = ORDER.indexOf(step);

  const cities = useMemo(() => {
    const needle = cityQuery.trim().toLowerCase();
    return PH_CITIES.filter((item) => !needle || item.name.toLowerCase().includes(needle) || item.province.toLowerCase().includes(needle)).slice(0, 12);
  }, [cityQuery]);
  const suggestions = useMemo(() => {
    // Live, the starter grid comes from the ranked deck rather than the bundled
    // sample. Two reasons, and the second is the important one: it is the same
    // cold-start ranking the deck uses, already spread across categories - and
    // it registers each someday's server id on the way through. Keeping a
    // bundled row whose id the directory has never seen writes to the store and
    // silently skips the sync, which is how someone's first twelve keeps - the
    // strongest signal the account will ever produce - used to reach the phone
    // and never the server.
    if (starter.cards.length) return starter.cards.slice(0, STARTER_PICKS);

    const cats = interestCategories(needs);
    const pool = WANTS.filter((want) => want.slug);
    if (cats.size) {
      const scored = pool.map((want) => ({
        want,
        score: (cats.has(want.category) ? 2 : 0) + want.needs.filter((need) => needs.includes(need)).length,
      }));
      return scored.sort((a, b) => b.score - a.score).slice(0, STARTER_PICKS).map((item) => item.want);
    }
    // No interests picked: round-robin the categories so the starter grid
    // shows the breadth of the catalog, not twelve versions of one idea.
    const byCategory = new Map<string, typeof pool>();
    for (const want of pool) {
      const bucket = byCategory.get(want.category) ?? [];
      bucket.push(want);
      byCategory.set(want.category, bucket);
    }
    const buckets = [...byCategory.values()];
    const spread: typeof pool = [];
    for (let round = 0; spread.length < STARTER_PICKS; round += 1) {
      let added = false;
      for (const bucket of buckets) {
        if (bucket[round]) {
          spread.push(bucket[round]);
          added = true;
          if (spread.length === 12) break;
        }
      }
      if (!added) break;
    }
    return spread;
  }, [needs, starter.cards]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 0.85 });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  };

  /**
   * The account is created the moment there is enough to create it - name,
   * birthday and gender are the last required fields, and they are fixed at
   * sign-up anyway. Registering here rather than at the end means a taken
   * email is discovered before someone has picked twelve somedays, and every
   * step after this one writes straight through to the server.
   */
  const register = async () => {
    setBusy(true);
    setError(null);
    try {
      await signUp({ email, password, name: name.trim(), birthday: birthday || null, gender });
      return true;
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.status === 409 ? t('s.onboarding.account.taken') : cause.detail ?? t('s.onboarding.account.failed'));
      } else if (cause instanceof NetworkError) {
        setError(t('s.signIn.offlineBody'));
      } else {
        setError(t('s.onboarding.account.failed'));
      }
      return false;
    } finally {
      setBusy(false);
    }
  };

  const next = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      // Registration owns fixed fields and the server-assigned handle.
      if (step === 'profile') {
        if (hasApi) {
          if (!(await register())) return;
        } else {
          update({ name: name.trim(), handle: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'gimik', birthday: birthday || null, gender });
        }
      }
      if (step === 'photo' && photo && photo !== uploadedPhoto) {
        if (!(await addProfilePhoto(photo))) {
          setError(t('s.toasts.photoFailed'));
          return;
        }
        setUploadedPhoto(photo);
      }
      const patch = step === 'city' ? { city }
        : step === 'about' ? { bio: bio.trim(), work: work.trim(), education: education.trim() }
          : step === 'interests' ? { interests: needs } : null;
      if (patch && !(await updateProfile(patch))) {
        setError(t('s.toasts.syncFailed'));
        return;
      }
      if (step === 'picks') {
        picks.forEach((id) => keep(id));
        setOnboarded(true);
        router.replace('/(tabs)/home' as never);
        return;
      }
      setStep(ORDER[index + 1]);
    } finally {
      setBusy(false);
    }
  };
  // Once registered, fixed identity cannot be edited or registered a second time.
  const canGoBack = !busy && !(hasApi && step === 'photo');
  const back = () => { if (canGoBack) { setError(null); if (index === 0) router.back(); else setStep(ORDER[index - 1]); } };
  const valid = step === 'account' ? email.includes('@') && email.includes('.') && password.length >= 8 : step === 'profile' ? name.trim().length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(birthday) && gender !== null : step === 'photo' ? photo !== null : step === 'city' ? Boolean(city) : step === 'picks' ? picks.length >= 3 : true;

  // The story is its own full-bleed room; the form steps share the framed one.
  if (step === 'story') {
    const current = STORY[page];
    const advance = () => (page < STORY.length - 1 ? setPage(page + 1) : next());
    return (
      <View className="flex-1 bg-brand-night">
        <Image source={current.photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={220} />
        <View style={StyleSheet.absoluteFill} className="bg-brand-night/55" />
        <View className="flex-1 justify-between px-6" style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}>
          <View className="flex-row items-center justify-between">
            <IconButton icon="back" label={t('s.common.back')} tone="glass" onPress={() => (page ? setPage(page - 1) : router.back())} />
            {/* On the last page Skip and the main button do the same thing. */}
            {page < STORY.length - 1 ? <GhostButton label={t('s.story.skip')} tone="white" onPress={next} /> : null}
          </View>
          <View>
            <View className="flex-row gap-1 mb-5">
              {STORY.map((item, i) => <View key={item.key} className={`flex-1 h-1 rounded-full ${i <= page ? 'bg-brand-paper' : 'bg-brand-paper/30'}`} />)}
            </View>
            <Txt variant="display" className="text-brand-paper">{t(`s.story.${current.key}.title`)}</Txt>
            <Txt variant="body" className="text-brand-paper/85 mt-3 mb-8">{t(`s.story.${current.key}.body`)}</Txt>
            <PrimaryButton label={page < STORY.length - 1 ? t('s.story.next') : t('s.welcome.start')} icon="arrow-right" onPress={advance} />
          </View>
        </View>
      </View>
    );
  }

  const formIndex = index - 1;
  const formCount = ORDER.length - 1;

  // Short forms carry their button under the last field, like sign-in. The two
  // long lists keep it pinned, so it stays reachable without scrolling the list.
  const inlineAction = step !== 'interests' && step !== 'picks';
  // No Skip: every optional step already continues with nothing filled in, so a
  // second button that does the same thing only asks which one to press.
  const action = (
    <PrimaryButton
      label={step === 'picks' ? t('s.onboarding.buildList') : t('s.onboarding.continue')}
      icon="arrow-right"
      disabled={!valid || busy}
      state={busy ? 'loading' : 'idle'}
      onPress={() => void next()}
    />
  );

  return (
    <View className="flex-1 bg-brand-paper" style={{ paddingTop: insets.top }}>
      <View className="px-5 flex-row items-center">
        <IconButton icon="back" label={t('s.common.back')} disabled={!canGoBack} onPress={back} />
        <View className="flex-1 flex-row gap-1 ml-4">
          {Array.from({ length: formCount }, (_, i) => <View key={i} className={`flex-1 h-1 rounded-full ${i <= formIndex ? 'bg-brand-ink' : 'bg-brand-rule'}`} />)}
        </View>
      </View>
      <KeyboardAwareScrollView style={{ flex: 1 }} bottomOffset={keyboardFooter.inputClearance} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {error ? <View className="mb-4"><InlineNotice tone="error" title={t('s.onboarding.account.failedTitle')} body={error} /></View> : null}
        {step === 'account' ? (
          <View>
            <Txt variant="title">{t('s.onboarding.account.title')}</Txt>
            <Txt variant="body" className="mt-2 mb-6">{t('s.onboarding.account.body')}</Txt>
            <Field label={t('s.onboarding.account.email')} placeholder={t('s.onboarding.account.emailPh')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} spacing="compact" />
            <Field
              label={t('s.onboarding.account.password')}
              hint={t('s.onboarding.account.passwordHint')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              spacing="compact"
            />
            <View className="mt-2">{action}</View>
            <View className="flex-row items-center my-5"><View className="flex-1 h-px bg-brand-rule" /><Txt variant="caption" className="mx-3">{t('s.onboarding.account.or')}</Txt><View className="flex-1 h-px bg-brand-rule" /></View>
            {/* Google is live once a client id is built in. Apple stays
                disabled and still says so, because faking a button that skips
                the form while pretending to authenticate is worse than waiting.
                Android never gets Apple at all: there it is not "coming", it is absent. */}
            <GoogleButton
              label={t('s.onboarding.account.google')}
              disabled={!hasGoogleSignIn || busy}
              onPress={() => void withGoogle()}
            />
            {Platform.OS === 'ios' ? (
              <View className="mt-2"><AppleButton label={t('s.onboarding.account.apple')} disabled onPress={() => {}} /></View>
            ) : null}
            {!hasGoogleSignIn ? (
              <Txt variant="caption" className="mt-2 text-center">{t('s.onboarding.account.socialSoon')}</Txt>
            ) : null}
          </View>
        ) : null}
        {step === 'profile' ? (
          <View>
            <Txt variant="title">{t('s.onboarding.profile.title')}</Txt>
            <Txt variant="body" className="mt-2 mb-6">{t('s.onboarding.profile.body')}</Txt>
            <Field label={t('s.onboarding.profile.firstName')} placeholder={t('s.onboarding.profile.firstNamePh')} value={name} onChangeText={setName} autoCapitalize="words" spacing="compact" />
            <Field label={t('s.onboarding.profile.birthday')} placeholder={t('s.onboarding.profile.birthdayPh')} hint={t('s.onboarding.profile.birthdayHint')} value={birthday} onChangeText={setBirthday} keyboardType="numbers-and-punctuation" spacing="compact" />
            <Txt variant="eyebrow" className="mb-2">{t('s.onboarding.profile.gender')}</Txt>
            <View className="flex-row gap-2">
              {(['woman', 'man', 'nonbinary'] as Gender[]).map((value) => <Chip key={value} label={t(`s.onboarding.profile.${value}`)} selected={gender === value} onPress={() => setGender(value)} />)}
            </View>
          </View>
        ) : null}
        {step === 'photo' ? (
          <View className="items-center">
            <Txt variant="title" className="self-start">{t('s.onboarding.photo.title')}</Txt>
            <Txt variant="body" className="self-start mt-2 mb-8">{t('s.onboarding.photo.body')}</Txt>
            {photo ? <Image source={photo} style={{ width: 200, height: 250, borderRadius: 4 }} contentFit="cover" /> : <Avatar name={name || t('s.common.you')} size={140} />}
            <View className="mt-6 self-stretch"><SecondaryButton label={photo ? t('s.onboarding.photo.change') : t('s.onboarding.photo.choose')} onPress={() => void pickPhoto()} /></View>
          </View>
        ) : null}
        {step === 'city' ? (
          <View>
            <Txt variant="title">{t('s.onboarding.city.title')}</Txt>
            <Txt variant="body" className="mt-2 mb-5">{t('s.onboarding.city.body')}</Txt>
            <SearchField placeholder={t('s.onboarding.city.searchPh')} value={cityQuery} onChangeText={setCityQuery} autoCapitalize="none" />
            <View className="flex-row flex-wrap gap-2 mt-4">
              {cities.map((item) => <Chip key={item.name} label={item.name} selected={city === item.name} onPress={() => setCity(item.name)} />)}
            </View>
          </View>
        ) : null}
        {step === 'about' ? (
          <View>
            <Txt variant="title">{t('s.onboarding.about.title')}</Txt>
            <Txt variant="body" className="mt-2 mb-6">{t('s.onboarding.about.body')}</Txt>
            <Field label={t('s.editProfile.about')} placeholder={t('s.editProfile.aboutPh')} value={bio} onChangeText={setBio} multiline spacing="compact" />
            <Field label={t('s.editProfile.work')} placeholder={t('s.editProfile.workPh')} value={work} onChangeText={setWork} spacing="compact" />
            <Field label={t('s.editProfile.education')} placeholder={t('s.editProfile.educationPh')} value={education} onChangeText={setEducation} spacing="compact" />
          </View>
        ) : null}
        {step === 'interests' ? (
          <View>
            <Txt variant="title">{t('s.onboarding.interests.title')}</Txt>
            <Txt variant="body" className="mt-2 mb-5">{t('s.onboarding.interests.body')}</Txt>
            <InterestBank selected={needs} onChange={setNeeds} />
          </View>
        ) : null}
        {step === 'picks' ? (
          <View>
            <Txt variant="title">{t('s.onboarding.picks.title')}</Txt>
            <Txt variant="body" className="mt-2 mb-5">{t('s.onboarding.picks.body', { count: picks.length })}</Txt>
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              {suggestions.map((want) => (
                <View key={want.id} style={{ width: '47%' }}>
                  <SomedayTile want={want} selected={picks.includes(want.id)} onPress={() => setPicks((current) => current.includes(want.id) ? current.filter((id) => id !== want.id) : [...current, want.id])} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {inlineAction && step !== 'account' ? <View className="mt-6">{action}</View> : null}
      </KeyboardAwareScrollView>
      {inlineAction ? null : (
      <KeyboardStickyView offset={{ opened: keyboardFooter.openedOffset }}>
      <View onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)} className="px-5 pt-3 border-t border-brand-rule bg-brand-paper" style={{ paddingBottom: footerPaddingBottom }}>
        {action}
      </View>
      </KeyboardStickyView>
      )}
    </View>
  );
}
