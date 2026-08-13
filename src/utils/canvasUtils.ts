import html2canvas from 'html2canvas';

/**
 * Converts OKLCH color strings to standard RGB/RGBA strings for html2canvas compatibility.
 * Example input: "oklch(0.7 0.15 120 / 0.8)" -> "rgba(180, 195, 50, 0.8)"
 */
export function oklchToRgbString(oklchStr: string): string {
  try {
    const match = oklchStr.match(/oklch\(\s*([\d.%]+)[\s,]+([\d.%-]+)[\s,]+([\d.%-]+)(?:\s*[\/,]\s*([\d.%]+))?\s*\)/i);
    if (!match) return 'rgba(100, 116, 139, 1)';

    let L = parseFloat(match[1]);
    if (match[1].endsWith('%')) L /= 100;

    let C = parseFloat(match[2]);
    if (match[2].endsWith('%')) C /= 100;

    let H = parseFloat(match[3]);

    let A = 1;
    if (match[4]) {
      A = parseFloat(match[4]);
      if (match[4].endsWith('%')) A /= 100;
    }

    const rad = (H * Math.PI) / 180;
    const a = C * Math.cos(rad);
    const b = C * Math.sin(rad);

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const rLinear = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const gLinear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const bLinear = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    const gamma = (x: number) => {
      if (x <= 0) return 0;
      if (x >= 1) return 255;
      const c = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
      return Math.min(255, Math.max(0, Math.round(c * 255)));
    };

    const r = gamma(rLinear);
    const g = gamma(gLinear);
    const bComp = gamma(bLinear);

    if (A < 1) {
      return `rgba(${r}, ${g}, ${bComp}, ${A})`;
    }
    return `rgb(${r}, ${g}, ${bComp})`;
  } catch (err) {
    return 'rgba(100, 116, 139, 1)';
  }
}

/**
 * Converts OKLAB color strings to standard RGB/RGBA strings for html2canvas compatibility.
 * Example input: "oklab(0.7 0.1 -0.1 / 0.8)" -> "rgba(...)"
 */
export function oklabToRgbString(oklabStr: string): string {
  try {
    const match = oklabStr.match(/oklab\(\s*([\d.%]+)[\s,]+([-\d.%]+)[\s,]+([-\d.%]+)(?:\s*[\/,]\s*([\d.%]+))?\s*\)/i);
    if (!match) return 'rgba(100, 116, 139, 1)';

    let L = parseFloat(match[1]);
    if (match[1].endsWith('%')) L /= 100;

    let a = parseFloat(match[2]);
    if (match[2].endsWith('%')) a /= 100;

    let b = parseFloat(match[3]);
    if (match[3].endsWith('%')) b /= 100;

    let A = 1;
    if (match[4]) {
      A = parseFloat(match[4]);
      if (match[4].endsWith('%')) A /= 100;
    }

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const rLinear = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const gLinear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const bLinear = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    const gamma = (x: number) => {
      if (x <= 0) return 0;
      if (x >= 1) return 255;
      const c = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
      return Math.min(255, Math.max(0, Math.round(c * 255)));
    };

    const r = gamma(rLinear);
    const g = gamma(gLinear);
    const bComp = gamma(bLinear);

    if (A < 1) {
      return `rgba(${r}, ${g}, ${bComp}, ${A})`;
    }
    return `rgb(${r}, ${g}, ${bComp})`;
  } catch (err) {
    return 'rgba(100, 116, 139, 1)';
  }
}

/**
 * Sanitizes host document stylesheet elements before html2canvas parses stylesheet rules.
 * Restores original content after capture completes.
 */
export function sanitizeHostStyles(): () => void {
  const styleEls = Array.from(document.querySelectorAll('style'));
  const saved: { el: HTMLStyleElement; original: string }[] = [];

  styleEls.forEach((styleEl) => {
    if (styleEl.textContent && /(oklch|oklab|color-mix)/i.test(styleEl.textContent)) {
      saved.push({ el: styleEl, original: styleEl.textContent });
      styleEl.textContent = styleEl.textContent
        .replace(/oklch\([^)]+\)/gi, (m) => oklchToRgbString(m))
        .replace(/oklab\([^)]+\)/gi, (m) => oklabToRgbString(m))
        .replace(/color-mix\([^)]+\)/gi, 'rgba(100, 116, 139, 0.5)');
    }
  });

  return () => {
    saved.forEach(({ el, original }) => {
      el.textContent = original;
    });
  };
}

/**
 * Sanitizes a cloned document before html2canvas parses stylesheet rules.
 */
export function sanitizeDocumentForHtml2Canvas(clonedDoc: Document): void {
  try {
    const styleElements = clonedDoc.querySelectorAll('style');
    styleElements.forEach((styleEl) => {
      if (styleEl.textContent) {
        let text = styleEl.textContent;
        if (/oklch/i.test(text)) {
          text = text.replace(/oklch\([^)]+\)/gi, (m) => oklchToRgbString(m));
        }
        if (/oklab/i.test(text)) {
          text = text.replace(/oklab\([^)]+\)/gi, (m) => oklabToRgbString(m));
        }
        if (/color-mix/i.test(text)) {
          text = text.replace(/color-mix\([^)]+\)/gi, 'rgba(100, 116, 139, 0.5)');
        }
        styleEl.textContent = text;
      }
    });

    const elementsWithStyle = clonedDoc.querySelectorAll('[style]');
    elementsWithStyle.forEach((el) => {
      const styleAttr = el.getAttribute('style');
      if (styleAttr) {
        let newAttr = styleAttr;
        if (/oklch/i.test(newAttr)) {
          newAttr = newAttr.replace(/oklch\([^)]+\)/gi, (m) => oklchToRgbString(m));
        }
        if (/oklab/i.test(newAttr)) {
          newAttr = newAttr.replace(/oklab\([^)]+\)/gi, (m) => oklabToRgbString(m));
        }
        if (/color-mix/i.test(newAttr)) {
          newAttr = newAttr.replace(/color-mix\([^)]+\)/gi, 'rgba(100, 116, 139, 0.5)');
        }
        if (newAttr !== styleAttr) {
          el.setAttribute('style', newAttr);
        }
      }
    });
  } catch (e) {
    console.warn('Error sanitizing document for html2canvas:', e);
  }
}

/**
 * Capture an HTML element to canvas safely with oklch/oklab sanitization.
 */
export async function captureElementToCanvas(
  element: HTMLElement,
  customOptions: Record<string, any> = {}
) {
  const restoreStyles = sanitizeHostStyles();
  try {
    const defaultOptions = {
      backgroundColor: '#020617',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      onclone: (clonedDoc: Document) => {
        sanitizeDocumentForHtml2Canvas(clonedDoc);
        if (customOptions.onclone) {
          customOptions.onclone(clonedDoc);
        }
      },
    };

    return await html2canvas(element, { ...defaultOptions, ...customOptions });
  } finally {
    restoreStyles();
  }
}
