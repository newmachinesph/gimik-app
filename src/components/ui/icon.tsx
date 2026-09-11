import type { Icon, IconProps, IconWeight } from 'phosphor-react-native';
import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { ShareNetworkIcon } from 'phosphor-react-native/src/icons/ShareNetwork';
import { ArrowUpIcon } from 'phosphor-react-native/src/icons/ArrowUp';
import { BellRingingIcon } from 'phosphor-react-native/src/icons/BellRinging';
import { BriefcaseIcon } from 'phosphor-react-native/src/icons/Briefcase';
import { GraduationCapIcon } from 'phosphor-react-native/src/icons/GraduationCap';
import { CalendarCheckIcon } from 'phosphor-react-native/src/icons/CalendarCheck';
import { CardsThreeIcon } from 'phosphor-react-native/src/icons/CardsThree';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { CheckSquareIcon } from 'phosphor-react-native/src/icons/CheckSquare';
import { CircleIcon } from 'phosphor-react-native/src/icons/Circle';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { CompassIcon } from 'phosphor-react-native/src/icons/Compass';
import { CopySimpleIcon } from 'phosphor-react-native/src/icons/CopySimple';
import { GlobeHemisphereWestIcon } from 'phosphor-react-native/src/icons/GlobeHemisphereWest';
import { GridFourIcon } from 'phosphor-react-native/src/icons/GridFour';
import { HeartIcon } from 'phosphor-react-native/src/icons/Heart';
import { EyeSlashIcon } from 'phosphor-react-native/src/icons/EyeSlash';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { LockKeyIcon } from 'phosphor-react-native/src/icons/LockKey';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { MapTrifoldIcon } from 'phosphor-react-native/src/icons/MapTrifold';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { QuestionIcon } from 'phosphor-react-native/src/icons/Question';
import { SlidersHorizontalIcon } from 'phosphor-react-native/src/icons/SlidersHorizontal';
import { SparkleIcon } from 'phosphor-react-native/src/icons/Sparkle';
import { SquareIcon } from 'phosphor-react-native/src/icons/Square';
import { StackSimpleIcon } from 'phosphor-react-native/src/icons/StackSimple';
import { UserCircleIcon } from 'phosphor-react-native/src/icons/UserCircle';
import { UserIcon } from 'phosphor-react-native/src/icons/User';
import { UsersThreeIcon } from 'phosphor-react-native/src/icons/UsersThree';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { ChatCircleIcon } from 'phosphor-react-native/src/icons/ChatCircle';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { PaperPlaneRightIcon } from 'phosphor-react-native/src/icons/PaperPlaneRight';

/** Product-level names keep vendor details out of feature code. */
const ICONS = {
  'arrow-right': ArrowRightIcon,
  'arrow-up': ArrowUpIcon,
  back: CaretLeftIcon,
  bell: BellRingingIcon,
  calendar: CalendarCheckIcon,
  camera: CameraIcon,
  chat: ChatCircleIcon,
  cards: CardsThreeIcon,
  check: CheckIcon,
  checkbox: CheckSquareIcon,
  circle: CircleIcon,
  close: XIcon,
  clock: ClockIcon,
  compass: CompassIcon,
  copy: CopySimpleIcon,
  'chevron-down': CaretDownIcon,
  'chevron-right': CaretRightIcon,
  filter: SlidersHorizontalIcon,
  globe: GlobeHemisphereWestIcon,
  grid: GridFourIcon,
  heart: HeartIcon,
  hide: EyeSlashIcon,
  help: QuestionIcon,
  info: InfoIcon,
  lock: LockKeyIcon,
  map: MapTrifoldIcon,
  'map-pin': MapPinIcon,
  people: UsersThreeIcon,
  plus: PlusIcon,
  profile: UserCircleIcon,
  user: UserIcon,
  search: MagnifyingGlassIcon,
  send: PaperPlaneRightIcon,
  share: ShareNetworkIcon,
  settings: GearSixIcon,
  sparkle: SparkleIcon,
  square: SquareIcon,
  stack: StackSimpleIcon,
  success: CheckCircleIcon,
  undo: ArrowCounterClockwiseIcon,
  warning: WarningCircleIcon,
  work: BriefcaseIcon,
  education: GraduationCapIcon,
} satisfies Record<string, Icon>;

export type IconName = keyof typeof ICONS;
export type { IconWeight };

export type GimikIconProps = Omit<IconProps, 'weight'> & {
  name: IconName;
  weight?: IconWeight;
};

/** One renderer for consistent Phosphor sizing, weight, and duotone behavior. */
export function GimikIcon({ name, weight = 'regular', ...props }: GimikIconProps) {
  const Glyph = ICONS[name];
  return <Glyph {...props} weight={weight} />;
}
