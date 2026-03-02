import { useState, useRef, useCallback, memo, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useAuth } from "../../contexts/authContext";

const INIT = {
  driver_name: "",
  area_operasional: "",
  tanggal_operasi: "",
  project: "",
  shift: "",
  unit: { odometer_awal: "", odometer_akhir: "" },
  baterai: { awal: "", akhir: "", jumlah_charging: "", lokasi_charging: "" },
  kondisi_motor: { tarikan: "", ada_kendala: "", detail_kendala: "" },
  downtime: { terjadi: "", durasi_menit: "" },
  checklist: { rem:"", ban:"", lampu:"", suspensi:"", dashboard:"", sistemKelistrikan:"", frameBody:"", sistemBaterai:"" },
  kendala: { teknis:"", keluhan_performa:"", insiden_kecelakaan:"" },
  rating: { kenyamananUnit:"", akselerasi:"", stabilitas:"", efisiensiBaterai:"", kepuasanOperasional:"" },
  rekomendasi: { layak_operasional_besok:false, perlu_maintenance_ringan:false, perlu_maintenance_berat:false, perlu_penggantian_unit:false, perlu_audit_teknis:false },
};

const INIT_FOTO_FILES = { odometer: null, dashboard_baterai: null, motor: null };
const INIT_PREVIEWS = { odometer: null, dashboard_baterai: null, motor: null };

const CHECKLIST_FIELDS = [["rem","Rem"],["ban","Ban"],["lampu","Lampu"],["suspensi","Suspensi"],["dashboard","Dashboard"],["sistemKelistrikan","Sistem Kelistrikan"],["frameBody","Frame / Body"],["sistemBaterai","Sistem Baterai"]];
const RATING_FIELDS = [["kenyamananUnit","Kenyamanan"],["akselerasi","Akselerasi"],["stabilitas","Stabilitas"],["efisiensiBaterai","Efisiensi Baterai"],["kepuasanOperasional","Kepuasan"]];
const REKOM_FIELDS = [["layak_operasional_besok","Layak Operasional Besok"],["perlu_maintenance_ringan","Perlu Maintenance Ringan"],["perlu_maintenance_berat","Perlu Maintenance Berat"],["perlu_penggantian_unit","Perlu Penggantian Unit"],["perlu_audit_teknis","Perlu Audit Teknis"]];
const PROJECTS = ["3PL","Mobile Selling","Ojol"];

const compressImage = (file, maxWidth = 1920, quality = 0.85) =>
  new Promise((res) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => res(new File([blob], file.name, { type: "image/jpeg" })),
        "image/jpeg",
        quality
      );
    };
    img.src = url;
  });

const flattenEntry = (entry) => ({
  id: entry._id,
  driver_name: entry.driver_name || "",
  area_operasional: entry.area_operasional || "",
  tanggal_operasi: entry.tanggal_operasi ? new Date(entry.tanggal_operasi).toLocaleDateString("id-ID") : "",
  project: entry.project || "",
  shift: entry.shift || "",
  odometer_awal: entry.unit?.odometer_awal ?? "",
  odometer_akhir: entry.unit?.odometer_akhir ?? "",
  total_km: entry.unit?.total_km ?? "",
  baterai_awal: entry.baterai?.awal ?? "",
  baterai_akhir: entry.baterai?.akhir ?? "",
  jumlah_charging: entry.baterai?.jumlah_charging ?? "",
  lokasi_charging: entry.baterai?.lokasi_charging || "",
  konsumsi_baterai: entry.baterai?.konsumsi_baterai ?? "",
  efisiensi_km_per_persen: entry.baterai?.efisiensi_km_per_persen ?? "",
  tarikan_motor: entry.kondisi_motor?.tarikan || "",
  ada_kendala_motor: entry.kondisi_motor?.ada_kendala || "",
  detail_kendala_motor: entry.kondisi_motor?.detail_kendala || "",
  downtime_terjadi: entry.downtime?.terjadi || "",
  downtime_durasi_menit: entry.downtime?.durasi_menit ?? "",
  checklist_rem: entry.checklist?.rem || "",
  checklist_ban: entry.checklist?.ban || "",
  checklist_lampu: entry.checklist?.lampu || "",
  checklist_suspensi: entry.checklist?.suspensi || "",
  checklist_dashboard: entry.checklist?.dashboard || "",
  checklist_sistem_kelistrikan: entry.checklist?.sistemKelistrikan || "",
  checklist_frame_body: entry.checklist?.frameBody || "",
  checklist_sistem_baterai: entry.checklist?.sistemBaterai || "",
  kendala_teknis: entry.kendala?.teknis || "",
  keluhan_performa: entry.kendala?.keluhan_performa || "",
  insiden_kecelakaan: entry.kendala?.insiden_kecelakaan || "",
  rating_kenyamanan: entry.rating?.kenyamananUnit ?? "",
  rating_akselerasi: entry.rating?.akselerasi ?? "",
  rating_stabilitas: entry.rating?.stabilitas ?? "",
  rating_efisiensi_baterai: entry.rating?.efisiensiBaterai ?? "",
  rating_kepuasan_operasional: entry.rating?.kepuasanOperasional ?? "",
  rekomendasi_layak_besok: entry.rekomendasi?.layak_operasional_besok ?? "",
  rekomendasi_maintenance_ringan: entry.rekomendasi?.perlu_maintenance_ringan ?? "",
  rekomendasi_maintenance_berat: entry.rekomendasi?.perlu_maintenance_berat ?? "",
  rekomendasi_penggantian_unit: entry.rekomendasi?.perlu_penggantian_unit ?? "",
  rekomendasi_audit_teknis: entry.rekomendasi?.perlu_audit_teknis ?? "",
  health_score: entry.kpi?.health_score ?? "",
  status_operasional_besok: entry.status_operasional_besok || "",
  foto_odometer: entry.foto?.odometer || "",
  foto_dashboard_baterai: entry.foto?.dashboard_baterai || "",
  foto_motor: entry.foto?.motor || "",
  created_at: entry.createdAt ? new Date(entry.createdAt).toLocaleString("id-ID") : "",
});

const ic = "w-full border border-gray-200 rounded-xl px-3 py-3 text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent";
const lc = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5";

function Toast({ msg, type, count, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  const isSuccess = type === "success";

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border ${
        isSuccess
          ? "bg-white border-emerald-200 text-gray-800"
          : "bg-white border-red-200 text-gray-800"
      }`}
      style={{ animation: "slideUp 0.2s ease-out", minWidth: "220px", maxWidth: "320px" }}
    >
      <span
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold ${
          isSuccess ? "bg-emerald-500" : "bg-red-500"
        }`}
      >
        {isSuccess ? "✓" : "✕"}
      </span>
      <div className="flex flex-col min-w-0">
        <p className="text-sm font-semibold leading-tight">
          {isSuccess ? "Export Berhasil" : "Export Gagal"}
        </p>
        <p className="text-xs text-gray-500 leading-tight mt-0.5 truncate">{msg}</p>
      </div>
      <button
        onClick={onDone}
        className="ml-auto flex-shrink-0 text-gray-300 hover:text-gray-500 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

const Section = memo(({ num, title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3">
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-7 h-7 rounded-lg bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{num}</span>
      <span className="text-[15px] font-bold text-gray-800">{title}</span>
    </div>
    {children}
  </div>
));

const Toggle = memo(({ options, value, onChange, danger }) => (
  <div className="flex gap-2 mt-1">
    {options.map(opt => {
      const active = value === opt;
      const isDanger = danger && ["Ada","Ya","Kurang tenaga"].includes(opt);
      return (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${active
            ? isDanger ? "bg-red-500 text-white border-red-500" : "bg-emerald-500 text-white border-emerald-500"
            : "bg-gray-50 text-gray-600 border-gray-200"}`}>
          {opt}
        </button>
      );
    })}
  </div>
));

const FotoItem = memo(({ label, compressing, preview, inputRef, onPick, onRemove }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[11px] font-bold text-gray-500 text-center leading-tight min-h-[28px] flex items-end justify-center pb-1">{label}</span>
    <div onClick={() => !compressing && inputRef.current?.click()}
      className={`relative w-full rounded-xl border-2 border-dashed overflow-hidden ${compressing ? "opacity-60 cursor-wait" : "cursor-pointer"} ${preview ? "border-emerald-300" : "border-gray-200 bg-gray-50"}`}
      style={{ paddingBottom: "100%" }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        {compressing
          ? <><span className="text-xl">⏳</span><span className="text-[10px] text-gray-400 text-center">Memproses...</span></>
          : preview
          ? <img src={preview} alt={label} className="w-full h-full object-cover" />
          : <><span className="text-2xl">📷</span><span className="text-[11px] text-gray-400 text-center px-1 leading-tight">Tap upload</span></>}
      </div>
    </div>
    <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
    {preview && !compressing && (
      <button type="button" onClick={onRemove} className="text-[11px] text-red-400 text-center py-0.5">Hapus</button>
    )}
  </div>
));

export default function RideExperience() {
  const [form, setForm] = useState(INIT);
  const [fotoFiles, setFotoFiles] = useState(INIT_FOTO_FILES);
  const [previews, setPreviews] = useState(INIT_PREVIEWS);
  const [compressing, setCompressing] = useState({ odometer: false, dashboard_baterai: false, motor: false });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  const { user } = useAuth();

  const isOwner = useMemo(() => user?.role === "owner", [user]);

  const fotoRefs = { odometer: useRef(), dashboard_baterai: useRef(), motor: useRef() };

  const setTop = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);
  const setNested = useCallback((s, k, v) => setForm(p => ({ ...p, [s]: { ...p[s], [k]: v } })), []);

  const km = (() => {
    const a = parseFloat(form.unit.odometer_awal);
    const b = parseFloat(form.unit.odometer_akhir);
    return !isNaN(a) && !isNaN(b) && b >= a ? (b - a).toFixed(1) : null;
  })();

  const handleFoto = useCallback(async (key, file) => {
    if (!file) return;
    setPreviews(p => ({ ...p, [key]: URL.createObjectURL(file) }));
    setCompressing(p => ({ ...p, [key]: true }));
    try {
      const compressed = await compressImage(file);
      setFotoFiles(p => ({ ...p, [key]: compressed }));
      setPreviews(p => ({ ...p, [key]: URL.createObjectURL(compressed) }));
    } finally {
      setCompressing(p => ({ ...p, [key]: false }));
    }
  }, []);

  const removeFoto = useCallback((key) => {
    setPreviews(p => ({ ...p, [key]: null }));
    setFotoFiles(p => ({ ...p, [key]: null }));
  }, []);

  const isCompressing = Object.values(compressing).some(Boolean);

  const handleExport = useCallback(async () => {
    if (!isOwner || exporting) return;
    setExporting(true);
    try {
      const response = await axios.get("https://backend-pms-production-0cec.up.railway.app/api/ride-experience");
      if (!response.data.success) throw new Error(response.data.message || "Gagal mengambil data");

      const data = response.data.data;
      if (!data || data.length === 0) throw new Error("Tidak ada data untuk diekspor");

      const rows = data.map(flattenEntry);
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ride Experience");

      const now = new Date();
      const filename = `ride-experience-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.xlsx`;
      XLSX.writeFile(wb, filename);

      setToast({ msg: `${data.length} data diekspor ke ${filename}`, type: "success" });
    } catch (err) {
      setToast({ msg: err.message || "Export gagal. Coba lagi.", type: "error" });
    } finally {
      setExporting(false);
    }
  }, [isOwner, exporting]);

  const handleSubmit = async () => {
    if (loading || isCompressing) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("driver_name", form.driver_name);
      fd.append("area_operasional", form.area_operasional);
      fd.append("tanggal_operasi", form.tanggal_operasi);
      fd.append("project", form.project);
      fd.append("shift", form.shift);
      fd.append("unit", JSON.stringify(form.unit));
      fd.append("baterai", JSON.stringify(form.baterai));
      fd.append("kondisi_motor", JSON.stringify(form.kondisi_motor));
      fd.append("downtime", JSON.stringify(form.downtime));
      fd.append("checklist", JSON.stringify(form.checklist));
      fd.append("kendala", JSON.stringify(form.kendala));
      fd.append("rating", JSON.stringify(form.rating));
      fd.append("rekomendasi", JSON.stringify(form.rekomendasi));
      if (fotoFiles.odometer) fd.append("foto_odometer", fotoFiles.odometer);
      if (fotoFiles.dashboard_baterai) fd.append("foto_dashboard_baterai", fotoFiles.dashboard_baterai);
      if (fotoFiles.motor) fd.append("foto_motor", fotoFiles.motor);

      await axios.post("https://backend-pms-production-0cec.up.railway.app/api/ride-experience", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      setForm(INIT);
      setFotoFiles(INIT_FOTO_FILES);
      setPreviews(INIT_PREVIEWS);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setToast({ msg: "Data berhasil disimpan!", type: "success" });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Gagal menyimpan. Coba lagi.";
      setToast({ msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}

      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Motor Listrik</p>
            <h1 className="text-lg font-extrabold text-gray-900 leading-tight">Evaluasi Unit Harian</h1>
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                exporting
                  ? "bg-emerald-100 text-emerald-400 cursor-not-allowed"
                  : "bg-emerald-500 text-white active:bg-emerald-600 active:scale-95"
              }`}
            >
              {exporting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export XLSX
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 pb-10 max-w-lg mx-auto">

        <Section num="i" title="Informasi Operasional">
          <div className="space-y-3">
            <div>
              <label className={lc}>Tanggal</label>
              <input type="date" className={ic} value={form.tanggal_operasi} onChange={e => setTop("tanggal_operasi", e.target.value)} />
            </div>
            <div>
              <label className={lc}>Nama Driver</label>
              <input className={ic} placeholder="Nama lengkap" value={form.driver_name} onChange={e => setTop("driver_name", e.target.value)} />
            </div>
            <div>
              <label className={lc}>Area Operasional</label>
              <input className={ic} placeholder="Kota / Zona / Hub" value={form.area_operasional} onChange={e => setTop("area_operasional", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>Project</label>
                <select className={ic} value={form.project} onChange={e => setTop("project", e.target.value)}>
                  <option value="">Pilih</option>
                  {PROJECTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={lc}>Shift</label>
                <select className={ic} value={form.shift} onChange={e => setTop("shift", e.target.value)}>
                  <option value="">Pilih</option>
                  {["Pagi","Siang","Malam"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </Section>

        <Section num="1" title="Odometer">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={lc}>Odometer Awal</label>
              <input type="number" inputMode="numeric" className={ic} placeholder="km" value={form.unit.odometer_awal} onChange={e => setNested("unit","odometer_awal",e.target.value)} />
            </div>
            <div>
              <label className={lc}>Odometer Akhir</label>
              <input type="number" inputMode="numeric" className={ic} placeholder="km" value={form.unit.odometer_akhir} onChange={e => setNested("unit","odometer_akhir",e.target.value)} />
            </div>
          </div>
          {km !== null && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-emerald-700">Total KM Hari Ini</span>
              <span className="text-xl font-extrabold text-emerald-600">{km} km</span>
            </div>
          )}
        </Section>

        <Section num="2" title="Baterai">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lc}>Baterai Awal (%)</label>
              <input type="number" inputMode="numeric" min="0" max="100" className={ic} placeholder="%" value={form.baterai.awal} onChange={e => setNested("baterai","awal",e.target.value)} />
            </div>
            <div>
              <label className={lc}>Baterai Akhir (%)</label>
              <input type="number" inputMode="numeric" min="0" max="100" className={ic} placeholder="%" value={form.baterai.akhir} onChange={e => setNested("baterai","akhir",e.target.value)} />
            </div>
            <div>
              <label className={lc}>Charging Berapa Kali</label>
              <input type="number" inputMode="numeric" min="0" className={ic} placeholder="0x" value={form.baterai.jumlah_charging} onChange={e => setNested("baterai","jumlah_charging",e.target.value)} />
            </div>
            <div>
              <label className={lc}>Lokasi Charging</label>
              <input className={ic} placeholder="Nama lokasi" value={form.baterai.lokasi_charging} onChange={e => setNested("baterai","lokasi_charging",e.target.value)} />
            </div>
          </div>
        </Section>

        <Section num="3" title="Kondisi Motor">
          <div className="space-y-4">
            <div>
              <label className={lc}>Tarikan Motor</label>
              <Toggle options={["Normal","Kurang tenaga"]} value={form.kondisi_motor.tarikan} onChange={v => setNested("kondisi_motor","tarikan",v)} danger />
            </div>
            <div>
              <label className={lc}>Motor Ada Kendala?</label>
              <Toggle options={["Tidak","Ada"]} value={form.kondisi_motor.ada_kendala} onChange={v => setNested("kondisi_motor","ada_kendala",v)} danger />
            </div>
            {form.kondisi_motor.ada_kendala === "Ada" && (
              <div>
                <label className={lc}>Jelaskan Kendala</label>
                <textarea rows={3} className={ic} placeholder="Deskripsikan kendala..." value={form.kondisi_motor.detail_kendala} onChange={e => setNested("kondisi_motor","detail_kendala",e.target.value)} />
              </div>
            )}
          </div>
        </Section>

        <Section num="4" title="Downtime">
          <div className="space-y-4">
            <div>
              <label className={lc}>Motor Sempat Tidak Bisa Dipakai?</label>
              <Toggle options={["Tidak","Ya"]} value={form.downtime.terjadi} onChange={v => setNested("downtime","terjadi",v)} danger />
            </div>
            {form.downtime.terjadi === "Ya" && (
              <div>
                <label className={lc}>Berapa Lama (menit)</label>
                <input type="number" inputMode="numeric" min="0" className={ic} placeholder="Durasi menit" value={form.downtime.durasi_menit} onChange={e => setNested("downtime","durasi_menit",e.target.value)} />
              </div>
            )}
          </div>
        </Section>

        <Section num="5" title="Foto Wajib">
          <p className="text-xs text-gray-400 -mt-2 mb-4 leading-relaxed">Foto dikompresi otomatis agar upload ringan & cepat</p>
          <div className="grid grid-cols-3 gap-2">
            {[["odometer","Foto Odometer"],["dashboard_baterai","Foto Dashboard Baterai"],["motor","Foto Motor"]].map(([key, label]) => (
              <FotoItem key={key} label={label}
                compressing={compressing[key]}
                preview={previews[key]}
                inputRef={fotoRefs[key]}
                onPick={e => handleFoto(key, e.target.files[0])}
                onRemove={() => removeFoto(key)} />
            ))}
          </div>
        </Section>

        <Section num="6" title="Checklist Kondisi Unit">
          <div className="space-y-2.5">
            {CHECKLIST_FIELDS.map(([field, label]) => (
              <div key={field} className="flex items-center gap-2">
                <span className="text-sm text-gray-700 leading-tight flex-shrink-0" style={{ width: "108px" }}>{label}</span>
                <div className="flex gap-1.5 flex-1 min-w-0">
                  {["Baik","Cukup","Bermasalah"].map(opt => {
                    const active = form.checklist[field] === opt;
                    return (
                      <button key={opt} type="button" onClick={() => setNested("checklist",field,opt)}
                        className={`flex-1 py-2 text-xs rounded-lg border font-semibold ${active
                          ? opt==="Baik" ? "bg-emerald-500 text-white border-emerald-500"
                          : opt==="Cukup" ? "bg-amber-400 text-white border-amber-400"
                          : "bg-red-500 text-white border-red-500"
                          : "bg-white text-gray-500 border-gray-200"}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section num="7" title="Kendala Tambahan">
          <div className="space-y-3">
            {[["teknis","Kendala Teknis"],["keluhan_performa","Keluhan Performa"],["insiden_kecelakaan","Insiden Kecelakaan"]].map(([key, label]) => (
              <div key={key}>
                <label className={lc}>{label}</label>
                <textarea rows={2} className={ic} placeholder="Isi jika ada..." value={form.kendala[key]} onChange={e => setNested("kendala",key,e.target.value)} />
              </div>
            ))}
          </div>
        </Section>

        <Section num="8" title="Rating Unit (1–5)">
          <div className="space-y-3">
            {RATING_FIELDS.map(([field, label]) => (
              <div key={field} className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-700 leading-tight flex-1">{label}</span>
                <div className="flex gap-1 flex-shrink-0">
                  {[1,2,3,4,5].map(n => {
                    const active = form.rating[field] === n;
                    return (
                      <button key={n} type="button" onClick={() => setNested("rating",field,n)}
                        className={`w-9 h-9 rounded-xl border text-sm font-bold transition-colors ${active ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-400 border-gray-200"}`}>
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section num="9" title="Rekomendasi Operasional">
          <div className="space-y-1">
            {REKOM_FIELDS.map(([field, label]) => (
              <label key={field} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer select-none">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${form.rekomendasi[field] ? "bg-emerald-500 border-emerald-500" : "border-gray-300 bg-white"}`}>
                  {form.rekomendasi[field] && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <input type="checkbox" className="hidden" checked={form.rekomendasi[field]} onChange={e => setNested("rekomendasi",field,e.target.checked)} />
                <span className="text-sm text-gray-700 leading-tight">{label}</span>
              </label>
            ))}
          </div>
        </Section>

        <button type="button" disabled={loading || isCompressing} onClick={handleSubmit}
          className={`w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all ${
            loading || isCompressing ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-500 active:bg-emerald-600 active:scale-95"}`}>
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Menyimpan...
              </span>
            : isCompressing ? "Memproses foto..." : "Simpan Evaluasi"}
        </button>

        <p className="text-center text-xs text-gray-300 mt-4">Data operasional tidak menyimpan informasi pribadi sensitif</p>
      </div>
    </div>
  );
}