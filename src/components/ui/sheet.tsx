import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/lib/tokens';

/**
 * The one bottom sheet. A scrim, a handle, paper, and whatever the moment
 * needs. Every decision the app asks for - an invite, a report, an attachment -
 * comes up from the bottom in this, never in a system dialog.
 */
export function BottomSheet({ visible, onDismiss, children, label = 'Close' }: {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  label?: string;
}) {
  const insets = useSafeAreaInsets();
  // Nothing at all until it is wanted. A hidden `<Modal visible={false}>` still
  // creates its native container, so every screen carrying a sheet was holding
  // an extra surface open - and Fabric would occasionally try to re-parent one
  // mid-navigation, killing the whole surface with "child already has a
  // parent". Mounting on demand costs the exit animation and nothing else.
  if (!visible) return null;
  return (
    <Modal transparent animationType="slide" visible statusBarTranslucent onRequestClose={onDismiss}>
      <Pressable accessibilityLabel={label} onPress={onDismiss} style={{ flex: 1, backgroundColor: `${C.night}99` }} />
      <View className="bg-brand-paper rounded-t-[4px] max-h-[85%]" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="self-center w-10 h-1 rounded-full bg-brand-rule mt-3 mb-4" />
        <ScrollView className="px-5" keyboardShouldPersistTaps="handled" bounces={false}>{children}</ScrollView>
      </View>
    </Modal>
  );
}