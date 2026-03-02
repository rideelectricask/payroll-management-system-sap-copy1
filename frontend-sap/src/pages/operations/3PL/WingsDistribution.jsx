import { useState, useEffect, useCallback } from "react";
import { Package, TrendingUp, CheckCircle, Truck, Clock, MapPin, RefreshCw, Loader2, Sparkles, Warehouse } from "lucide-react";

export default function WingsDistribution() {
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const statistics = {
    total: 523,
    delivered: 441,
    inTransit: 64,
    processing: 18,
    warehouses: 6,
    totalWeight: 15834.7,
    retailers: 234,
    activeRoutes: 16
  };

  const warehouseData = [
    { name: 'DC Jakarta', orders: 187, delivered: 159, rate: 85, coverage: 'Jabodetabek' },
    { name: 'DC Surabaya', orders: 145, delivered: 128, rate: 88, coverage: 'Jawa Timur' },
    { name: 'DC Semarang', orders: 98, delivered: 78, rate: 80, coverage: 'Jawa Tengah' },
    { name: 'DC Medan', orders: 93, delivered: 76, rate: 82, coverage: 'Sumatera Utara' }
  ];

  const productLines = [
    { name: 'Detergent', percentage: 35 },
    { name: 'Fabric Care', percentage: 28 },
    { name: 'Personal Care', percentage: 22 },
    { name: 'Home Care', percentage: 15 }
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
      <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-10 h-10" />
            <div>
              <h2 className="text-2xl font-bold">Wings Distribution</h2>
              <p className="text-sm opacity-90">Consumer Goods Distribution</p>
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
            <Package className="w-8 h-8 text-red-600 opacity-80" />
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
              <p className="text-gray-600 text-sm font-medium">Warehouses</p>
              <p className="text-2xl font-bold text-pink-600">{statistics.warehouses}</p>
            </div>
            <Warehouse className="w-8 h-8 text-pink-600 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Retailers</p>
              <p className="text-2xl font-bold text-purple-600">{statistics.retailers}</p>
            </div>
            <MapPin className="w-8 h-8 text-purple-600 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-red-600" />
            Distribution Centers
          </h3>
          <div className="space-y-3">
            {warehouseData.map((warehouse) => (
              <div key={warehouse.name} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{warehouse.name}</h4>
                    <p className="text-xs text-gray-600">{warehouse.coverage}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600">{warehouse.rate}%</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                  <div>
                    <p className="text-xs">Orders</p>
                    <p className="font-semibold text-gray-900">{warehouse.orders}</p>
                  </div>
                  <div>
                    <p className="text-xs">Delivered</p>
                    <p className="font-semibold text-green-600">{warehouse.delivered}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${warehouse.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-600" />
            Product Distribution
          </h3>
          <div className="space-y-4 mb-6">
            {productLines.map((product) => (
              <div key={product.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{product.name}</span>
                  <span className="font-semibold text-gray-900">{product.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full"
                    style={{ width: `${product.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Active Routes</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.activeRoutes}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-orange-600">{statistics.inTransit}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-600 to-pink-600 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Operational Excellence</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm opacity-90">Avg Delivery Time</p>
            <p className="text-2xl font-bold">1.9 days</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm opacity-90">On-Time Rate</p>
            <p className="text-2xl font-bold">84%</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm opacity-90">Retail Coverage</p>
            <p className="text-2xl font-bold">95%</p>
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