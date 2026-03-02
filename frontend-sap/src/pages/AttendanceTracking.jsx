import React from "react";
import { Clock, TrendingUp, Users, FileText } from "lucide-react";

export default function AttendanceTracking() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-sky-50 rounded-lg">
              <Clock className="w-8 h-8 text-sky-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Attendance Tracking</h1>
              <p className="text-slate-600 text-lg">Sistem Absensi & Manajemen Kehadiran Mitra</p>
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
            <TrendingUp className="w-5 h-5 text-sky-600" />
            Konteks Bisnis
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed mb-4">
              Sistem attendance tracking untuk manajemen workforce dalam <strong>bisnis jasa dan outsourcing</strong>. Dirancang untuk monitoring kehadiran mitra delivery, driver, field staff, dan tenaga kerja outsourcing dengan fitur mobile-first approach.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Mendukung compliance terhadap <strong>labor regulations</strong>, payroll accuracy, dan workforce productivity optimization. Terintegrasi dengan sistem payroll untuk automatic salary calculation berdasarkan actual working hours dan overtime.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            Fitur yang Akan Dikembangkan
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-sky-500 bg-sky-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Mobile Clock In/Out</h3>
              <p className="text-slate-600 text-sm">Absensi via mobile app dengan GPS verification untuk memastikan lokasi kehadiran mitra outsourcing, photo capture, dan real-time sync ke server.</p>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Shift Scheduling</h3>
              <p className="text-slate-600 text-sm">Buat dan kelola shift schedule untuk workforce dengan automated conflict detection, notifications, drag-and-drop interface, dan template management.</p>
            </div>

            <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Overtime Management</h3>
              <p className="text-slate-600 text-sm">Tracking overtime hours dengan approval workflow, automatic calculation based on labor rules, dan integration dengan payroll system untuk compensation.</p>
            </div>

            <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Leave Management</h3>
              <p className="text-slate-600 text-sm">Sistem cuti dan izin kerja dengan approval process, leave balance tracking, calendar integration, dan automatic notification ke team dan supervisor.</p>
            </div>

            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Attendance Reports</h3>
              <p className="text-slate-600 text-sm">Laporan kehadiran komprehensif: daily attendance logs, absence patterns, punctuality metrics, trend analysis, dan customizable report formats.</p>
            </div>

            <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Alert & Notifications</h3>
              <p className="text-slate-600 text-sm">Real-time alerts untuk late attendance, no-show, schedule changes, shift reminders, dan emergency broadcasts ke seluruh workforce.</p>
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
              <p className="font-semibold mb-1">HR Department</p>
              <p className="text-sm text-slate-300">Manajemen kehadiran workforce</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Operations Supervisor</p>
              <p className="text-sm text-slate-300">Monitoring kehadiran real-time</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Mitra & Driver</p>
              <p className="text-sm text-slate-300">Clock in/out & cuti</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}