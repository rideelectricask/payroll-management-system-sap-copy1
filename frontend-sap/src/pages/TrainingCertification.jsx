import React from "react";
import { GraduationCap, TrendingUp, Users, FileText } from "lucide-react";

export default function TrainingCertification() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-orange-50 rounded-lg">
              <GraduationCap className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Training & Certification</h1>
              <p className="text-slate-600 text-lg">Sistem Pelatihan & Sertifikasi Kompetensi Mitra</p>
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
            <TrendingUp className="w-5 h-5 text-orange-600" />
            Konteks Bisnis
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed mb-4">
              Platform training dan certification untuk meningkatkan kompetensi workforce dalam <strong>bisnis jasa outsourcing</strong>. Mendukung onboarding program untuk mitra baru, continuous skill development, dan compliance terhadap regulasi industri logistics dan delivery.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Dirancang untuk memastikan semua mitra memiliki <strong>kualifikasi yang diperlukan</strong> (safety training, driving license, product handling) dan dapat memberikan service quality yang konsisten. Terintegrasi dengan performance management untuk identify training needs dan career development opportunities.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Fitur yang Akan Dikembangkan
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Training Catalog</h3>
              <p className="text-slate-600 text-sm">Library lengkap training programs: safety procedures, customer service excellence, technical skills, product knowledge untuk berbagai level mitra dengan multimedia content.</p>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Enrollment Management</h3>
              <p className="text-slate-600 text-sm">Sistem pendaftaran training dengan scheduling calendar, capacity management, automated email reminders, dan waitlist management untuk optimasi resource.</p>
            </div>

            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Certification Tracking</h3>
              <p className="text-slate-600 text-sm">Monitor sertifikasi mandatory seperti SIM, safety training, product knowledge dengan expiry date alerts, renewal reminders, dan compliance dashboard.</p>
            </div>

            <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Assessment & Testing</h3>
              <p className="text-slate-600 text-sm">Online assessment tools dengan multiple question types untuk evaluasi pemahaman dan skill proficiency, automatic grading, dan certification issuance.</p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Learning Analytics</h3>
              <p className="text-slate-600 text-sm">Track training completion rates, assessment scores, skill gap analysis, learning path progress, dan ROI measurement dari training investments.</p>
            </div>

            <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
              <h3 className="font-semibold text-slate-800 mb-2">Compliance Management</h3>
              <p className="text-slate-600 text-sm">Ensure regulatory compliance dengan automatic renewal reminders untuk mandatory training, audit trail documentation, dan compliance reporting.</p>
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
              <p className="font-semibold mb-1">Training Coordinator</p>
              <p className="text-sm text-slate-300">Kelola program & jadwal training</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">HR Development</p>
              <p className="text-sm text-slate-300">Skill development & compliance</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
              <p className="font-semibold mb-1">Mitra & Driver</p>
              <p className="text-sm text-slate-300">Akses training & sertifikasi</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}