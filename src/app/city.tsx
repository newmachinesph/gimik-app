import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, View } from 'react-native';
import { toast } from 'sonner-native';

import { GimikIcon, NavRow, Screen, SearchField, TopBar, Txt } from '@/components/ui';
import { updateProfile as update } from '@/lib/actions';
import { CITY_REGIONS, PH_CITIES } from '@/lib/cities';
import { C } from '@/lib/tokens';
import { useApp } from '@/store';

/** Philippine cities only, grouped by island region. Picks the location by
 * default; `?field=hometown` points the same list at where you grew up. */
export default function CityPicker() {
  const { t } = useTranslation();
  const { field } = useLocalSearchParams<{ field?: string }>();
  const forHometown = field === 'hometown';
  const city = useApp((state) => (forHometown ? state.profile.hometown : state.profile.city));
  const [query, setQuery] = useState('');
  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return CITY_REGIONS.map((region) => ({
      title: region,
      data: PH_CITIES.filter((item) => item.region === region && (!needle || item.name.toLowerCase().includes(needle) || item.province.toLowerCase().includes(needle))),
    })).filter((section) => section.data.length);
  }, [query]);

  return (
    <Screen inset={false} scroll={false}>
      <TopBar title={forHometown ? t('s.city.hometownTitle') : t('s.city.title')} />
      <View className="mb-3"><SearchField placeholder={t('s.city.searchPh')} value={query} onChangeText={setQuery} autoCapitalize="none" autoCorrect={false} autoFocus /></View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.name}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderSectionHeader={({ section }) => <Txt variant="eyebrow" className="pt-4 pb-2">{section.title}</Txt>}
        renderItem={({ item }) => (
          <View className="border-b border-brand-rule">
            <NavRow
              title={item.name}
              caption={item.province}
              chevron={false}
              trailing={item.name === city ? <GimikIcon name="check" size={18} color={C.ink} weight="bold" /> : undefined}
              onPress={() => {
                update(forHometown ? { hometown: item.name } : { city: item.name });
                toast(t(forHometown ? 's.toasts.hometownSet' : 's.toasts.citySet', { name: item.name }));
                router.back();
              }}
            />
          </View>
        )}
        ListEmptyComponent={<Txt variant="caption" className="pt-6">{t('s.city.empty')}</Txt>}
      />
    </Screen>
  );
}
