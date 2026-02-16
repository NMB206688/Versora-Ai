
export const adminDashboardData = {
  totalMonthlyCost: 12500,
  costPerStudent: 83.33,
  aiUsageCost: 4500,
  costBreakdown: [
    { name: 'Jan', total: 11000, ai: 4000 },
    { name: 'Feb', total: 11200, ai: 4100 },
    { name: 'Mar', total: 11500, ai: 4200 },
    { name: 'Apr', total: 11800, ai: 4350 },
    { name: 'May', total: 12100, ai: 4400 },
    { name: 'Jun', total: 12500, ai: 4500 },
  ],
  aiCostByService: [
    { service: 'Rubric Generation', value: 1800, fill: 'var(--color-chart-1)' },
    { service: 'Writing Feedback', value: 2200, fill: 'var(--color-chart-2)' },
    { service: 'Other', value: 500, fill: 'var(--color-chart-3)' },
  ],
};
