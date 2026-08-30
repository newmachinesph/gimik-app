import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SomedayRow } from '@/components/someday-row';
import { EmptyState, NavRow, RowList, Screen, ScreenHeader, Section, SectionHead } from '@/components/ui';
import { countdown } from '@/lib/format';
import { useMine } from '@/lib/somedays';
import { useUnreadThreads } from '@/lib/threads';
import { useApp } from '@/store';

/** What's happening with my somedays? Locked, waiting, done, messages. */
export default function Activity() {
  const { t } = useTranslation();
  const { locked, waiting, done } = useMine();
  const plans = useApp((state) => state.plans);
  const unread = useUnreadThreads();
  const empty = !locked.length && !waiting.length && !done.length;

  return (
    <Screen>
      <ScreenHeader title={t('s.activity.title')} subtitle={t('s.activity.subtitle')} />

      <RowList className="mb-6">
        <NavRow
          icon="chat"
          title={t('s.common.messages')}
          badge={unread}
          size="lg"
          onPress={() => router.push('/messages' as never)}
        />
      </RowList>

      {empty ? (
        <EmptyState icon="calendar" title={t('s.activity.empty.title')} body={t('s.activity.empty.body')} action={t('s.activity.empty.action')} onAction={() => router.push('/(tabs)/home' as never)} />
      ) : null}

      {locked.length ? (
        <Section>
          <SectionHead title={t('s.activity.locked.title')} subtitle={t('s.activity.locked.subtitle')} />
          <RowList>
            {locked.map((want) => (
              <SomedayRow
                key={want.id}
                want={want}
                accent
                line={`${countdown(plans[want.id].date)}${plans[want.id].people.length ? ` \u00B7 ${t('s.activity.withNames', { names: plans[want.id].people.join(', ') })}` : ''}`}
                onPress={() => router.push(`/plan/${want.id}` as never)}
              />
            ))}
          </RowList>
        </Section>
      ) : null}

      {waiting.length ? (
        <Section>
          <SectionHead title={t('s.activity.waiting.title')} subtitle={t('s.activity.waiting.subtitle', { count: waiting.length })} />
          <RowList>
            {waiting.map((want) => (
              <SomedayRow key={want.id} want={want} line={t('s.activity.keptNoDate')} onPress={() => router.push(`/want/${want.id}` as never)} />
            ))}
          </RowList>
        </Section>
      ) : null}

      {done.length ? (
        <Section>
          <SectionHead title={t('s.activity.doneSection.title')} subtitle={t('s.activity.doneSection.subtitle')} action={t('s.activity.doneSection.all')} onAction={() => router.push('/(tabs)/profile' as never)} />
          <RowList>
            {done.slice(0, 3).map((want) => (
              <SomedayRow key={want.id} want={want} line={t('s.activity.doneLine')} onPress={() => router.push(`/journal/${want.id}` as never)} />
            ))}
          </RowList>
        </Section>
      ) : null}
    </Screen>
  );
}
