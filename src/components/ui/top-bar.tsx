import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconButton } from './button';
import { Txt } from './txt';

/**
 * The back affordance and the title, for every screen pushed onto the stack.
 *
 * `Screen` owns the body and `ScreenHeader` owns a tab root's big title; this
 * owns the narrower case of a screen you arrived at and can leave.
 */
export function TopBar({
  title,
  action,
  tone = 'light',
}: {
  title: string;
  action?: React.ReactNode;
  tone?: 'light' | 'dark';
}) {
  const { t } = useTranslation();
  return (
    <View className="pt-2 pb-4 flex-row items-center">
      <IconButton icon="back" label={t('shared.product.goBack')} tone={tone === 'dark' ? 'glass' : 'light'} onPress={() => router.back()} />
      <Txt
        variant="heading"
        headingLevel={1}
        className={`flex-1 min-w-0 ml-3 ${tone === 'dark' ? 'text-brand-paper' : ''}`}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Txt>
      {action}
    </View>
  );
}
