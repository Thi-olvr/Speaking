/**
 * Formats a date into a relative time string (e.g., "5 minutes ago").
 * @param date The date to format.
 * @returns A string representing the relative time.
 */
export function formatDistanceToNow(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
    let interval = seconds / 31536000;
    if (interval > 1) {
      return Math.floor(interval) + " years ago";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months ago";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " days ago";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours ago";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes ago";
    }
    if (seconds < 10) {
        return "just now";
    }
    return Math.floor(seconds) + " seconds ago";
  }
  