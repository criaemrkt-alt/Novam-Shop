const normalizeHex = (value: string) => {
  const hex = value.trim().replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(hex)) return `#${hex.split("").map(char => char + char).join("")}`;
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex}` : null;
};

const rgb = (value: string) => {
  const hex = normalizeHex(value);
  if (!hex) return null;
  return [Number.parseInt(hex.slice(1, 3), 16), Number.parseInt(hex.slice(3, 5), 16), Number.parseInt(hex.slice(5, 7), 16)];
};

const luminance = (value: string) => {
  const color = rgb(value);
  if (!color) return 0;
  const [red, green, blue] = color.map(channel => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
};

export const contrastRatio = (foreground: string, background: string) => {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
};

export const readableColor = (background: string) => contrastRatio("#111111", background) >= contrastRatio("#FAF9F6", background) ? "#111111" : "#FAF9F6";

export const accessibleTextColor = (preferred: string, background: string) => contrastRatio(preferred, background) >= 4.5 ? preferred : readableColor(background);
