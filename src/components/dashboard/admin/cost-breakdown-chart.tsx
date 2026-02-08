'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

export function CostBreakdownChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => formatCurrency(value as number)} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend wrapperStyle={{fontSize: "12px"}}/>
          <Bar dataKey="total" fill="hsl(var(--primary))" name="Total Cost" radius={[4, 4, 0, 0]} />
          <Bar dataKey="ai" fill="hsl(var(--accent))" name="AI Cost" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
