import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { Card, Chip, Field, GhostButton, PrimaryButton, Screen, TopBar, Txt } from '@/components/ui';
import { createSomeday, keep, unkeep } from '@/lib/actions';
import { useBrowse } from '@/lib/browse';
import { categoryChip } from '@/lib/interests';
import { categoryLabel, wantTitle, type Category } from '@/lib/mock';
import { CANONICAL_CATEGORIES } from '@/lib/taxonomy';

/** How many catalog matches to offer before the "or write your own" line. */
const MAX_MATCHES = 5;
/** Below this a search is too vague to be worth sending. */
const MIN_QUERY = 3;

/**
 * Type a sentence. The catalog matches it, and if it does not, you write it.
 *
 * The matching half searches the whole catalog rather than the bundled sample:
 * with 2,522 concepts the odds are good that what someone is typing already
 * exists, and offering the real thing is better than making them author a
 * duplicate of it.
 *
 * The writing half is the point though. The catalog will never contain "drive
 * to my lola's town and find the bakery she talks about", and a screen that
 * answers a sentence like that with "no match" is a dead end at exactly the
 * moment someone has told you what they actually want. What they write becomes
 * a someday they own, kept, and - depending on who they open it to - something
 * their friends can be shown and can ask to join.
 */
export default function Create() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [category, setCategory] = useState<string>(CANONICAL_CATEGORIES[0]);
  const [writing, setWriting] = useState(false);
  const [busy, setBusy] = useState(false);

  const typed = text.trim();
  const searchable = typed.length >= MIN_QUERY;
  const { results, loading } = useBrowse(searchable ? typed : '', 'All');
  const matches = searchable ? results.slice(0, MAX_MATCHES) : [];

  const keepExisting = (id: string, title: string) => {
    keep(id);
    toast(t('s.toasts.kept', { title }), {
      action: { label: t('s.common.undo'), onClick: () => unkeep(id) },
    });
    router.back();
  };

  const write = async () => {
    setBusy(true);
    const id = await createSomeday(typed, category);
    setBusy(false);
    if (!id) return; // createSomeday has already said what went wrong.
    toast(t('s.toasts.kept', { title: typed }), {
      action: { label: t('s.common.undo'), onClick: () => unkeep(id) },
    });
    router.back();
  };

  return (
    <Screen inset={false}>
      <TopBar title="" />
      <Txt variant="eyebrow">{t('s.create.eyebrow')}</Txt>
      <Txt variant="title" className="mt-1">{t('s.create.title')}</Txt>
      <Txt variant="body" className="mt-2 mb-6">{t('s.create.body')}</Txt>
      <Field
        placeholder={t('s.create.ph')}
        value={text}
        onChangeText={(next) => { setText(next); setWriting(false); }}
        autoFocus
        spacing="compact"
      />

      {matches.length && !writing ? (
        <Card className="px-4 mb-4">
          {matches.map((want) => (
            <View key={want.id} className="py-3 border-b border-brand-rule">
              <PrimaryButton
                label={t('s.create.keepQuoted', { title: wantTitle(want) })}
                onPress={() => keepExisting(want.id, wantTitle(want))}
              />
            </View>
          ))}
        </Card>
      ) : null}

      {searchable && loading && !writing ? (
        <Txt variant="caption" className="mb-3">{t('s.create.searching')}</Txt>
      ) : null}

      {/* Always reachable once there is a sentence: the catalog having a near
          match is not a reason to refuse someone their own words. */}
      {searchable && !loading ? (
        writing ? (
          <View>
            <Txt variant="caption" className="mb-2">{t('s.create.whichShelf')}</Txt>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {CANONICAL_CATEGORIES.map((item) => (
                <Chip
                  key={item}
                  label={categoryChip(item, categoryLabel(item as Category))}
                  selected={category === item}
                  onPress={() => setCategory(item)}
                />
              ))}
            </View>
            <PrimaryButton
              label={busy ? t('s.create.adding') : t('s.create.addQuoted', { title: typed })}
              disabled={busy}
              onPress={() => void write()}
            />
          </View>
        ) : (
          <View className="mt-1">
            {matches.length ? (
              <Txt variant="caption" className="mb-2">{t('s.create.orYourOwn')}</Txt>
            ) : (
              <Txt variant="caption" className="mb-2">{t('s.create.noMatch')}</Txt>
            )}
            <GhostButton label={t('s.create.writeIt')} onPress={() => setWriting(true)} />
          </View>
        )
      ) : null}
    </Screen>
  );
}
