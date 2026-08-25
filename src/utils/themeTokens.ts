export interface ThemeTokens {
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  shadow: string;
  tableHeader: string;
  tableRow: string;
  tableHover: string;
  inputBg: string;
  inputBorder: string;
  badgeHealthyBg: string;
  badgeHealthyText: string;
  badgeHealthyBorder: string;
  badgeWarningBg: string;
  badgeWarningText: string;
  badgeWarningBorder: string;
  badgeErrorBg: string;
  badgeErrorText: string;
  badgeErrorBorder: string;
  badgeInfoBg: string;
  badgeInfoText: string;
  badgeInfoBorder: string;
}

export const darkTokens: ThemeTokens = {
  background: 'bg-[#07090D]',
  surface: 'bg-[#0F131A]',
  surfaceSecondary: 'bg-[#151B24]',
  border: 'border-[rgba(255,255,255,0.06)]',
  textPrimary: 'text-[#F5F7FA]',
  textSecondary: 'text-[#9AA5B1]',
  textMuted: 'text-[#6B7280]',
  primary: 'text-[#FF8A00]',
  success: 'text-[#22C55E]',
  warning: 'text-amber-400',
  error: 'text-rose-400',
  info: 'text-sky-400',
  shadow: 'shadow-[0_4px_24px_rgba(0,0,0,0.4)]',
  tableHeader: 'bg-[#0F131A]',
  tableRow: 'bg-[#07090D]',
  tableHover: 'hover:bg-white/5',
  inputBg: 'bg-[#0F131A]',
  inputBorder: 'border-[rgba(255,255,255,0.06)]',
  badgeHealthyBg: 'bg-[#22C55E]/10',
  badgeHealthyText: 'text-[#22C55E]',
  badgeHealthyBorder: 'border-[#22C55E]/20',
  badgeWarningBg: 'bg-amber-500/10',
  badgeWarningText: 'text-amber-400',
  badgeWarningBorder: 'border-amber-500/20',
  badgeErrorBg: 'bg-rose-500/10',
  badgeErrorText: 'text-rose-400',
  badgeErrorBorder: 'border-rose-500/20',
  badgeInfoBg: 'bg-blue-500/10',
  badgeInfoText: 'text-blue-400',
  badgeInfoBorder: 'border-blue-500/20',
};

export const lightTokens: ThemeTokens = {
  background: 'bg-[#F5F7FA]',
  surface: 'bg-[#FFFFFF]',
  surfaceSecondary: 'bg-[#FFFFFF]',
  border: 'border-[#D9E0E8]',
  textPrimary: 'text-[#172033]',
  textSecondary: 'text-[#526074]',
  textMuted: 'text-[#7A8799]',
  primary: 'text-[#D97706]',
  success: 'text-[#15803D]',
  warning: 'text-[#B45309]',
  error: 'text-[#B91C1C]',
  info: 'text-[#0284C7]',
  shadow: 'shadow-[0_4px_24px_rgba(0,0,0,0.06)]',
  tableHeader: 'bg-[#F1F4F8]',
  tableRow: 'bg-[#FFFFFF]',
  tableHover: 'hover:bg-[#F8FAFC]',
  inputBg: 'bg-[#FFFFFF]',
  inputBorder: 'border-[#D9E0E8]',
  badgeHealthyBg: 'bg-emerald-100',
  badgeHealthyText: 'text-emerald-800',
  badgeHealthyBorder: 'border-emerald-300',
  badgeWarningBg: 'bg-amber-100',
  badgeWarningText: 'text-amber-900',
  badgeWarningBorder: 'border-amber-300',
  badgeErrorBg: 'bg-rose-100',
  badgeErrorText: 'text-rose-900',
  badgeErrorBorder: 'border-rose-300',
  badgeInfoBg: 'bg-sky-100',
  badgeInfoText: 'text-sky-900',
  badgeInfoBorder: 'border-sky-300',
};

export function getThemeTokens(isLight: boolean): ThemeTokens {
  return isLight ? lightTokens : darkTokens;
}

