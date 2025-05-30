export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) return "juuri nyt";
  if (diffMinutes < 60) return `${diffMinutes} min sitten`;
  if (diffHours < 24) return `${diffHours} h sitten`;

  // Yli vuorokausi
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} pv sitten`;
}
