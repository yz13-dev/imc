


export function formatDuration(durationMs: number): string {
  const duration = durationMs / 1000;
  const seconds = Math.floor(duration % 60);
  const minutes = Math.floor(duration / 60);

  const fmtSeconds = seconds.toString().padStart(2, '0')
  const fmtMinutes = minutes.toString().padStart(2, '0')

  return `${fmtMinutes}:${fmtSeconds}`;
}
