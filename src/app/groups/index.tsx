import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import {
  EmptyState,
  Field,
  GoraIcon,
  NavRow,
  PrimaryButton,
  RowList,
  Screen,
  Section,
  SectionHead,
  TopBar,
} from '@/components/ui';
import { createGroup } from '@/lib/actions';
import { C } from '@/lib/tokens';
import { useApp } from '@/store';

/** Your groups. Create one in a sentence; share the link; whoever opens it is in. */
export default function Groups() {
  const { t } = useTranslation();
  const groups = useApp((s) => s.groups);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const create = () => {
    const trimmed = name.trim();
    const id = createGroup(trimmed);
    setName('');
    setCreating(false);
    toast(t('s.toasts.groupCreated', { name: trimmed }));
    router.push(`/groups/${id}` as never);
  };

  return (
    <Screen inset={false}>
      <TopBar title={t('s.groups.title')} />
      <Section>
        <SectionHead title={t('s.groups.yours')} subtitle={`${groups.length}`} />
        {groups.length ? (
          <RowList>
            {groups.map((group) => (
              <NavRow
                key={group.id}
                leading={
                  <View className="w-11 h-11 rounded-full bg-brand-paper-sunk items-center justify-center">
                    <GoraIcon name="people" size={20} color={C.ink} />
                  </View>
                }
                title={group.name}
                caption={t('s.groups.members', { count: group.members.length })}
                onPress={() => router.push(`/groups/${group.id}` as never)}
              />
            ))}
          </RowList>
        ) : (
          <EmptyState icon="people" title={t('s.groups.empty.title')} body={t('s.groups.empty.body')} />
        )}
      </Section>
      <Section>
        <SectionHead title={t('s.groups.startOne')} />
        {creating ? (
          <View>
            <Field label={t('s.groups.name')} placeholder={t('s.groups.namePh')} value={name} onChangeText={setName} autoFocus />
            <PrimaryButton label={t('s.groups.create')} icon="plus" disabled={!name.trim()} onPress={create} />
          </View>
        ) : (
          <PrimaryButton label={t('s.groups.newGroup')} icon="plus" onPress={() => setCreating(true)} />
        )}
      </Section>
    </Screen>
  );
}
