import React from "react";
import { BarChart3, TrendingUp, Users, FileText } from "lucide-react";

export default function ExecutiveOverviewDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-violet-50 rounded-lg">
              <BarChart3 className="w-8 h-8 text-violet-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Executive Overview Dashboard</h1>
              <p className="text-slate-600 text-lg">High-level Insights untuk Strategic Decision Making</p>
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
            <TrendingUp className="w-5 h-5 text-violet-600" />
            Konteks Bisnis
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed mb-4">
              Executive dashboard untuk <strong>C-level dan senior management</strong> dalam logistics dan delivery services. Menyediakan bird's eye view terhadap seluruh operasional bisnis mulai dari financial performance, operational efficiency, hingga strategic opportunities.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Mendukung <strong>data-driven decision making</strong> untuk ekspansi bisnis, cost optimization, dan service quality improvement dalam industri jasa outsourcing, mobile selling, dan logistics delivery.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" />
            Fitur yang Akan Dikembangkan
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-violet-500 bg-violet-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Key Performance Indicators</h3>
              <p className="text-slate-600 text-sm">Dashboard KPI utama: delivery success rate, on-time performance, cost per delivery, revenue growth, dan customer satisfaction score dengan visualisasi interaktif.</p>
            </div>

            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Revenue & Profitability</h3>
              <p className="text-slate-600 text-sm">Analisis revenue stream per service line, profit margin analysis, cost structure breakdown, dan identification of optimization opportunities untuk meningkatkan bottom line.</p>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Fleet Performance</h3>
              <p className="text-slate-600 text-sm">Utilization rate armada, maintenance costs tracking, fuel efficiency metrics, vehicle productivity, dan ROI analysis untuk setiap unit kendaraan.</p>
            </div>

            <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Workforce Analytics</h3>
              <p className="text-slate-600 text-sm">Analisis performa mitra dan driver, attendance trends, training completion rates, productivity benchmarks, dan employee satisfaction untuk workforce optimization.</p>
            </div>

            <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Growth Trends & Forecasting</h3>
              <p className="text-slate-600 text-sm">Historical trends analysis, revenue projection, order volume forecasting, market expansion opportunities, dan competitive positioning insights.</p>
            </div>

            <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Risk & Compliance</h3>
              <p className="text-slate-600 text-sm">Monitoring compliance status dengan regulasi, risk indicators identification, incident reports tracking, dan comprehensive audit trail untuk governance.</p>
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
              <p className="font-semibold mb-1">C-Level Executives</p>
              <p className="text-sm text-slate-300">Strategic decision making</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Senior Management</p>
              <p className="text-sm text-slate-300">Performance monitoring</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Business Analysts</p>
              <p className="text-sm text-slate-300">Data analysis & reporting</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}