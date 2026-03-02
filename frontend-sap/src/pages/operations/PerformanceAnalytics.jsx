import { BarChart3, TrendingUp, TrendingDown, Users, Clock } from "lucide-react";

export default function PerformanceAnalytics({ selectedProject = 'jne' }) {
  const getProjectConfig = () => {
    const configs = {
      jne: {
        title: 'JNE Performance Analytics',
        metrics: {
          onTimeRate: 87,
          customerSatisfaction: 92,
          averageDeliveryTime: 2.3,
          totalDeliveries: 1234,
          growth: 12
        },
        couriers: [
          { name: 'JNE REG', rate: 84, color: 'blue' },
          { name: 'JNE YES', rate: 91, color: 'green' },
          { name: 'JNE OKE', rate: 89, color: 'red' },
          { name: 'JNE JTR', rate: 87, color: 'orange' },
        ],
        monthly: [
          { month: 'January', deliveries: 1150, rate: 85 },
          { month: 'February', deliveries: 1234, rate: 87 },
          { month: 'March', deliveries: 1089, rate: 83 },
          { month: 'April', deliveries: 1345, rate: 88 },
        ]
      },
      mup: {
        title: 'MUP Performance Analytics',
        metrics: {
          onTimeRate: 85,
          customerSatisfaction: 90,
          averageDeliveryTime: 2.5,
          totalDeliveries: 892,
          growth: 15
        },
        couriers: [
          { name: 'Warehouse JKT Utara', rate: 90, color: 'blue' },
          { name: 'Warehouse Tangerang', rate: 87, color: 'green' },
          { name: 'Warehouse Bekasi', rate: 87, color: 'purple' },
          { name: 'Warehouse Depok', rate: 70, color: 'orange' },
        ],
        monthly: [
          { month: 'January', deliveries: 780, rate: 83 },
          { month: 'February', deliveries: 892, rate: 85 },
          { month: 'March', deliveries: 756, rate: 82 },
          { month: 'April', deliveries: 945, rate: 87 },
        ]
      },
      indomaret: {
        title: 'Indomaret Performance Analytics',
        metrics: {
          onTimeRate: 89,
          customerSatisfaction: 93,
          averageDeliveryTime: 2.0,
          totalDeliveries: 1567,
          growth: 18
        },
        couriers: [
          { name: 'Zone Jakarta', rate: 92, color: 'blue' },
          { name: 'Zone Bandung', rate: 89, color: 'green' },
          { name: 'Zone Surabaya', rate: 88, color: 'red' },
          { name: 'Zone Semarang', rate: 85, color: 'orange' },
        ],
        monthly: [
          { month: 'January', deliveries: 1450, rate: 87 },
          { month: 'February', deliveries: 1567, rate: 89 },
          { month: 'March', deliveries: 1389, rate: 86 },
          { month: 'April', deliveries: 1678, rate: 91 },
        ]
      },
      unilever: {
        title: 'Unilever Performance Analytics',
        metrics: {
          onTimeRate: 91,
          customerSatisfaction: 94,
          averageDeliveryTime: 1.8,
          totalDeliveries: 2134,
          growth: 22
        },
        couriers: [
          { name: 'Distribution Center 1', rate: 93, color: 'blue' },
          { name: 'Distribution Center 2', rate: 91, color: 'green' },
          { name: 'Distribution Center 3', rate: 90, color: 'purple' },
          { name: 'Distribution Center 4', rate: 88, color: 'orange' },
        ],
        monthly: [
          { month: 'January', deliveries: 1950, rate: 89 },
          { month: 'February', deliveries: 2134, rate: 91 },
          { month: 'March', deliveries: 1876, rate: 88 },
          { month: 'April', deliveries: 2345, rate: 93 },
        ]
      },
      wings: {
        title: 'Wings Performance Analytics',
        metrics: {
          onTimeRate: 88,
          customerSatisfaction: 91,
          averageDeliveryTime: 2.2,
          totalDeliveries: 1678,
          growth: 16
        },
        couriers: [
          { name: 'Route North', rate: 90, color: 'blue' },
          { name: 'Route South', rate: 88, color: 'green' },
          { name: 'Route East', rate: 87, color: 'red' },
          { name: 'Route West', rate: 86, color: 'orange' },
        ],
        monthly: [
          { month: 'January', deliveries: 1520, rate: 86 },
          { month: 'February', deliveries: 1678, rate: 88 },
          { month: 'March', deliveries: 1456, rate: 85 },
          { month: 'April', deliveries: 1789, rate: 90 },
        ]
      }
    };

    return configs[selectedProject] || configs.jne;
  };

  const config = getProjectConfig();
  const { title, metrics, couriers, monthly } = config;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </div>
        <p className="text-gray-600">Analisis performa delivery dan operational metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90">On-Time Delivery</p>
              <p className="text-3xl font-bold">{metrics.onTimeRate}%</p>
            </div>
            <Clock className="w-10 h-10 opacity-80" />
          </div>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp size={16} />
            <span>+5% vs last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90">Customer Satisfaction</p>
              <p className="text-3xl font-bold">{metrics.customerSatisfaction}%</p>
            </div>
            <Users className="w-10 h-10 opacity-80" />
          </div>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp size={16} />
            <span>+3% vs last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90">Avg Delivery Time</p>
              <p className="text-3xl font-bold">{metrics.averageDeliveryTime}d</p>
            </div>
            <Clock className="w-10 h-10 opacity-80" />
          </div>
          <div className="flex items-center gap-1 text-sm">
            <TrendingDown size={16} />
            <span>-0.2d vs last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90">Total Deliveries</p>
              <p className="text-3xl font-bold">{metrics.totalDeliveries}</p>
            </div>
            <BarChart3 className="w-10 h-10 opacity-80" />
          </div>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp size={16} />
            <span>+{metrics.growth}% growth</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Performance by Region/Service</h3>
          <div className="space-y-4">
            {couriers.map((courier) => (
              <div key={courier.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{courier.name}</span>
                  <span className="font-semibold text-gray-900">{courier.rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-${courier.color}-500 h-2 rounded-full`}
                    style={{ width: `${courier.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Trends</h3>
          <div className="space-y-3">
            {monthly.map((data) => (
              <div key={data.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">{data.month}</p>
                  <p className="text-sm text-gray-600">{data.deliveries} deliveries</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">{data.rate}% on-time</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}