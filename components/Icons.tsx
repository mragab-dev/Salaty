import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg'; 
import Colors from '../constants/colors'; // Import the new Colors

export interface IconProps { 
  color?: string;
  width?: number | string;
  height?: number | string;
  size?: number; 
  className?: string; 
}

const defaultColor = Colors.moonlight; 
const defaultSize = 24;

export const SalatyLogoIcon: React.FC<IconProps> = ({ size = 120, color = Colors.secondary }) => (
    <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path 
            d="M50 5 C 25 5, 5 25, 5 50 C 5 75, 25 95, 50 95 C 52 95, 54 95, 56 94.8 C 30 90, 15 65, 25 40 C 35 15, 65 10, 80 25 C 75 15, 63 5, 50 5 Z" 
            fill={color} 
        />
        <Path 
            d="M65 30 L68 42 L80 45 L68 48 L65 60 L62 48 L50 45 L62 42 Z" 
            fill={color} 
        />
    </Svg>
);

export const HomeIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
  </Svg>
);

export const BookOpenIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </Svg>
);

export const ClockIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </Svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 14.25l-1.25-2.25L13.5 11l2.25-1.25L17 7.5l1.25 2.25L20.5 11l-2.25 1.25z" />
  </Svg>
);

export const CogIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15.036-7.168A5.963 5.963 0 0121.75 12c0 .399-.033.79-.097 1.173M6.75 12a5.25 5.25 0 0010.5 0M12 21a8.966 8.966 0 006.816-3.036" />
  </Svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => ( 
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </Svg>
);

export const ChevronUpIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => ( 
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </Svg>
);

export const InformationCircleIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => ( 
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </Svg>
);

export const QiblaIcon: React.FC<IconProps> = ({ color = Colors.secondary, width = defaultSize, height = defaultSize, size }) => ( 
  <Svg viewBox="0 0 24 24" fill={color} width={size || width} height={size || height}>
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16.5c-3.03 0-5.5-2.47-5.5-5.5s2.47-5.5 5.5-5.5 5.5 2.47 5.5 5.5-2.47 5.5-5.5 5.5z"/>
    <Path d="M12 7.25L14.15 12 12 16.75l-2.15-4.75L12 7.25M12 4l-3.5 7.5L12 19l3.5-7.5L12 4z" opacity={0.3}/>
    <Path d="M12 10.5l1.5 3.5-1.5 3.5-1.5-3.5 1.5-3.5z"/>
  </Svg>
);

export const ListBulletIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </Svg>
);

export const GlobeAltIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
  <Path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121.75 12H2.25z" />
</Svg>
);

export const LoadingSpinnerIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => ( 
  <Svg fill="none" viewBox="0 0 24 24" width={size || width} height={size || height}>
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="4" opacity={0.25}></Circle>
    <Path fill={color} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity={0.75}></Path>
  </Svg>
);

export const PlayIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => ( 
  <Svg fill={color} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
  </Svg>
);

export const PauseIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => ( 
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
  </Svg>
);

export const BellIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </Svg>
);

export const BellOffIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 6.75h.008v.008H12v-.008z" />
    <Path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M17.25 9.75L6.75 20.25" />
  </Svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    <Rect x="7" y="13" width="2" height="2" fill={color} />
    <Rect x="11" y="13" width="2" height="2" fill={color} />
    <Rect x="15" y="13" width="2" height="2" fill={color} />
  </Svg>
);

export const SearchIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => ( 
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </Svg>
);

export const BookmarkIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill={color} viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c.1.128.22.256.334.384a18.706 18.706 0 012.756 4.335c.234.54.19 1.14-.123 1.639l-6.52 7.606c-.333.388-.816.614-1.33.614H7.5a2.25 2.25 0 01-2.25-2.25V6.535c0-.514.226-.997.614-1.33l7.606-6.52a1.125 1.125 0 011.639-.123z" />
  </Svg>
);

export const BookmarkOutlineIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c.1.128.22.256.334.384a18.706 18.706 0 012.756 4.335c.234.54.19 1.14-.123 1.639l-6.52 7.606c-.333.388-.816.614-1.33.614H7.5a2.25 2.25 0 01-2.25-2.25V6.535c0-.514.226-.997.614-1.33l7.606-6.52a1.125 1.125 0 011.639-.123z" />
  </Svg>
);

export const MusicalNoteIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V7.5A2.25 2.25 0 0013.5 3H9.75A2.25 2.25 0 007.5 5.25v13.5A2.25 2.25 0 009.75 21h-3a2.25 2.25 0 00-2.25-2.25v-6.75A2.25 2.25 0 003 9.75V7.5A2.25 2.25 0 015.25 3h1.5A2.25 2.25 0 019 5.25v3.75z" />
  </Svg>
);

export const ClipboardIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25-2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </Svg>
);

export const ShareIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => ( 
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </Svg>
);

export const CheckmarkIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => ( 
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </Svg>
);

export const ChatBubbleIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3.688-3.091c.002-.015.004-.03.005-.045H7.5a2.25 2.25 0 01-2.25-2.25V10.608c0-.994.616-1.836 1.5-2.097m14.25-4.887A2.25 2.25 0 0018 2.25H7.5L3.75 6H2.25A2.25 2.25 0 000 8.25v8.25a2.25 2.25 0 002.25 2.25h2.75a.75.75 0 01.75.75v2.25a.75.75 0 001.28.53l2.5-2.5a.75.75 0 01.53-.22h6.591a2.25 2.25 0 002.25-2.25V8.25a2.25 2.25 0 00-2.25-2.25h-2.25a.75.75 0 00-.75.75v.75a2.25 2.25 0 01-2.25 2.25H7.5" />
  </Svg>
);

export const SendIcon: React.FC<IconProps> = ({ color = Colors.white, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill={color} viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </Svg>
);

export const EllipsisVerticalIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill={color} viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
  </Svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </Svg>
);

export const TextStyleIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M5.25 4.5v3M9 4.5v3m4.5-3v3m4.5-3v3M3.75 12v4.5C3.75 18.981 5.019 21 6.75 21h10.5c1.731 0 3-2.019 3-4.5v-4.5" />
    <Path strokeLinecap="round" strokeLinejoin="round" d="M9.75 18h4.5" />
  </Svg>
);

export const RepeatIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill={color} viewBox="0 0 24 24" width={size || width} height={size || height}>
    <Path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
  </Svg>
);

export const PencilIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </Svg>
);

export const EyeIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <Path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </Svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.57M2 2l20 20" />
     <Path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </Svg>
);

export const StopCircleIcon: React.FC<IconProps> = ({ color = Colors.primary, width = defaultSize, height = defaultSize, size }) => (
    <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
        <Path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <Path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.253 9.253 9 9.563 9h4.874c.31 0 .563.253.563.563v4.874c0 .31-.253.563-.563.563H9.563A.563.563 0 019 14.437V9.564z" />
    </Svg>
);

export const ChartBarIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </Svg>
);

export const SunIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12h2.25m.386-6.364l1.591 1.591M12 12a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
  </Svg>
);

export const MoonIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21c3.93 0 7.403-2.135 9.002-5.248z" />
  </Svg>
);

export const SunsetIcon: React.FC<IconProps> = ({ color = defaultColor, width = defaultSize, height = defaultSize, size }) => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} width={size || width} height={size || height}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12h2.25m.386-6.364l1.591 1.591M12 12a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
    <Path strokeLinecap="round" strokeLinejoin="round" d="M3 18.75h18M3 16.5h18" /> 
  </Svg>
);

// Lucide-React-Native Icons for Tasbih
import { RotateCcw, Settings, Info, RefreshCw } from 'lucide-react-native';

// These are wrappers to fit the existing IconProps pattern
export const SettingsIcon: React.FC<IconProps> = ({ color = Colors.primary, size = 20 }) => (
  <Settings color={color} size={size} />
);

export const RotateCcwIcon: React.FC<IconProps> = ({ color = Colors.white, size = 24 }) => (
  <RotateCcw color={color} size={size} />
);

export const InfoIcon: React.FC<IconProps> = ({ color = Colors.white, size = 18 }) => (
  <Info color={color} size={size} />
);

export const RefreshCwIcon: React.FC<IconProps> = ({ color = Colors.secondary, size = 16 }) => (
    <RefreshCw color={color} size={size} />
);
