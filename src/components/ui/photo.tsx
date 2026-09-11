import { Image, type ImageProps } from 'expo-image';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import './interop';
import { C } from '@/lib/tokens';
import { GimikIcon } from './icon';
import { Txt } from './txt';

/** Room for the floating back button that sits over a full-bleed hero. */
const BACK_BUTTON_CLEARANCE = 64;

/** `require()` of a bundled asset resolves to a number; remote images are strings. */
export type PhotoSource = number | string;

type BrandedImageProps = Omit<ImageProps, 'style' | 'onLoad' | 'onLoadStart'> & {
  style?: StyleProp<ViewStyle>;
  /** Shown instead when the source will not load - an unreachable object store,
   *  mostly. Without one the frame keeps its placeholder, which reads as a
   *  download that never finishes rather than as an image that is not there. */
  fallback?: PhotoSource;
};

/** Keeps image geometry stable and makes a slow local or remote asset look intentional. */
export function BrandedImage({ style, fallback, source, onError, ...props }: BrandedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const resolved = failed && fallback !== undefined ? fallback : source;
  return (
    <View style={style} className="overflow-hidden bg-brand-paper-sunk">
      {!loaded ? (
        <View style={StyleSheet.absoluteFill} className="items-center justify-center opacity-35">
          <GimikIcon name="cards" size={24} color={C.inkMuted} weight="duotone" />
        </View>
      ) : null}
      <Image
        {...props}
        source={resolved}
        // Catalog artwork is immutable and shared by every screen, so a tile
        // seen once should never be fetched twice. recyclingKey lets a list cell
        // that is reused for a new item drop the old bitmap instead of showing
        // it until the new one arrives.
        cachePolicy="memory-disk"
        recyclingKey={typeof resolved === 'string' ? resolved : undefined}
        style={StyleSheet.absoluteFill}
        onLoadStart={() => setLoaded(false)}
        onLoad={() => setLoaded(true)}
        // Own handler first, then the caller's: a gallery needs to hear about a
        // dead source even though this component also reacts to it.
        onError={(event) => {
          setFailed(true);
          onError?.(event);
        }}
      />
    </View>
  );
}

/** Initials avatar. No photo dependency, so it works before any account exists. */
export function Avatar({
  name,
  size = 40,
  source,
}: {
  name: string;
  size?: number;
  source?: PhotoSource;
}) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="overflow-hidden items-center justify-center bg-brand-night"
    >
      {source ? (
        <BrandedImage source={source} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <Txt
          variant="label"
          className="text-brand-white"
          // The variant's fixed line box clips large initials; give the glyph a
          // line box that grows with the avatar instead.
          style={{ fontSize: size * 0.36, lineHeight: size * 0.5, includeFontPadding: false, textAlign: 'center' }}
        >
          {initials}
        </Txt>
      )}
    </View>
  );
}

/** Progress dots. The active one stretches into a bar rather than changing color. */
export function Dots({
  count,
  active,
  tone = 'ink',
}: {
  count: number;
  active: number;
  /** `white` for dots sitting on imagery, where ink disappears. */
  tone?: 'ink' | 'white';
}) {
  if (count < 2) return null;
  const on = tone === 'white' ? 'bg-brand-paper' : 'bg-brand-night';
  const off = tone === 'white' ? 'bg-brand-paper/40' : 'bg-brand-rule';
  return (
    <View className="flex-row justify-center">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          className={`h-[6px] rounded-full mx-[3px] ${i === active ? `w-6 ${on}` : `w-[6px] ${off}`}`}
        />
      ))}
    </View>
  );
}

/**
 * Someone's photos, paged, with dots over the last one.
 *
 * Falls back to the initials avatar when there are none, which is the state
 * every seeded person is in until the media store has portraits for them — so
 * the screen reads as finished either way rather than as a broken image.
 */
export function PhotoGallery({
  photos,
  name,
  height = 420,
}: {
  photos: PhotoSource[];
  /** Drives the fallback initials, and the accessible name of each page. */
  name: string;
  height?: number;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  // A portrait the store cannot serve is not a portrait. The object keys are
  // built from a count rather than a listing, so a missing or unreachable file
  // is an ordinary state, not an error - drop it and let the rest stand. When
  // none survive the person simply has no photo, which initials already say.
  const [failed, setFailed] = useState<string[]>([]);
  const pageWidth = Math.min(width, 760);
  const keyOf = (photo: PhotoSource, index: number) => (typeof photo === 'string' ? photo : `bundled-${index}`);
  const live = photos.filter((photo, index) => !failed.includes(keyOf(photo, index)));

  if (!live.length) {
    // No photograph is a state, not a gap. Clear the status bar and the back
    // button, show the initials, and give the name below its normal spacing -
    // a half-height empty frame just reads as something that failed to load.
    return (
      <View style={{ paddingTop: insets.top + BACK_BUTTON_CLEARANCE }} className="items-center">
        <Avatar name={name} size={132} />
      </View>
    );
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setPage((current) => (current === next ? current : next));
  };

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ height }}
      >
        {live.map((photo, index) => (
          <View key={keyOf(photo, index)} style={{ width: pageWidth, height }}>
            <BrandedImage
              accessibilityLabel={`${name} ${index + 1}`}
              source={photo}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={220}
              onError={() => setFailed((current) => {
                const key = keyOf(photo, index);
                return current.includes(key) ? current : [...current, key];
              })}
            />
          </View>
        ))}
      </ScrollView>
      <View className="absolute left-0 right-0" style={{ bottom: 12 }}>
        <Dots count={live.length} active={Math.min(page, live.length - 1)} tone="white" />
      </View>
    </View>
  );
}
