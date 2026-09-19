import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, Modal, Pressable, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardAvoidingView, useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/lib/tokens';
import { KEYBOARD_GAP } from '@/lib/keyboard-layout';

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
  const keyboardVisible = useKeyboardState((state) => state.isVisible);
  // The sheet is its own window. Mounted while the keyboard is still up (type a
  // message, tap +) it laid out around a keyboard that then closed, and never
  // re-measured: content clipped, bottom blank, screen showing through. So a
  // sheet asked for over an open keyboard closes it first and opens after.
  // Once open, a field inside it may raise the keyboard freely.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    // The state follows `visible` and the keyboard; there is nothing to derive it from in render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!visible) { setArmed(false); return; }
    if (armed) return;
    if (keyboardVisible) { Keyboard.dismiss(); return; }
    setArmed(true);
  }, [armed, keyboardVisible, visible]);
  // Nothing at all until it is wanted. A hidden `<Modal visible={false}>` still
  // creates its native container, so every screen carrying a sheet was holding
  // an extra surface open - and Fabric would occasionally try to re-parent one
  // mid-navigation, killing the whole surface with "child already has a
  // parent". Mounting on demand costs the exit animation and nothing else.
  if (!visible || !armed) return null;
  return (
    <Modal transparent animationType="slide" visible statusBarTranslucent onRequestClose={onDismiss}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable accessibilityLabel={label} onPress={onDismiss} style={{ flex: 1, backgroundColor: `${C.night}99` }} />
        <View className="bg-brand-paper rounded-t-[4px] max-h-[85%]" style={{ paddingBottom: keyboardVisible ? KEYBOARD_GAP : insets.bottom + 16 }}>
          <View className="self-center w-10 h-1 rounded-full bg-brand-rule mt-3 mb-4" />
          <KeyboardAwareScrollView contentContainerStyle={{ paddingHorizontal: 20 }} bottomOffset={KEYBOARD_GAP} keyboardShouldPersistTaps="handled" bounces={false}>{children}</KeyboardAwareScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
