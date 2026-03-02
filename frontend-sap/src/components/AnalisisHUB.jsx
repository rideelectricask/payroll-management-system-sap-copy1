import React, { useState, memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import * as ReactWindow from 'react-window';
import { useAnalysisData } from '../hooks/useAnalysisData';
import { PerformanceChart, VolumeChart, TrendChart, DelayChart } from '../components/PerformanceChart';

const FixedSizeList = ReactWindow.FixedSizeList;

const MetricCard = memo(({ title, value, subtitle, icon: Icon, color, bgColor }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${color} hover:shadow-xl transition-shadow`}>
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
        <p className={`text-3xl font-bold ${bgColor} mt-1`}>{value}</p>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      <div className={`p-3 ${bgColor.replace('text-', 'bg-').replace('-600', '-100')} rounded-full`}>
        <Icon className={`w-6 h-6 ${bgColor}`} />
      </div>
    </div>
  </div>
));

const TabButton = memo(({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      active 
        ? 'bg-blue-500 text-white' 
        : 'text-gray-600 hover:text-blue-500'
    }`}
  >
    {children}
  </button>
));

const TableRow = memo(({ index, style, data }) => {
  const item = data[index];
  const rankClass = index === 0 ? 'bg-yellow-100 text-yellow-800' :
                   index === 1 ? 'bg-gray-100 text-gray-800' :
                   index === 2 ? 'bg-orange-100 text-orange-800' :
                   'bg-blue-100 text-blue-800';

  return (
    <div style={style} className="flex items-center hover:bg-gray-50 transition-colors border-b !border-gray-300">
      <div className="flex-shrink-0 w-20 px-6 py-4">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${rankClass}`}>
          {index + 1}
        </span>
      </div>
      <div className="flex-1 min-w-0 px-6 py-4">
        <div className="text-sm font-medium text-gray-900 truncate">{item.lokasi}</div>
      </div>
      <div className="flex-shrink-0 w-32 px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          item.kategori === 'Hub Utama' ? 'bg-blue-100 text-blue-800' :
          item.kategori === 'Hub Satelit' ? 'bg-purple-100 text-purple-800' :
          'bg-green-100 text-green-800'
        }`}>
          {item.kategori}
        </span>
      </div>
      <div className="flex-shrink-0 w-32 px-6 py-4">
        <div className="text-sm font-semibold text-gray-900">{item.totalPengiriman.toLocaleString()}</div>
      </div>
      <div className="flex-shrink-0 w-24 px-6 py-4">
        <div className="text-sm font-semibold text-red-600">{item.terlambat}</div>
      </div>
      <div className="flex-shrink-0 w-40 px-6 py-4">
        <div className="flex items-center">
          <div className="text-sm font-semibold text-green-600">{item.persentaseTepat.toFixed(2)}%</div>
          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${Math.min(item.persentaseTepat, 100)}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 w-32 px-6 py-4">
        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
          item.persentaseTepat >= 99.5 ? 'bg-green-100 text-green-800' :
          item.persentaseTepat >= 98 ? 'bg-blue-100 text-blue-800' :
          item.persentaseTepat >= 97 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {item.tingkatKinerja}
        </span>
      </div>
    </div>
  );
});

const VirtualizedTable = memo(({ data, height = 600 }) => {
  const itemHeight = 80;
  const itemCount = data.length;
  const itemData = useMemo(() => data, [data]);

  return (
    <div className="overflow-hidden">
      <div className="bg-gray-50 sticky top-0 z-10 flex items-center border-b !border-gray-300">
        <div className="flex-shrink-0 w-20 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</div>
        <div className="flex-1 min-w-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</div>
        <div className="flex-shrink-0 w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</div>
        <div className="flex-shrink-0 w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</div>
        <div className="flex-shrink-0 w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delays</div>
        <div className="flex-shrink-0 w-40 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</div>
        <div className="flex-shrink-0 w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</div>
      </div>
      <div className="bg-white">
        <FixedSizeList
          height={height}
          itemCount={itemCount}
          itemSize={itemHeight}
          itemData={itemData}
          overscanCount={5}
        >
          {TableRow}
        </FixedSizeList>
      </div>
    </div>
  );
});

const PerformanceTable = memo(({ data }) => {
  const shouldUseVirtualization = data.length > 100;

  if (shouldUseVirtualization) {
    return <VirtualizedTable data={data} height={600} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y !border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delays</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y !border-gray-300">
          {data.map((item, index) => (
            <tr key={`${item.lokasi}-${index}`} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{item.lokasi}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  item.kategori === 'Hub Utama' ? 'bg-blue-100 text-blue-800' :
                  item.kategori === 'Hub Satelit' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {item.kategori}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">{item.totalPengiriman.toLocaleString()}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-red-600">{item.terlambat}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-sm font-semibold text-green-600">{item.persentaseTepat.toFixed(2)}%</div>
                  <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(item.persentaseTepat, 100)}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                  item.persentaseTepat >= 99.5 ? 'bg-green-100 text-green-800' :
                  item.persentaseTepat >= 98 ? 'bg-blue-100 text-blue-800' :
                  item.persentaseTepat >= 97 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.tingkatKinerja}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const InsightCard = memo(({ title, icon: Icon, color, bgColor, children }) => (
  <div className={`bg-gradient-to-br ${bgColor} rounded-lg p-5 border-l-4 ${color}`}>
    <h4 className={`font-bold ${color.replace('border-', 'text-').replace('-500', '-800')} mb-3 flex items-center`}>
      <Icon className="w-5 h-5 mr-2" />
      {title}
    </h4>
    {children}
  </div>
));

const AnalisisHUB = ({ hubAnalysisData }) => {
  const [selectedMetric, setSelectedMetric] = useState('performance');
  const { data, summaryMetrics, chartData, insights, sortedData, isLoading, clearCache } = useAnalysisData(hubAnalysisData);

  const handleMetricChange = useCallback((metric) => {
    setSelectedMetric(metric);
  }, []);

  const topPerformer = useMemo(() => sortedData?.[0], [sortedData]);

  const chartComponent = useMemo(() => {
    if (!chartData) return null;

    switch (selectedMetric) {
      case 'performance':
        return (
          <>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-500" />
              Performance Ranking by Location
            </h3>
            <PerformanceChart data={chartData.performanceData} />
          </>
        );
      case 'volume':
        return (
          <>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Volume Distribution by Location
            </h3>
            <VolumeChart data={chartData.volumeData} />
          </>
        );
      case 'trend':
        return (
          <>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Performance vs Volume Correlation
            </h3>
            <TrendChart data={chartData.trendData} />
          </>
        );
      default:
        return null;
    }
  }, [selectedMetric, chartData]);

  useEffect(() => {
    return () => {
      clearCache();
    };
  }, [clearCache]);

  if (isLoading || !data || !summaryMetrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analysis data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Analytics Dashboard Performa Pengiriman
          </h1>
          <p className="text-lg text-gray-600">Analisis Komprehensif Kinerja Delivery Operations</p>
          <div className="mt-4 flex justify-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <Clock className="w-4 h-4 mr-1" />
              Real-time Analysis
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <Target className="w-4 h-4 mr-1" />
              KPI Monitoring
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Pengiriman"
            value={summaryMetrics.totalPengiriman.toLocaleString()}
            subtitle="shipments"
            icon={TrendingUp}
            color="border-blue-500"
            bgColor="text-blue-600"
          />
          <MetricCard
            title="Tepat Waktu"
            value={summaryMetrics.tepatWaktu.toLocaleString()}
            subtitle={`${summaryMetrics.avgPerformance.toFixed(1)}% success rate`}
            icon={CheckCircle}
            color="border-green-500"
            bgColor="text-green-600"
          />
          <MetricCard
            title="Keterlambatan"
            value={summaryMetrics.totalTerlambat.toLocaleString()}
            subtitle={`${summaryMetrics.keterlambatanRate.toFixed(2)}% delay rate`}
            icon={AlertTriangle}
            color="border-red-500"
            bgColor="text-red-600"
          />
          <MetricCard
            title="Top Performer"
            value={topPerformer?.shortName || 'N/A'}
            subtitle={`${topPerformer?.persentaseTepat.toFixed(2)}% Perfect Score`}
            icon={Target}
            color="border-purple-500"
            bgColor="text-purple-600"
          />
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg p-1 shadow-md">
            <TabButton
              active={selectedMetric === 'performance'}
              onClick={() => handleMetricChange('performance')}
            >
              Performance Analysis
            </TabButton>
            <TabButton
              active={selectedMetric === 'volume'}
              onClick={() => handleMetricChange('volume')}
            >
              Volume Distribution
            </TabButton>
            <TabButton
              active={selectedMetric === 'trend'}
              onClick={() => handleMetricChange('trend')}
            >
              Trend Analysis
            </TabButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            {chartComponent}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Delay Analysis by Location
            </h3>
            <DelayChart data={chartData.performanceData} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b !border-gray-300">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-500" />
              Detailed Performance Metrics
            </h3>
          </div>
          <PerformanceTable data={sortedData} />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Strategic Insights & Recommendations
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <InsightCard
              title="Top Performers"
              icon={CheckCircle}
              color="border-green-500"
              bgColor="from-green-50 to-emerald-50"
            >
              <div className="space-y-2 text-sm">
                {insights.topPerformers.map((item, index) => (
                  <div key={item.lokasi} className="flex justify-between">
                    <span className="text-gray-700">
                      {index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'} {item.shortName}
                    </span>
                    <span className="font-semibold text-green-600">{item.persentaseTepat.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-green-100 rounded-md">
                <p className="text-xs text-green-800">
                  <strong>Key Success Factors:</strong> Smaller volumes with focused operations, effective local management
                </p>
              </div>
            </InsightCard>

            <InsightCard
              title="Priority Areas"
              icon={AlertTriangle}
              color="border-red-500"
              bgColor="from-red-50 to-rose-50"
            >
              <div className="space-y-2 text-sm">
                {insights.priorityAreas.map((item, index) => (
                  <div key={item.lokasi} className="flex justify-between">
                    <span className="text-gray-700">⚠️ {item.shortName}</span>
                    <span className="font-semibold text-red-600">{item.selisihPersentase.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-red-100 rounded-md">
                <p className="text-xs text-red-800">
                  <strong>Action Required:</strong> Process optimization, capacity planning, route analysis
                </p>
              </div>
            </InsightCard>

            <InsightCard
              title="Business Impact"
              icon={Target}
              color="border-blue-500"
              bgColor="from-blue-50 to-indigo-50"
            >
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Network Performance</span>
                  <span className="font-semibold text-blue-600">{summaryMetrics.avgPerformance.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Volume Leaders</span>
                  <span className="font-semibold text-blue-600">{insights.volumeLeaders.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Cost of Delays</span>
                  <span className="font-semibold text-red-600">{summaryMetrics.totalTerlambat.toLocaleString()} shipments</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-100 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>Recommendation:</strong> Focus on high-volume locations for maximum impact
                </p>
              </div>
            </InsightCard>
          </div>
        </div>
      </div>
    </div>
  );
};

MetricCard.displayName = 'MetricCard';
TabButton.displayName = 'TabButton';
TableRow.displayName = 'TableRow';
VirtualizedTable.displayName = 'VirtualizedTable';
PerformanceTable.displayName = 'PerformanceTable';
InsightCard.displayName = 'InsightCard';

export default AnalisisHUB;