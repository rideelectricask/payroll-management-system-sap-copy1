import React from "react";
import { Warehouse, TrendingUp, Users, FileText } from "lucide-react";

export default function InventoryControl() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <Warehouse className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Inventory Control</h1>
              <p className="text-slate-600 text-lg">Sistem Kontrol Stok & Warehouse Operations</p>
            </div>
          </div>
          
          <div className="border-t border-slate-200 pt-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium mb-4">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              Dalam Tahap Development
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Konteks Bisnis
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed mb-4">
              Sistem inventory control untuk mendukung operasional <strong>logistics dan distribution</strong>. Mencakup warehouse management, stock optimization, dan integration dengan order fulfillment process.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Dirancang untuk bisnis yang bergerak di bidang <strong>jasa distribusi, mobile selling, dan logistics outsourcing</strong> dengan kebutuhan visibility real-time terhadap inventory status, automated reordering, dan efficient space utilization di warehouse facilities.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Fitur yang Akan Dikembangkan
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Real-time Stock Level</h3>
              <p className="text-slate-600 text-sm">Monitor level stok secara real-time dengan alert otomatis untuk low stock dan overstock situations, termasuk dashboard visual untuk quick overview.</p>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Stock Movement Tracking</h3>
              <p className="text-slate-600 text-sm">Pencatatan lengkap setiap pergerakan barang: inbound dari supplier, outbound ke customer, dan transfer antar warehouse dengan audit trail lengkap.</p>
            </div>

            <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Multi-Warehouse Management</h3>
              <p className="text-slate-600 text-sm">Kelola inventory di multiple warehouse locations dengan visibility penuh across all facilities, sinkronisasi real-time, dan transfer optimization.</p>
            </div>

            <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">ABC Analysis</h3>
              <p className="text-slate-600 text-sm">Kategorisasi produk berdasarkan value dan turnover rate untuk optimasi storage placement, handling strategy, dan resource allocation.</p>
            </div>

            <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Batch & Serial Tracking</h3>
              <p className="text-slate-600 text-sm">Pelacakan batch number dan serial number untuk compliance, quality control, recall management, dan traceability requirements.</p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Demand Forecasting</h3>
              <p className="text-slate-600 text-sm">Prediksi demand menggunakan historical data dan machine learning untuk optimal reorder point, safety stock level, dan purchasing decisions.</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-sm border border-slate-700 p-8 text-white">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Target Pengguna
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Warehouse Manager</p>
              <p className="text-sm text-slate-300">Kontrol operasional gudang</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Inventory Planner</p>
              <p className="text-sm text-slate-300">Perencanaan & forecasting stok</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Procurement Team</p>
              <p className="text-sm text-slate-300">Reorder & purchasing decisions</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}