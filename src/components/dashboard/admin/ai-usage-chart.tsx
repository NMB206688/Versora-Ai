'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AiUsageChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            nameKey="service"
            paddingAngle={5}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
