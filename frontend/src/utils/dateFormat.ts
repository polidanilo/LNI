/**
 * Formatta una data in formato gg/mm/aaaa
 * @param date - Stringa ISO o oggetto Date
 * @returns Stringa formattata come "gg/mm/aaaa" o "N/A" se la data non è valida
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Verifica che sia una data valida
    if (isNaN(d.getTime())) return 'N/A';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return 'N/A';
  }
}
