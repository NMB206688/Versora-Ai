'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Users, Bot, BookCopy } from 'lucide-react';
import { CostBreakdownChart } from '@/components/dashboard/admin/cost-breakdown-chart';
import { AiUsageChart } from '@/components/dashboard/admin/ai-usage-chart';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const firestore = useFirestore();

  const aiCostLogsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'aiCostLogs');
  }, [firestore]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'courses');
  }, [firestore]);

  const { data: costLogs, isLoading: isCostLoading } = useCollection(aiCostLogsQuery);
  const { data: users, isLoading: areUsersLoading } = useCollection(usersQuery);
  const { data: courses, isLoading: areCoursesLoading } = useCollection(coursesQuery);
  
  const isLoading = isCostLoading || areUsersLoading || areCoursesLoading;

  const { totalMonthlyCost, costPerStudent, aiUsageCost, costBreakdown, aiCostByService, studentCount, courseCount } = useMemo(() => {
    if (!costLogs || !users || !courses) {
      return { totalMonthlyCost: 0, costPerStudent: 0, aiUsageCost: 0, costBreakdown: [], aiCostByService: [], studentCount: 0, courseCount: 0 };
    }

    const currentAiUsageCost = costLogs.reduce((acc, log) => acc + log.totalCost, 0);
    const studentCount = users.filter(u => u.role === 'student').length;
    const courseCount = courses.length;

    // Mock other values for now, as we don't have historical data
    const totalMonthlyCost = 10000 + currentAiUsageCost * 1.5; // Mocking total cost
    const costPerStudent = studentCount > 0 ? totalMonthlyCost / studentCount : 0;

    // Process data for charts
    const costByServiceMap = costLogs.reduce((acc, log) => {
      const service = log.featureUsed || 'Other';
      if (!acc[service]) {
        acc[service] = 0;
      }
      acc[service] += log.totalCost;
      return acc;
    }, {} as Record<string, number>);
    
    const chartColors = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)'];
    const aiCostByService = Object.entries(costByServiceMap).map(([service, value], index) => ({
      service,
      value,
      fill: chartColors[index % chartColors.length],
    }));

    // Mock cost breakdown for the chart, using real AI cost for current month
    const costBreakdown = [
        { name: 'Jan', total: 11000, ai: 4000 },
        { name: 'Feb', total: 11200, ai: 4100 },
        { name: 'Mar', total: 11500, ai: 4200 },
        { name: 'Apr', total: 11800, ai: 4350 },
        { name: 'May', total: 12100, ai: 4400 },
        { name: 'Jun', total: totalMonthlyCost, ai: currentAiUsageCost },
    ];


    return { totalMonthlyCost, costPerStudent, aiUsageCost: currentAiUsageCost, costBreakdown, aiCostByService, studentCount, courseCount };

  }, [costLogs, users, courses]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  
  if (isLoading) {
    return (
        <div className="container mx-auto">
            <h1 className="font-headline text-3xl font-bold tracking-tight mb-6">
                Administrator Dashboard
            </h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Monthly Cost</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><Skeleton className="h-8 w-24" /><Skeleton className="h-4 w-32 mt-1" /></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Cost Per Student</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><Skeleton className="h-8 w-24" /><Skeleton className="h-4 w-20 mt-1" /></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Students</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /><Skeleton className="h-4 w-24 mt-1" /></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Courses</CardTitle><BookCopy className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /><Skeleton className="h-4 w-24 mt-1" /></CardContent></Card>
            </div>
            <div className="grid gap-6 md:grid-cols-5 mt-6">
                <Card className="md:col-span-3"><CardHeader><CardTitle className="font-headline text-xl">Cost Breakdown</CardTitle><CardDescription>Total vs. AI cost over the last 6 months.</CardDescription></CardHeader><CardContent><Skeleton className="h-[300px] w-full" /></CardContent></Card>
                <Card className="md:col-span-2"><CardHeader><CardTitle className="font-headline text-xl">AI Cost by Service</CardTitle><CardDescription>Monthly breakdown of costs per AI feature.</CardDescription></CardHeader><CardContent><Skeleton className="h-[300px] w-full" /></CardContent></Card>
            </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <h1 className="font-headline text-3xl font-bold tracking-tight mb-6">
        Administrator Dashboard
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
            <p className="text-xs text-muted-foreground">{users.length} total users</p>
          </CardContent>
        </Card>
         <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseCount}</div>
            <p className="text-xs text-muted-foreground">courses available</p>
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
