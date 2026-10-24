/**
 * Program badge styling utility:
 * Provides a distinct soft color per program for small rounded pill badges on records.
 */
export function getProgramBadgeStyle(program: string): string {
  if (program.includes('Sunday')) {
    return 'bg-blue-50 text-blue-700 border border-blue-200/60';
  }
  if (program.includes('Wednesday')) {
    return 'bg-indigo-50 text-indigo-700 border border-indigo-200/60';
  }
  if (program.includes('Friday')) {
    return 'bg-rose-50 text-rose-700 border border-rose-200/60';
  }
  if (program.includes('Auxano')) {
    return 'bg-amber-50 text-amber-800 border border-amber-200/60';
  }
  return 'bg-slate-50 text-slate-700 border border-slate-200/60';
}
