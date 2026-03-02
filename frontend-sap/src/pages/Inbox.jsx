import React from "react";
import { Inbox, TrendingUp, Users, FileText } from "lucide-react";

export default function InboxPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-teal-50 rounded-lg">
              <Inbox className="w-8 h-8 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Inbox</h1>
              <p className="text-slate-600 text-lg">Pusat Komunikasi & Informasi Penting</p>
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
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Konteks Bisnis
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed mb-4">
              Inbox sebagai <strong>central hub untuk information flow</strong> dan communication dalam ekosistem bisnis jasa dan logistics. Mengintegrasikan berbagai channels komunikasi untuk memastikan tidak ada informasi penting yang terlewat.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Mendukung coordination antara dispatch team, mitra driver, customer service, dan management dengan <strong>real-time messaging dan notification system</strong>. Dirancang untuk bisnis yang membutuhkan fast response time dan clear communication channels dalam operasional delivery, mobile selling, dan outsourcing services dengan high volume transactions dan multiple stakeholders.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Fitur yang Akan Dikembangkan
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-teal-500 bg-teal-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Unified Inbox</h3>
              <p className="text-slate-600 text-sm">Single platform untuk semua komunikasi: email, internal messages, customer inquiries, system alerts dengan unified interface dan smart threading.</p>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Smart Notifications</h3>
              <p className="text-slate-600 text-sm">Priority-based notifications dengan intelligent filtering: urgent alerts, task reminders, updates, announcements dengan customizable preferences.</p>
            </div>

            <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Internal Messaging</h3>
              <p className="text-slate-600 text-sm">Team communication tools untuk koordinasi real-time antara operations, mitra, dan management dengan group chat, direct message, dan broadcast features.</p>
            </div>

            <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Information Dashboard</h3>
              <p className="text-slate-600 text-sm">Centralized view untuk company announcements, operational updates, policy changes, dan important bulletins dengan categorization dan archive.</p>
            </div>

            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Search & Filter</h3>
              <p className="text-slate-600 text-sm">Advanced search capabilities dengan multiple filters: sender, date range, category, priority level, tags untuk quick access ke historical messages.</p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Document Sharing</h3>
              <p className="text-slate-600 text-sm">Attachment management untuk sharing SOPs, delivery notes, reports, reference documents dengan version control dan access management.</p>
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
              <p className="font-semibold mb-1">Operations Team</p>
              <p className="text-sm text-slate-300">Koordinasi operasional harian</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Mitra & Driver</p>
              <p className="text-sm text-slate-300">Terima update & instruksi</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Management</p>
              <p className="text-sm text-slate-300">Broadcast & announcements</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}