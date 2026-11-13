// Indian currency formatter
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0.00';
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const [integerPart, decimalPart] = absAmount.toFixed(2).split('.');
  
  // Indian numbering: last 3 digits, then groups of 2
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  
  return `${isNegative ? '-' : ''}₹${formattedInteger}.${decimalPart}`;
}

export function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return '';
  }
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return '';
  }
}

export function formatElapsedMinutes(startIso: string): string {
  try {
    const start = new Date(startIso).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - start) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } catch (e) {
    return '00:00';
  }
}

