import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

// NativeWind only maps className -> style for components it knows about. Third-party
// components silently DROP className without this — no error, no warning, just
// unstyled output. Registration is global and must run before the component renders,
// so every module that puts a className on one of these imports this file for effect.
cssInterop(LinearGradient, { className: 'style' });
cssInterop(Image, { className: 'style' });

// SafeAreaView is deliberately NOT registered. Registering it makes className
// compile into `style`, which SafeAreaView then rewrites while computing insets —
// horizontal padding silently flattens to 0. The rule instead: SafeAreaView takes
// `edges` and `style={{ flex: 1 }}` only, and a plain View inside carries layout.
