export enum StandardPlatform {
  PC = 'PC',
  PS5 = 'PlayStation 5',
  PS4 = 'PlayStation 4',
  XBOX_SERIES = 'Xbox Series X/S',
  XBOX_ONE = 'Xbox One',
  SWITCH = 'Nintendo Switch',
  MACOS = 'macOS',
  LINUX = 'Linux',
  IOS = 'iOS',
  ANDROID = 'Android',
  OTHER = 'Other',
}

const PLATFORM_MAP: Record<string, StandardPlatform> = {
  // PC
  'pc': StandardPlatform.PC,
  'windows': StandardPlatform.PC,
  'win': StandardPlatform.PC,
  'microsoft windows': StandardPlatform.PC,
  'pc (microsoft windows)': StandardPlatform.PC,
  // PlayStation
  'playstation 5': StandardPlatform.PS5,
  'ps5': StandardPlatform.PS5,
  'playstation 4': StandardPlatform.PS4,
  'ps4': StandardPlatform.PS4,
  // Xbox
  'xbox series x/s': StandardPlatform.XBOX_SERIES,
  'xbox series x|s': StandardPlatform.XBOX_SERIES,
  'xbox series x': StandardPlatform.XBOX_SERIES,
  'xbox series s': StandardPlatform.XBOX_SERIES,
  'xsx': StandardPlatform.XBOX_SERIES,
  'xbx/s': StandardPlatform.XBOX_SERIES,
  'xbx': StandardPlatform.XBOX_SERIES,
  'xbs': StandardPlatform.XBOX_SERIES,
  'xbox series': StandardPlatform.XBOX_SERIES,
  'xbox one': StandardPlatform.XBOX_ONE,
  'xbo': StandardPlatform.XBOX_ONE,
  // Nintendo
  'nintendo switch': StandardPlatform.SWITCH,
  'switch': StandardPlatform.SWITCH,
  'ns': StandardPlatform.SWITCH,
  'ns2': StandardPlatform.SWITCH,
  // Other OS
  'macos': StandardPlatform.MACOS,
  'mac': StandardPlatform.MACOS,
  'osx': StandardPlatform.MACOS,
  'linux': StandardPlatform.LINUX,
  'lin': StandardPlatform.LINUX,
  'ios': StandardPlatform.IOS,
  'android': StandardPlatform.ANDROID,
  'droid': StandardPlatform.ANDROID,

};

export function normalizePlatform(raw: string): StandardPlatform {
  if (!raw) return StandardPlatform.OTHER;
  const clean = raw.trim().toLowerCase();
  return PLATFORM_MAP[clean] || StandardPlatform.OTHER;
}

export function normalizePlatforms(rawList: string[]): StandardPlatform[] {
  const platforms = new Set<StandardPlatform>();

  for (const item of rawList) {
    if (!item) continue;
    // Handle comma or slash separated items
    const parts = item.split(/[,/]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1 && !parts.every(p => PLATFORM_MAP[p.toLowerCase()])) {
      // Check if whole item matches (e.g. Xbox Series X/S contains a slash)
      const whole = normalizePlatform(item);
      if (whole !== StandardPlatform.OTHER) {
        platforms.add(whole);
        continue;
      }
    }

    // Otherwise test the item or its components
    const direct = normalizePlatform(item);
    if (direct !== StandardPlatform.OTHER) {
      platforms.add(direct);
    } else {
      // Check individual parts
      let foundAny = false;
      for (const part of parts) {
        const pNorm = normalizePlatform(part);
        if (pNorm !== StandardPlatform.OTHER) {
          platforms.add(pNorm);
          foundAny = true;
        }
      }
      if (!foundAny) {
        platforms.add(StandardPlatform.OTHER);
      }
    }
  }

  return Array.from(platforms);
}
