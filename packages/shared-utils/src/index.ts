/**
 * Formats process uptime into a human-readable duration string.
 * E.g., "2d 4h 12m 30s" or "35s"
 */
export function formatUptime(uptimeSeconds: number): string {
  const seconds = Math.floor(uptimeSeconds % 60);
  const minutes = Math.floor((uptimeSeconds / 60) % 60);
  const hours = Math.floor((uptimeSeconds / 3600) % 24);
  const days = Math.floor(uptimeSeconds / 86400);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length > 0 || seconds > 0) parts.push(`${seconds}s`);

  return parts.join(" ") || "0s";
}

/**
 * Formats a byte number into a human-readable capacity string.
 * E.g., "15.42 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
