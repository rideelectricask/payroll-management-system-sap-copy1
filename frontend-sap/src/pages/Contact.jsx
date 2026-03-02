import React from "react";
import { Users, TrendingUp, FileText } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-cyan-50 rounded-lg">
              <Users className="w-8 h-8 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Contact Management</h1>
              <p className="text-slate-600 text-lg">Database Kontak Customer, Mitra & Stakeholder</p>
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
            <TrendingUp className="w-5 h-5 text-cyan-600" />
            Konteks Bisnis
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed mb-4">
              Contact management system untuk mengelola relationship dengan berbagai stakeholder dalam <strong>bisnis logistics dan outsourcing services</strong>. Menyimpan informasi lengkap customer untuk delivery scheduling, contact details mitra untuk coordination, supplier information untuk procurement, dan partner data untuk collaboration.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Mendukung <strong>CRM functionality</strong> dengan tracking customer interactions, order history, dan payment patterns untuk better service delivery dan business development dalam industri jasa, mobile selling, dan logistics delivery dengan network stakeholder yang luas.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-600" />
            Fitur yang Akan Dikembangkan
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-cyan-500 bg-cyan-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Centralized Database</h3>
              <p className="text-slate-600 text-sm">Single source of truth untuk contact information: customers, suppliers, mitra, vendors, partners dengan complete profile dan custom fields.</p>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Company Profiles</h3>
              <p className="text-slate-600 text-sm">Detailed company information dengan multiple contact persons, addresses, business terms, transaction history, dan relationship timeline.</p>
            </div>

            <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Contact Segmentation</h3>
              <p className="text-slate-600 text-sm">Kategorisasi contacts berdasarkan type: VIP customers, regular clients, active mitra, suppliers dengan tagging dan smart lists.</p>
            </div>

            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Communication History</h3>
              <p className="text-slate-600 text-sm">Track semua interactions: phone calls, emails, meetings, notes untuk better relationship management dan context awareness.</p>
            </div>

            <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Advanced Search</h3>
              <p className="text-slate-600 text-sm">Quick search dengan multiple filters: name, company, location, category, tags, last contact date untuk instant access dan reporting.</p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Relationship Insights</h3>
              <p className="text-slate-600 text-sm">Analytics on customer lifetime value, order frequency, payment behavior, engagement level, dan churn prediction untuk strategic planning.</p>
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
              <p className="font-semibold mb-1">Sales Team</p>
              <p className="text-sm text-slate-300">Customer relationship & leads</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Operations Team</p>
              <p className="text-sm text-slate-300">Mitra & supplier coordination</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Customer Service</p>
              <p className="text-sm text-slate-300">Support & inquiry handling</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}