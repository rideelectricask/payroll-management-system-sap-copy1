import React from "react";
import { User, TrendingUp, Users, FileText } from "lucide-react";

export default function Profile() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-rose-50 rounded-lg">
              <User className="w-8 h-8 text-rose-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Profile</h1>
              <p className="text-slate-600 text-lg">Manajemen Data Personal & Preferensi User</p>
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
            <TrendingUp className="w-5 h-5 text-rose-600" />
            Konteks Bisnis
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed mb-4">
              Halaman profile sebagai <strong>central hub untuk informasi personal</strong> setiap user dalam sistem. Mendukung personalisasi experience dan customization preferences untuk berbagai role: operations manager, driver/mitra, admin, dan customer service.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Menyediakan akses ke <strong>personal data, work information, dan preferences</strong> yang terintegrasi dengan seluruh modul sistem untuk ensure consistency dan data accuracy dalam ekosistem bisnis jasa, outsourcing, mobile selling, dan logistics delivery.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-600" />
            Fitur yang Akan Dikembangkan
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-rose-500 bg-rose-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Personal Information</h3>
              <p className="text-slate-600 text-sm">Data diri lengkap: nama, email, phone, address, emergency contact dengan photo profile dan document upload (KTP, SIM, NPWP).</p>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Work Information</h3>
              <p className="text-slate-600 text-sm">Employment details: position, department, employee ID, join date, reporting manager, work location untuk mitra dan internal staff.</p>
            </div>

            <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Certification & Documents</h3>
              <p className="text-slate-600 text-sm">Repository untuk certificates, licenses (SIM), training completion, dan important documents dengan expiry tracking dan automatic reminders.</p>
            </div>

            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Performance Overview</h3>
              <p className="text-slate-600 text-sm">Personal dashboard untuk delivery stats, attendance record, training completed, achievements, dan performance metrics untuk self-monitoring.</p>
            </div>

            <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Preferences & Customization</h3>
              <p className="text-slate-600 text-sm">User preferences: language, timezone, notification settings, dashboard layout untuk personalized user experience.</p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Security & Privacy</h3>
              <p className="text-slate-600 text-sm">Password management, two-factor authentication, login history, privacy settings, dan data access permissions untuk account security.</p>
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
              <p className="font-semibold mb-1">Mitra & Driver</p>
              <p className="text-sm text-slate-300">Update personal & work info</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Internal Staff</p>
              <p className="text-sm text-slate-300">Manage profile & preferences</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Semua Role</p>
              <p className="text-sm text-slate-300">Personalisasi experience</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}