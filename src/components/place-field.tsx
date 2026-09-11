import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { FocusablePressable, GimikIcon, SearchField, Txt } from '@/components/ui';
import { newSearchSession, placeLabel, searchPlaces, type PlacePick } from '@/lib/places';
import { C } from '@/lib/tokens';

const DEBOUNCE_MS = 350;

/**
 * "Which 5-star restaurant?" - the answer, as a control. Type a real place
 * name, pick from live suggestions, and the selection collapses to one row
 * with a clear affordance. Free text still counts: whatever is typed is the
 * place if nothing is picked.
 */
export function PlaceField({ value, onChange }: {
  value: string;
  onChange: (place: string) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlacePick[]>([]);
  const [searching, setSearching] = useState(false);
  const [needsPlus, setNeedsPlus] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // One token for one search. The provider bills a session rather than a
  // request, so every keystroke that shares this is a single charge; it is
  // replaced when a place is picked, which is what ends the session.
  const session = useRef(newSearchSession());

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const type = (text: string) => {
    setQuery(text);
    onChange(text.trim());
    if (timer.current) clearTimeout(timer.current);
    const q = text.trim();
    if (q.length < 3) { setResults([]); setSearching(false); setNeedsPlus(false); return; }
    setSearching(true);
    timer.current = setTimeout(() => {
      void searchPlaces(q, session.current).then((found) => {
        setResults(found.picks);
        setNeedsPlus(found.needsPlus);
        setSearching(false);
      });
    }, DEBOUNCE_MS);
  };

  const pick = (item: PlacePick) => {
    onChange(placeLabel(item));
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
        <FocusablePressable accessibilityRole="button" accessibilityLabel={t('s.place.clear')} onPress={() => { onChange(''); setQuery(''); }} className="p-1 active:opacity-60">
          <GimikIcon name="close" size={14} color={C.inkMuted} />
        </FocusablePressable>
      </View>
    );
  }

  return (
    <View>
      <SearchField placeholder={t('s.place.searchPh')} value={query} onChangeText={type} autoCorrect={false} />
      {searching ? (
        <View className="py-3 items-center"><ActivityIndicator size="small" color={C.inkMuted} /></View>
      ) : null}
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
    </View>
  );
}
