import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, useWindowDimensions, View } from 'react-native';

import { SomedayTile } from '@/components/someday-tile';
import {
  EmptyState,
  FilterBar,
  IconButton,
  Screen,
  ScreenHeader,
  SearchField,
  TAB_BAR_CLEARANCE,
  Txt,
} from '@/components/ui';
import { categoryChip } from '@/lib/interests';
import { CATEGORIES, categoryLabel, WANTS, wantTitle, type Category } from '@/lib/mock';

/** What could I want? Search, category chips, the whole catalog. Nothing else. */
export default function Discover() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const tileWidth = (Math.min(width, 760) - 40 - 12) / 2;

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return WANTS.filter((want) =>
      (category === 'All' || want.category === category)
      && (!needle || wantTitle(want).toLowerCase().includes(needle) || want.title.toLowerCase().includes(needle)));
  }, [category, query]);

  const header = (
    <View>
      <ScreenHeader
        title={t('s.discover.title')}
        subtitle={t('s.discover.subtitle')}
        right={<IconButton icon="plus" label={t('s.discover.add')} onPress={() => router.push('/create')} />}
      />
      <SearchField placeholder={t('s.discover.searchPh')} value={query} onChangeText={setQuery} />
      <View className="mt-3 mb-4">
        <FilterBar
          options={[...CATEGORIES]}
          value={category}
          labelForOption={(option) => categoryChip(option, categoryLabel(option as Category))}
          onChange={(next) => setCategory(next as Category)}
          filtersActive={category !== 'All' || query.trim() !== ''}
          onFilter={() => { setCategory('All'); setQuery(''); }}
        />
      </View>
      <Txt variant="caption" className="mb-3">{t('s.discover.count', { count: results.length })}</Txt>
    </View>
  );

  return (
    <Screen scroll={false}>
      {/* Windowed rather than clipped. `removeClippedSubviews` detaches a view
          the Fabric renderer still owns, and the surface dies with "child
          already has a parent" - the windowing props below are the lazy
          loading, and are the whole of it. */}
      <FlatList
        data={results}
        numColumns={2}
        keyExtractor={(want) => want.id}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, paddingBottom: TAB_BAR_CLEARANCE }}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title={t('s.discover.empty.title')}
            body={t('s.discover.empty.body')}
            action={query.trim() || category !== 'All' ? t('s.discover.empty.action') : undefined}
            onAction={() => { setCategory('All'); setQuery(''); }}
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={3}
        renderItem={({ item }) => (
          <View style={{ width: tileWidth }}>
            <SomedayTile want={item} onPress={() => router.push(`/want/${item.id}` as never)} />
          </View>
        )}
      />
    </Screen>
  );
}
