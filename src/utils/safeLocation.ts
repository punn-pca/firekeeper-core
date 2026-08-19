export const getSafeOrigin = (): string => {
  try {
    return window.location.origin || 'https://firekeeper.site';
  } catch (e) {
    return 'https://firekeeper.site'; // Fallback
  }
};

export const getSafePathname = (): string => {
  try {
    return window.location.pathname || '/';
  } catch (e) {
    return '/';
  }
};

export const getSafeProtocol = (): string => {
  try {
    return window.location.protocol || 'https:';
  } catch (e) {
    return 'https:';
  }
};

export const safeReload = (): void => {
  try {
    window.location.reload();
  } catch (e) {
    try {
      window.location.href = window.location.href;
    } catch (e2) {
      console.warn('Reload operation was blocked by security sandbox.');
    }
  }
};
