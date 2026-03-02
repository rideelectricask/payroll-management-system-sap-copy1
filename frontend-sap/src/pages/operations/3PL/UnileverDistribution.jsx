import { useState, useEffect, useCallback } from "react";
import { Package, TrendingUp, CheckCircle, Truck, Clock, MapPin, RefreshCw, Loader2, BoxIcon, Boxes } from "lucide-react";

export default function UnileverDistribution() {
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const statistics = {
    total: 634,
    delivered: 521,
    inTransit: 87,
    processing: 26,
    categories: 5,
    totalWeight: 18675.3,
    distributors: 45,
    activeRoutes: 18
  };

  const categoryData = [
    { name: 'Personal Care', orders: 245, delivered: 208, rate: 85, color: 'purple' },
    { name: 'Home Care', orders: 178, delivered: 155, rate: 87, color: 'blue' },
    { name: 'Foods & Beverages', orders: 134, delivered: 108, rate: 81, color: 'green' },
    { name: 'Ice Cream', orders: 77, delivered: 50, rate: 65, color: 'cyan' }
  ];

  const loadData = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLastUpdated(new Date().toLocaleString('id-ID'));
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Boxes className="w-10 h-10" />
            <div>
              <h2 className="text-2xl font-bold">Unilever Distribution</h2>
              <p className="text-sm opacity-90">FMCG Distribution Network</p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Refresh
          </button>
        </div>
        {lastUpdated && (
          <p className="text-xs opacity-75">Last updated: {lastUpdated}</p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{statistics.delivered}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Categories</p>
              <p className="text-2xl font-bold text-purple-600">{statistics.categories}</p>
            </div>
            <BoxIcon className="w-8 h-8 text-purple-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Distributors</p>
              <p className="text-2xl font-bold text-orange-600">{statistics.distributors}</p>
            </div>
            <Truck className="w-8 h-8 text-orange-600 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-purple-600" />
            Performance by Category
          </h3>
          <div className="space-y-4">
            {categoryData.map((category) => (
              <div key={category.name}>
                <div className="flex justify-between text-sm mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{category.name}</p>
                    <p className="text-xs text-gray-600">{category.orders} orders · {category.delivered} delivered</p>
                  </div>
                  <span className={`text-sm font-semibold text-${category.color}-600`}>{category.rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-${category.color}-500 h-2 rounded-full`}
                    style={{ width: `${category.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Distribution Status
          </h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Active Routes</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.activeRoutes}</p>
                </div>
                <Truck className="w-10 h-10 text-blue-600 opacity-80" />
              </div>
            </div>

            <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">In Transit</p>
                  <p className="text-2xl font-bold text-orange-600">{statistics.inTransit}</p>
                </div>
                <Clock className="w-10 h-10 text-orange-600 opacity-80" />
              </div>
            </div>

            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Processing</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.processing}</p>
                </div>
                <Package className="w-10 h-10 text-yellow-600 opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Supply Chain Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm opacity-90">Avg Delivery Time</p>
            <p className="text-2xl font-bold">2.1 days</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm opacity-90">On-Time Rate</p>
            <p className="text-2xl font-bold">82%</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm opacity-90">Distributor Satisfaction</p>
            <p className="text-2xl font-bold">88%</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm opacity-90">Total Weight</p>
            <p className="text-2xl font-bold">{(statistics.totalWeight / 1000).toFixed(1)}t</p>
          </div>
        </div>
      </div>
    </div>
  );
}