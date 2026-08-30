import { Text, type TextProps } from 'react-native';

// The only text component. Font families are registered in Expo and mapped into
// NativeWind in tailwind.config.js, so typography stays visible in the class list.
//
// `someday` and `date` are product states, not decorative type variants: blue
// Instrument Serif means no date yet; tracked orange mono means the plan is locked.
export type TxtVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'button'
  | 'label'
  | 'caption'
  | 'eyebrow'
  | 'someday'
  | 'date';

// Sized against iOS HIG (Body 17pt, Caption1 12, LargeTitle 34) and Material 3
// (Body Large 16, Title Large 22, Display Small 36). Body at 15 was under both.
const VARIANT: Record<TxtVariant, string> = {
  display: 'font-geist-semibold text-[28px] leading-[32px] tracking-[-0.8px] text-brand-ink',
  title: 'font-geist-bold text-[24px] leading-[28px] tracking-[-0.5px] text-brand-ink',
  heading: 'font-geist-bold text-[18px] leading-[23px] tracking-[-0.2px] text-brand-ink',
  body: 'font-geist text-[15px] leading-[22px] text-brand-ink-muted',
  button: 'font-geist-bold text-[15px] leading-[20px] text-brand-ink',
  label: 'font-geist-medium text-[13px] leading-[18px] text-brand-ink-muted',
  caption: 'font-geist text-[12px] leading-[16px] text-brand-ink-muted',
  eyebrow: 'font-geist-mono-medium text-[11px] leading-[14px] tracking-[1px] text-brand-ink-muted',
  someday: 'font-instrument-serif text-[26px] leading-[30px] tracking-[-0.3px] text-brand-sky-deep',
  date: 'font-geist-mono-medium text-[11px] leading-[14px] tracking-[1px] text-brand-orange-deep',
};

export type TxtProps = TextProps & {
  variant?: TxtVariant;
  className?: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
};

export function Txt({ variant = 'body', className = '', headingLevel, style, ...rest }: TxtProps) {
  const upper = variant === 'eyebrow' || variant === 'date' ? 'uppercase' : '';
  return (
    <Text
      accessibilityRole={headingLevel ? 'header' : undefined}
      aria-level={headingLevel}
      className={`${VARIANT[variant]} ${upper} ${className}`}
      style={style}
      {...rest}
    />
  );
}
