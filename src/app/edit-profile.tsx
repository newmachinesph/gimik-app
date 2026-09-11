import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { toast } from 'sonner-native';

import {
  BottomSheet,
  Chip,
  Field,
  FocusablePressable,
  GimikIcon,
  PrimaryButton,
  Screen,
  Section,
  SectionHead,
  TopBar,
  Txt,
} from '@/components/ui';
import { addProfilePhoto, makePhotoFirst, removeProfilePhoto, updateProfile as update } from '@/lib/actions';
import { useProfileCompleteness } from '@/lib/completeness';
import { ageFrom } from '@/lib/format';
import { interestBadge } from '@/lib/interests';
import { genderMark } from '@/lib/people';
import { INTL_LANGUAGES, PH_LANGUAGES, POLITICS, RELIGIONS, languageLabel, politicsLabel, religionLabel } from '@/lib/profile-options';
import { C } from '@/lib/tokens';
import { useApp } from '@/store';

const MAX_PHOTOS = 8;

type SheetName = 'strength' | 'languages' | 'religion' | 'politics' | null;

/** A Bumble-style picker row: label left, current value + chevron right. */
function PickerRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <FocusablePressable accessibilityRole="button" onPress={onPress} className="flex-row items-center py-3 border-t border-brand-rule active:opacity-70">
      <View className="flex-1 min-w-0">
        <Txt variant="eyebrow">{label}</Txt>
        <Txt variant="label" className="text-brand-ink mt-1" numberOfLines={1}>{value}</Txt>
      </View>
      <GimikIcon name="chevron-right" size={16} color={C.inkMuted} />
    </FocusablePressable>
  );
}

/** Photos, strength, badges, and the optional shelves. The name never appears
 * as an input: declared once at sign-up, shown under "Fixed at sign-up". */
export default function EditProfile() {
  const { t } = useTranslation();
  const profile = useApp((s) => s.profile);
  const { steps, fraction } = useProfileCompleteness();
  const [bio, setBio] = useState(profile.bio);
  const [work, setWork] = useState(profile.work ?? '');
  const [education, setEducation] = useState(profile.education ?? '');
  const [sheet, setSheet] = useState<SheetName>(null);
  const [languages, setLanguages] = useState<string[]>(profile.languages ?? []);
  const percent = Math.round(fraction * 100);
  const interests = profile.interests ?? [];

  const addPhoto = async () => {
    if (profile.photos.length >= MAX_PHOTOS) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 0.85 });
    if (!result.canceled && result.assets[0]) await addProfilePhoto(result.assets[0].uri);
  };
  const photoActions = (uri: string) => {
    Alert.alert(t('s.editProfile.photoActions.title'), undefined, [
      ...(profile.photos[0] === uri ? [] : [{ text: t('s.editProfile.photoActions.makeFirst'), onPress: () => makePhotoFirst(uri) }]),
      { text: t('s.editProfile.photoActions.remove'), style: 'destructive' as const, onPress: () => removeProfilePhoto(uri) },
      { text: t('s.common.cancel'), style: 'cancel' as const },
    ]);
  };
  const slots: (string | null)[] = [...profile.photos, ...(profile.photos.length < MAX_PHOTOS ? [null] : [])];

  const toggleLanguage = (slug: string) =>
    setLanguages((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);

  return (
    <Screen inset={false} footer={<PrimaryButton label={t('s.common.save')} onPress={() => { update({ bio: bio.trim(), work: work.trim(), education: education.trim() }); toast(t('s.toasts.profileSaved')); router.back(); }} />}>
      <TopBar title={t('s.editProfile.title')} />

      {/* Profile strength - tap for the how-to, exactly like the ring elsewhere. */}
      <FocusablePressable accessibilityRole="button" accessibilityLabel={`${t('s.editProfile.strength.title')}, ${percent}%`} onPress={() => setSheet('strength')} className="mb-5 rounded-[4px] border border-brand-rule bg-brand-paper-sunk px-4 py-3 active:opacity-80">
        <View className="flex-row items-baseline justify-between">
          <Txt variant="label" className="text-brand-ink">{t('s.editProfile.strength.title')}</Txt>
          <Txt variant="label" className="text-brand-primary" style={{ fontFamily: 'Geist_700Bold' }}>{percent}%</Txt>
        </View>
        <View className="h-[6px] rounded-full bg-brand-rule mt-2 overflow-hidden">
          <View className="h-full rounded-full bg-brand-orange" style={{ width: `${Math.max(4, percent)}%` }} />
        </View>
        <Txt variant="caption" className="mt-2">{t('s.editProfile.strength.tip')}</Txt>
      </FocusablePressable>

      <View className="mb-2">
        <SectionHead title={t('s.editProfile.photos.title')} subtitle={t('s.editProfile.photos.subtitle')} />
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {slots.map((uri, index) => (
            <FocusablePressable key={uri ?? `empty-${index}`} accessibilityRole="button" onPress={() => (uri ? photoActions(uri) : void addPhoto())} style={{ width: '23%', aspectRatio: 4 / 5 }} className="rounded-[4px] overflow-hidden bg-brand-paper-sunk items-center justify-center active:opacity-75">
              {uri ? <Image source={uri} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <GimikIcon name={index === 0 ? 'camera' : 'plus'} size={20} color={C.inkMuted} />}
            </FocusablePressable>
          ))}
        </View>
      </View>

      <Section>
        <Field label={t('s.editProfile.about')} placeholder={t('s.editProfile.aboutPh')} value={bio} onChangeText={setBio} multiline />
        <Field label={t('s.editProfile.work')} placeholder={t('s.editProfile.workPh')} value={work} onChangeText={setWork} />
        <Field label={t('s.editProfile.education')} placeholder={t('s.editProfile.educationPh')} value={education} onChangeText={setEducation} />

        <PickerRow
          label={t('s.editProfile.interests.title')}
          value={interests.length ? `${interests.slice(0, 3).map((slug) => interestBadge(slug)).filter(Boolean).join('  ')}${interests.length > 3 ? `  +${interests.length - 3}` : ''}` : t('s.editProfile.notSet')}
          onPress={() => router.push('/interests' as never)}
        />
        <PickerRow label={t('s.editProfile.city')} value={profile.city ?? t('s.editProfile.chooseCity')} onPress={() => router.push('/city' as never)} />
        <PickerRow label={t('s.editProfile.hometown')} value={profile.hometown ?? t('s.editProfile.chooseHometown')} onPress={() => router.push('/city?field=hometown' as never)} />
        <PickerRow label={t('s.editProfile.languages')} value={(profile.languages ?? []).length ? (profile.languages ?? []).map((slug) => languageLabel(slug)).filter(Boolean).join(', ') : t('s.editProfile.notSet')} onPress={() => { setLanguages(profile.languages ?? []); setSheet('languages'); }} />
        <PickerRow label={t('s.editProfile.religion')} value={profile.religion ? religionLabel(profile.religion) ?? profile.religion : t('s.editProfile.preferNot')} onPress={() => setSheet('religion')} />
        <PickerRow label={t('s.editProfile.politics')} value={profile.politics ? politicsLabel(profile.politics) ?? profile.politics : t('s.editProfile.preferNot')} onPress={() => setSheet('politics')} />

        {/* Verification: promised, honestly. */}
        <FocusablePressable accessibilityRole="button" onPress={() => toast(t('s.toasts.comingSoon'))} className="flex-row items-center py-3 border-t border-brand-rule active:opacity-70">
          <GimikIcon name="success" size={18} color={C.inkMuted} />
          <Txt variant="label" className="text-brand-ink flex-1 ml-3">{t('s.editProfile.verification.title')}</Txt>
          <View className="rounded-full bg-brand-paper-sunk border border-brand-rule px-3 py-1">
            <Txt variant="caption">{t('s.editProfile.verification.soon')}</Txt>
          </View>
        </FocusablePressable>

        <View className="py-3 border-t border-brand-rule">
          <Txt variant="eyebrow">{t('s.editProfile.fixed')}</Txt>
          <Txt variant="label" className="mt-1 text-brand-ink">
            {profile.name || t('core.common.gimikMember')}{ageFrom(profile.birthday) ? `, ${ageFrom(profile.birthday)}` : ''} {profile.gender ? genderMark(profile.gender) : ''}
          </Txt>
        </View>
      </Section>

      {/* Strength: what fills the ring. */}
      <BottomSheet visible={sheet === 'strength'} onDismiss={() => setSheet(null)}>
        <Txt variant="eyebrow">{`${percent}%`}</Txt>
        <Txt variant="title" className="mt-1">{t('s.editProfile.strengthSheet.title')}</Txt>
        <Txt variant="caption" className="mt-1 mb-3">{t('s.editProfile.strengthSheet.body')}</Txt>
        {steps.map((step, index) => (
          <FocusablePressable
            key={step.label}
            accessibilityRole="button"
            disabled={step.done}
            onPress={() => { setSheet(null); router.push(step.href as never); }}
            className={`flex-row items-center py-3 active:opacity-70 ${index ? 'border-t border-brand-rule' : ''}`}
          >
            <GimikIcon name={step.done ? 'success' : 'circle'} size={18} color={step.done ? C.success : C.inkMuted} weight={step.done ? 'fill' : 'regular'} />
            <Txt variant="label" className={`flex-1 ml-3 ${step.done ? '' : 'text-brand-ink'}`}>{step.label}</Txt>
            {!step.done ? <GimikIcon name="chevron-right" size={16} color={C.inkMuted} /> : null}
          </FocusablePressable>
        ))}
      </BottomSheet>

      {/* Languages: PH first-class, internationals after, any mix. */}
      <BottomSheet visible={sheet === 'languages'} onDismiss={() => { update({ languages }); setSheet(null); }}>
        <Txt variant="title">{t('s.editProfile.languages')}</Txt>
        <Txt variant="eyebrow" className="mt-4 mb-2">{t('s.lang.ph')}</Txt>
        <View className="flex-row flex-wrap gap-2">
          {PH_LANGUAGES.map((option) => <Chip key={option.slug} label={option.label} selected={languages.includes(option.slug)} onPress={() => toggleLanguage(option.slug)} />)}
        </View>
        <Txt variant="eyebrow" className="mt-4 mb-2">{t('s.lang.intl')}</Txt>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {INTL_LANGUAGES.map((option) => <Chip key={option.slug} label={option.label} selected={languages.includes(option.slug)} onPress={() => toggleLanguage(option.slug)} />)}
        </View>
        <PrimaryButton label={t('s.common.done')} onPress={() => { update({ languages }); setSheet(null); }} />
      </BottomSheet>

      {/* Religion and politics: single pick, and "prefer not to say" always wins. */}
      <BottomSheet visible={sheet === 'religion'} onDismiss={() => setSheet(null)}>
        <Txt variant="title">{t('s.editProfile.religion')}</Txt>
        <View className="flex-row flex-wrap gap-2 mt-4 mb-2">
          {RELIGIONS.map((option) => (
            <Chip key={option.slug} label={option.label} selected={profile.religion === option.slug} onPress={() => { update({ religion: option.slug }); setSheet(null); }} />
          ))}
        </View>
        <Chip label={t('s.editProfile.preferNot')} selected={!profile.religion} onPress={() => { update({ religion: null }); setSheet(null); }} />
      </BottomSheet>

      <BottomSheet visible={sheet === 'politics'} onDismiss={() => setSheet(null)}>
        <Txt variant="title">{t('s.editProfile.politics')}</Txt>
        <View className="flex-row flex-wrap gap-2 mt-4 mb-2">
          {POLITICS.map((option) => (
            <Chip key={option.slug} label={option.label} selected={profile.politics === option.slug} onPress={() => { update({ politics: option.slug }); setSheet(null); }} />
          ))}
        </View>
        <Chip label={t('s.editProfile.preferNot')} selected={!profile.politics} onPress={() => { update({ politics: null }); setSheet(null); }} />
      </BottomSheet>
    </Screen>
  );
}
