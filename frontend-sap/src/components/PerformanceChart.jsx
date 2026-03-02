import React, { memo, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Line } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

const CustomTooltip = memo(({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value.toFixed(2)}%`}
          </p>
        ))}
      </div>
    );
  }
  return null;
});

const sampleData = (data, maxPoints = 50) => {
  if (!data || data.length <= maxPoints) return data;
  
  const step = Math.floor(data.length / maxPoints);
  const sampled = [];
  
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }
  
  if (sampled.length < maxPoints && sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }
  
  return sampled;
};

export const PerformanceChart = memo(({ data, title }) => {
  const chartData = useMemo(() => sampleData(data, 30), [data]);
  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="nama" 
          angle={-45} 
          textAnchor="end" 
          height={80}
          fontSize={11}
          stroke="#666"
          interval={0}
        />
        <YAxis 
          domain={[94, 101]} 
          fontSize={11}
          stroke="#666"
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="tepatWaktu" 
          fill="#10B981" 
          name="On-Time Performance (%)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

export const VolumeChart = memo(({ data }) => {
  const chartData = useMemo(() => sampleData(data, 20), [data]);
  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value.toLocaleString(), 'Shipments']} />
      </PieChart>
    </ResponsiveContainer>
  );
});

export const TrendChart = memo(({ data }) => {
  const chartData = useMemo(() => sampleData(data, 40), [data]);
  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="lokasi" 
          angle={-45} 
          textAnchor="end" 
          height={80}
          fontSize={11}
          interval={0}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="performance"
          stackId="1"
          stroke="#3B82F6"
          fill="#3B82F6"
          fillOpacity={0.6}
          name="Performance %"
        />
        <Line
          type="monotone"
          dataKey="volume"
          stroke="#10B981"
          strokeWidth={3}
          name="Volume (scaled)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export const DelayChart = memo(({ data }) => {
  const chartData = useMemo(() => {
    const reversed = [...data].reverse();
    return sampleData(reversed, 30);
  }, [data]);
  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="nama" 
          angle={-45} 
          textAnchor="end" 
          height={80}
          fontSize={11}
          stroke="#666"
          interval={0}
        />
        <YAxis 
          fontSize={11}
          stroke="#666"
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip 
          formatter={(value, name) => [`${value}%`, name === 'terlambat' ? 'Delay Rate' : name]}
        />
        <Legend />
        <Bar 
          dataKey="terlambat" 
          fill="#EF4444" 
          name="Delay Rate (%)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

CustomTooltip.displayName = 'CustomTooltip';
PerformanceChart.displayName = 'PerformanceChart';
VolumeChart.displayName = 'VolumeChart';
TrendChart.displayName = 'TrendChart';
DelayChart.displayName = 'DelayChart';