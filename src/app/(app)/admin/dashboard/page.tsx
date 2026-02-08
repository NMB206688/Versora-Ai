import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Users, Bot } from 'lucide-react';
import { adminDashboardData } from '@/lib/data';
import { CostBreakdownChart } from '@/components/dashboard/admin/cost-breakdown-chart';
import { AiUsageChart } from '@/components/dashboard/admin/ai-usage-chart';

export default function AdminDashboard() {
  const { totalMonthlyCost, costPerStudent, aiUsageCost, costBreakdown, aiCostByService } = adminDashboardData;

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  return (
    <div className="container mx-auto">
      <h1 className="font-headline text-3xl font-bold tracking-tight mb-6">
        Administrator Dashboard
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyCost)}</div>
            <p className="text-xs text-muted-foreground">+2.5% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Per Student</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costPerStudent)}</div>
            <p className="text-xs text-muted-foreground">per month</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Usage Cost</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(aiUsageCost)}</div>
            <p className="text-xs text-muted-foreground">36% of total cost</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-5 mt-6">
        <Card className="md:col-span-3 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Cost Breakdown</CardTitle>
            <CardDescription>Total vs. AI cost over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <CostBreakdownChart data={costBreakdown} />
          </CardContent>
        </Card>
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">AI Cost by Service</CardTitle>
             <CardDescription>Monthly breakdown of costs per AI feature.</CardDescription>
          </CardHeader>
          <CardContent>
             <AiUsageChart data={aiCostByService} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
