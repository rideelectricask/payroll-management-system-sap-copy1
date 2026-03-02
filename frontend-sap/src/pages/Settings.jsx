import React from "react";
import { Settings, TrendingUp, Users, FileText } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-slate-50 rounded-lg">
              <Settings className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Settings</h1>
              <p className="text-slate-600 text-lg">Konfigurasi Sistem & Preferensi Aplikasi</p>
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
            <TrendingUp className="w-5 h-5 text-slate-600" />
            Konteks Bisnis
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed mb-4">
              Halaman settings sebagai <strong>control center untuk konfigurasi sistem</strong> yang digunakan oleh admin dan management. Menyediakan tools untuk customize aplikasi sesuai dengan kebutuhan operasional bisnis logistics, delivery, dan jasa outsourcing.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Mencakup pengaturan untuk <strong>business rules, integrations, notifications, dan system preferences</strong> yang mempengaruhi seluruh ekosistem platform untuk ensure optimal performance dan user experience di industri mobile selling dan logistics delivery.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            Fitur yang Akan Dikembangkan
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-slate-500 bg-slate-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Company Settings</h3>
              <p className="text-slate-600 text-sm">Konfigurasi company profile, business information, logo, timezone, currency, fiscal year untuk operational standards.</p>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">User Management</h3>
              <p className="text-slate-600 text-sm">Admin tools untuk manage users, roles, permissions, access control, dan user groups dengan granular permission settings.</p>
            </div>

            <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Integration Settings</h3>
              <p className="text-slate-600 text-sm">Konfigurasi API integrations dengan third-party systems: payment gateway, mapping service, SMS provider, email service.</p>
            </div>

            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Notification Preferences</h3>
              <p className="text-slate-600 text-sm">Setup notification rules, email templates, SMS templates, push notification settings, dan alert thresholds untuk berbagai events.</p>
            </div>

            <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Business Rules</h3>
              <p className="text-slate-600 text-sm">Konfigurasi operational rules: delivery zones, pricing rules, SLA definitions, overtime calculation, leave policies.</p>
            </div>

            <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">System Maintenance</h3>
              <p className="text-slate-600 text-sm">Tools untuk backup & restore, audit logs, system health monitoring, database maintenance, dan troubleshooting utilities.</p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Appearance & Localization</h3>
              <p className="text-slate-600 text-sm">Customize UI theme, language settings, date/time formats, number formats untuk multi-region operations.</p>
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
              <p className="font-semibold mb-1">System Administrator</p>
              <p className="text-sm text-slate-300">Full system configuration</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">IT Manager</p>
              <p className="text-sm text-slate-300">Integration & maintenance</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Operations Director</p>
              <p className="text-sm text-slate-300">Business rules & policies</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}