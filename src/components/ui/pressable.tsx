/* Hallmark · component: pressable · genre: playful-editorial · theme: studied-DNA
 * states: default · hover · focus · active · disabled · loading · error · success
 * targets: 44px minimum · focus: instant token ring
 */

import { Pressable, type PressableProps } from 'react-native';

export type FocusablePressableProps = PressableProps & { className?: string };

/** Shared focus and touch-target contract for non-button interactions. */
export function FocusablePressable({ className = '', ...props }: FocusablePressableProps) {
  return <Pressable {...props} className={`gora-pressable ${className}`} />;
}
