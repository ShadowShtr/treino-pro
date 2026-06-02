export function haptic(style: "light" | "medium" | "heavy" = "light") {
  try {
    if ("vibrate" in navigator) {
      const ms = style === "light" ? 8 : style === "medium" ? 18 : 35;
      navigator.vibrate(ms);
    }
  } catch {
    // ignore — not supported or permission denied
  }
}
