import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Button, FocusablePressable, GimikIcon, SearchField, Txt } from '@/components/ui';
import { newSearchSession, placeLabel, searchPlaces, type PlacePick } from '@/lib/places';
import { C } from '@/lib/tokens';

const DEBOUNCE_MS = 350;

/**
 * "Which 5-star restaurant?" - the answer, as a control. Type a real place
 * name, pick from live suggestions, and the selection collapses to one row
 * with a clear affordance. Free text still counts: whatever is typed is the
 * place if nothing is picked.
 */
export function PlaceField({ value, onChange, activity, onPick }: {
  value: string;
  onChange: (place: string) => void;
  activity?: string;
  onPick?: (place: PlacePick | null) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlacePick[]>([]);
  const [searching, setSearching] = useState(false);
  const [needsPlus, setNeedsPlus] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestState = useRef({ version: 0 });
  // Group autocomplete requests; this alone does not terminate a billable
  // Google session. Catalogue suggestions never call Google.
  const session = useRef(newSearchSession());

  useEffect(() => {
    const state = requestState.current;
    const version = ++state.version;
    if (activity) {
      void searchPlaces('', undefined, activity).then((found) => {
        if (version === state.version) setResults(found.picks);
      });
    }
    return () => {
      state.version++;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [activity]);

  const type = (text: string) => {
    setQuery(text);
    onChange(text.trim());
    onPick?.(null);
    const version = ++requestState.current.version;
    if (timer.current) clearTimeout(timer.current);
    const q = text.trim();
    if (q.length < 3) { setResults([]); setSearching(false); setNeedsPlus(false); return; }
    setSearching(true);
    timer.current = setTimeout(() => {
      void searchPlaces(q, session.current, activity).then((found) => {
        if (version !== requestState.current.version) return;
        setResults(found.picks);
        setNeedsPlus(found.needsPlus);
        setSearching(false);
      });
    }, DEBOUNCE_MS);
  };

  const pick = (item: PlacePick) => {
    requestState.current.version++;
    if (timer.current) clearTimeout(timer.current);
    setSearching(false);
    onChange(placeLabel(item));
    onPick?.(item);
    setQuery('');
    setResults([]);
    // The session ended the moment a place was chosen; the next search is a
    // new one and must not be billed against this token.
    session.current = newSearchSession();
  };

  // A picked (or fully typed) place shows as one quiet row, not a form.
  if (value && !query) {
    return (
      <View className="flex-row items-center bg-brand-paper-sunk rounded-[4px] px-3 py-3">
        <GimikIcon name="map-pin" size={16} color={C.ink} weight="fill" />
        <Txt variant="label" className="text-brand-ink flex-1 ml-2" numberOfLines={1}>{value}</Txt>
        <FocusablePressable accessibilityRole="button" accessibilityLabel={t('s.place.clear')} onPress={() => { onChange(''); onPick?.(null); setQuery(''); }} className="p-1 active:opacity-60">
          <GimikIcon name="close" size={14} color={C.inkMuted} />
        </FocusablePressable>
      </View>
    );
  }

  return (
    <View>
      <SearchField placeholder={t('s.place.searchPh')} value={query} onChangeText={type} autoCorrect={false} />
      <Txt variant="caption" className="mt-2">Place searches are saved privately to improve suggestions.</Txt>
      {searching ? (
        <View className="py-3 items-center"><ActivityIndicator size="small" color={C.inkMuted} /></View>
      ) : null}
      {results.some((item) => item.provider === 'google') ? <Txt variant="caption" className="mt-2">Google Maps</Txt> : null}
      {!searching && results.length ? (
        <View className="mt-2 border border-brand-rule rounded-[4px] overflow-hidden">
          {results.map((item, index) => (
            <FocusablePressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => pick(item)}
              className={`flex-row items-center px-3 py-3 active:opacity-70 ${index ? 'border-t border-brand-rule' : ''}`}
            >
              <GimikIcon name="map-pin" size={15} color={C.inkMuted} />
              <View className="flex-1 ml-2 min-w-0">
                <Txt variant="label" className="text-brand-ink" numberOfLines={1}>{item.name}</Txt>
                <Txt variant="caption" numberOfLines={1}>{item.area}</Txt>
              </View>
            </FocusablePressable>
          ))}
        </View>
      ) : null}
      {!searching && !results.length && query.trim().length >= 3 ? (
        <Txt variant="caption" className="mt-2">
          {t(needsPlus ? 's.place.plusOnly' : 's.place.freeText')}
        </Txt>
      ) : null}
      {!searching && needsPlus ? <Button label="Explore Gimik Plus" variant="ghost" onPress={() => router.push('/plus' as never)} /> : null}
    </View>
  );
}
