import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { C, RADIUS } from '@/lib/tokens';
import { IconTile, SecondaryButton } from './button';
import { GimikIcon, type IconName } from './icon';
import { Txt } from './txt';

export function EmptyState({
  icon = 'calendar',
  title,
  body,
  action,
  onAction,
}: {
  icon?: IconName;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  // Centred, with one dark pill: an empty state is a full stop, not a form.
  // Left-aligned copy over an orange primary read as "the next field", and
  // people looked for something to fill in.
  return (
    <View className="items-center py-14 px-4">
      <IconTile name={icon} tone="blue" size={64} />
      <Txt variant="title" className="mt-6 text-center max-w-[300px]">
        {title}
      </Txt>
      <Txt variant="body" className="mt-3 text-center max-w-[320px]">
        {body}
      </Txt>
      {action ? (
        <View className="mt-7">
          <SecondaryButton label={action} tone="ink" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

export function InlineNotice({
  title,
  body,
  tone = 'info',
}: {
  title: string;
  body?: string;
  tone?: 'info' | 'error' | 'success';
}) {
  const color = tone === 'error' ? C.danger : tone === 'success' ? C.success : C.skyDeep;
  const icon: IconName =
    tone === 'error' ? 'warning' : tone === 'success' ? 'success' : 'info';
  return (
    <View
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
      style={{
        alignItems: 'flex-start',
        backgroundColor: C.paperSunk,
        borderColor: color,
        borderRadius: RADIUS.input,
        borderWidth: 1,
        flexDirection: 'row',
        padding: 16,
      }}
    >
      <GimikIcon name={icon} size={20} color={color} weight="bold" />
      <View className="flex-1 ml-3">
        <Txt variant="label" style={{ color: C.ink }}>
          {title}
        </Txt>
        {body ? (
          <Txt variant="caption" className="mt-1">
            {body}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center py-8" accessibilityLiveRegion="polite">
      <ActivityIndicator size="small" color={C.skyDeep} />
      <Txt variant="label" className="ml-3">
        {label ?? t('shared.feedback.loading')}
      </Txt>
    </View>
  );
}
