export interface ThemeColors {
  background: string;
  card: string;
  primary: string;
  text: string;
}

export type ThemeType = "gray" | "blue" | "black";

export const themes: Record<ThemeType, ThemeColors> = {
  gray: {
    background: "#F9FAFB",
    card: "#FFFFFF",
    primary: "#6366F1", // Indigo is more modern than pure gray
    text: "#111827",
  },
  blue: {
    background: "#F0F7FF",
    card: "#FFFFFF",
    primary: "#2563EB",
    text: "#0F172A",
  },
  black: {
    background: "#05070A",
    card: "#0D1117",
    primary: "#FFFFFF",
    text: "#F8FAFC",
  },
};
