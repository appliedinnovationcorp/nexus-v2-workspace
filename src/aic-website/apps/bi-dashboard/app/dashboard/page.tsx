'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MetricCard } from '@/components/widgets/metric-card';
import { ChartContainer } from '@/components/widgets/chart-container';
import { DataTable } from '@/components/widgets/data-table';
import { ChartWidget } from '@/components/widgets/chart-widget';
import { KPIWidget } from '@/components/widgets/kpi-widget';
import {
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  Activity,
  Globe,
} from 'lucide-react';

// Mock data
const mockMetrics = {
  revenue: { current: 125000, previous: 108000 },
  users: { current: 2847, previous: 2654 },
  orders: { current: 1234, previous: 1156 },
  conversion: { current: 3.2, previous: 2.8 },
};

const mockChartData = [
  { name: 'Jan', value: 4000, users: 2400 },
  { name: 'Feb', value: 3000, users: 1398 },
  { name: 'Mar', value: 2000, users: 9800 },
  { name: 'Apr', value: 2780, users: 3908 },
  { name: 'May', value: 1890, users: 4800 },
  { name: 'Jun', value: 2390, users: 3800 },
];

const mockTableData = [
  { id: 1, name: 'Product A', sales: 1234, revenue: 45000, growth: 12.5 },
  { id: 2, name: 'Product B', sales: 987, revenue: 32000, growth: -2.3 },
  { id: 3, name: 'Product C', sales: 756, revenue: 28000, growth: 8.7 },
  { id: 4, name: 'Product D', sales: 543, revenue: 19000, growth: 15.2 },
  { id: 5, name: 'Product E', sales: 432, revenue: 16000, growth: -5.1 },
];

const tableColumns = [
  { key: 'name', label: 'Product Name', sortable: true },
  { key: 'sales', label: 'Sales', sortable: true, align: 'right' as const },
  { key: 'revenue', label: 'Revenue', sortable: true, align: 'right' as const, render: (value: number) => `$${value.toLocaleString()}` },
  { key: 'growth', label: 'Growth %', sortable: true, align: 'right' as const, render: (value: number) => (
    <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
      {value >= 0 ? '+' : ''}{value}%
    </span>
  )},
];

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={mockMetrics.revenue.current}
            previousValue={mockMetrics.revenue.previous}
            format="currency"
            icon={DollarSign}
            color="green"
          />
          <MetricCard
            title="Active Users"
            value={mockMetrics.users.current}
            previousValue={mockMetrics.users.previous}
            format="number"
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Total Orders"
            value={mockMetrics.orders.current}
            previousValue={mockMetrics.orders.previous}
            format="number"
            icon={ShoppingCart}
            color="purple"
          />
          <MetricCard
            title="Conversion Rate"
            value={mockMetrics.conversion.current}
            previousValue={mockMetrics.conversion.previous}
            format="percentage"
            icon={TrendingUp}
            color="yellow"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            title="Revenue Trend"
            subtitle="Monthly revenue over time"
          >
            <ChartWidget
              type="line"
              data={mockChartData}
              dataKey="value"
              height={300}
              color="#3B82F6"
            />
          </ChartContainer>

          <ChartContainer
            title="User Growth"
            subtitle="Active users by month"
          >
            <ChartWidget
              type="bar"
              data={mockChartData}
              dataKey="users"
              height={300}
              color="#10B981"
            />
          </ChartContainer>
        </div>

        {/* KPI Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <KPIWidget
            title="Monthly Recurring Revenue"
            value={85000}
            target={100000}
            format="currency"
            icon={Activity}
            trend="up"
            trendValue={12.5}
          />
          <KPIWidget
            title="Customer Acquisition Cost"
            value={45}
            target={40}
            format="currency"
            icon={Users}
            trend="down"
            trendValue={-8.2}
          />
          <KPIWidget
            title="Global Reach"
            value={127}
            target={150}
            format="number"
            icon={Globe}
            trend="up"
            trendValue={5.3}
            suffix="countries"
          />
        </div>

        {/* Data Table */}
        <DataTable
          title="Top Products"
          columns={tableColumns}
          data={mockTableData}
          searchable
          sortable
          exportable
          onExport={() => console.log('Export data')}
          onRowClick={(row) => console.log('Row clicked:', row)}
        />
      </div>
    </DashboardLayout>
  );
}
