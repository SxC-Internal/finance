import type { CapitalOverviewWithChange } from '@/lib/finance';
import type { FinancialChartDatum } from '@/types';

export function exportCapitalOverviewCsv(
  overview: CapitalOverviewWithChange,
  monthlyData: FinancialChartDatum[],
  activeProgramsCount: number
): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const lines: string[] = [];

  lines.push('Finance Dashboard Export');
  lines.push(`Export Date,${timestamp}`);
  lines.push('');
  lines.push('Current Overview');
  lines.push('Metric,Value,Change %');
  lines.push(`Total Income,${overview.totalIncome},${overview.incomeChangePercent >= 0 ? '+' : ''}${overview.incomeChangePercent.toFixed(1)}%`);
  lines.push(`Total Expenses,${overview.totalExpenses},${overview.expenseChangePercent >= 0 ? '+' : ''}${overview.expenseChangePercent.toFixed(1)}%`);
  lines.push(`Total Allocated,${overview.totalAllocated},`);
  lines.push(`Remaining Balance,${overview.remaining},`);
  lines.push(`Active Programs,${activeProgramsCount},`);
  if (overview.averageMonthlyExpenses > 0) {
    const runway = Math.round(overview.remaining / overview.averageMonthlyExpenses);
    lines.push(`Cash Runway (months),${runway},`);
  }
  lines.push('');
  lines.push('Monthly Trends (6 Months)');
  lines.push('Month,Income,Expenses,Net');
  monthlyData.forEach((d) => {
    lines.push(`${d.month},${d.income},${d.expenses},${d.net}`);
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `finance-dashboard-export-${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
