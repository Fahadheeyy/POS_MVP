const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function businessDate(value: Date | string = new Date()): string {
  return dateFormatter.format(typeof value === 'string' ? new Date(value) : value);
}

export function businessDateDaysAgo(days: number, now: Date = new Date()): string {
  return businessDate(new Date(now.getTime() - days * 86_400_000));
}
