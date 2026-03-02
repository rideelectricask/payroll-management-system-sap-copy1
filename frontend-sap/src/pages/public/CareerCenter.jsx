import React, { useState } from "react";
import { Users, TrendingUp, MapPin, Clock, DollarSign, CheckCircle, Phone, Briefcase, Award, ArrowRight, Target } from "lucide-react";

export default function CareerCenter() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeFilter, setActiveFilter] = useState("Semua");

  const jobs = [
    {
      id: 1,
      title: "GoMart & GoSend",
      partner: "Blitz x Gojek",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Gojek_logo_2022.svg/960px-Gojek_logo_2022.svg.png",
      type: "Kurir",
      location: "Jakarta Utara, Jakarta Selatan, Jakarta Barat, Tangerang, Bekasi",
      fee: "Rp 150.000 - Rp 250.000",
      requirements: [
        "SIM C Aktif",
        "KTP",
        "Memiliki motor pribadi (Min 2014)",
        "Domisili Jabodetabek (diutamakan Jakarta Utara, Jakarta Selatan, Jakarta Barat, Tangerang dan Bekasi Kota)"
      ],
      benefits: [
        "Dapatkan fee dalam sehari mulai Rp 150.000 hingga Rp 250.000",
        "Spesial insentif mengikuti performa (diinfokan setelah gabung)",
        "Akun Aktif cepat tidak pakai antri",
        "Tidak perlu top up & deposit"
      ],
      schedule: "",
      applyUrl: "https://bit.ly/BlitzxGojek"
    },
    {
      id: 2,
      title: "Kurir Merapi",
      partner: "Blitz x Merapi",
      logo: "https://images.glints.com/unsafe/1200x0/glints-dashboard.oss-ap-southeast-1-internal.aliyuncs.com/company-logo/68fa31a8efdf56ee618d7a5748d8a99b.png",
      type: "Kurir",
      location: "Jakarta & Bandung",
      fee: "Rp 10.000/drop, Senin-Sabtu (standby full di hub)",
      requirements: [
        "Memiliki kendaraan motor pribadi",
        "Memiliki SIM C aktif"
      ],
      benefits: [],
      schedule: "Slot Pickup: Nds jam: 8.00, Sds 1 jam: 12.30, Sds 2 jam: 15.00",
      applyUrl: "https://bit.ly/joinblitz2024"
    },
    {
      id: 3,
      title: "Kurir Sayurbox",
      partner: "Blitz x Sayurbox",
      logo: "https://adiwebstprdsea.blob.core.windows.net/astradigital-be/assets/images/medium_4_0ef3ab7195.png",
      type: "Kurir",
      location: "Hub Sentul Bogor, Hub Fatmawati, Hub Cibitung, Hub Cisauk",
      fee: "Rp 5.000 - Rp 24.000/order",
      requirements: [
        "Memiliki kendaraan motor pribadi",
        "SIM C Aktif"
      ],
      benefits: [
        "Bonus Mingguan: 50 Order: Rp 30.000, 75 Order: Rp 60.000, 100 Order: Rp 120.000",
        "Bonus Personal Rp 5.000/order"
      ],
      rateDetails: {
        title: "Rate fee & bonus sayurbox:",
        rates: [
          { range: "15.1-30 km", fee: "Rp 24.000" },
          { range: "12.1-15 km", fee: "Rp 18.000" },
          { range: "9.1-12 km", fee: "Rp 7.000" },
          { range: "6.1-9 km", fee: "Rp 6.000" },
          { range: "3.1-6 km", fee: "Rp 5.500" },
          { range: "0-3 km", fee: "Rp 5.000" }
        ]
      },
      schedule: "Bawa 3 slot/hari: Slot 0: 05.00-08.00, Slot 1: 08.00-11.00, Sameday: 17.00-20.00",
      note: "*Pendapatan tergantung bonus mingguan berdasarkan performa. *Tidak berlaku kelipatan setiap peningkatan",
      applyUrl: "https://bit.ly/joinblitz2024"
    },
    {
      id: 4,
      title: "Project Blibli",
      partner: "Blitz x Blibli",
      logo: "https://brandlogos.net/wp-content/uploads/2023/10/blibli-logo_brandlogos.net_gq3tj-512x178.png",
      type: "Kurir",
      location: "Hub Cipete, Hub Tambun Selatan, Hub Legok, Hub Duri Kosambi, Hub Pisangan",
      fee: "Rp 70.000/5 order ID, diatas 5 order = (+) Rp 8.000/order ID",
      requirements: [],
      benefits: [
        "Project blibli menggunakan GARANSI minimum harian Rp 70.000/5 order ID"
      ],
      schedule: "Slot 1: 11.00 siang, Slot 2: 16.00 sore",
      pickupDetails: {
        title: "Detail Pickup Blibli:",
        slots: [
          { name: "Pickup Slot 1", time: "Jam 11.00 - 14.00" },
          { name: "Pickup Slot 2", time: "Jam 16.00 - 18.00" }
        ],
        rates: [
          { desc: "Untuk 3 paket pertama", fee: "Rp 16.000 per Order" },
          { desc: "Order ke-4 dst", fee: "Rp 8.000 per paket" }
        ],
        example: "Contoh perhitungan: Risky membawa 10 paket pada slot 1, Order 1-3 = Rp 16.000 masing-masing, Order 4-10 = Rp 8.000 masing-masing. Total fee = Rp 104.000",
        payment: "Fee yang didapatkan tanpa potongan. Gajian di setiap hari Rabu untuk pengiriman dari Senin - Minggu."
      },
      deliveryRange: "Max 15-20 KM",
      applyUrl: ""
    },
    {
      id: 5,
      title: "Kurir Ekspedisi",
      partner: "Blitz",
      logo: "https://www.third-derivative.org/hubfs/blitz-logoArtboard%201.png",
      type: "Kurir",
      location: "Jakarta",
      fee: "Rp 170.000/hari",
      requirements: [
        "Usia maksimal 40 tahun",
        "Sehat jasmani dan rohani",
        "Memiliki SIM C yang masih berlaku",
        "Memiliki motor pribadi (diutamakan tipe matic)",
        "Memiliki STNK dan pajak motor yang aktif",
        "Memiliki handphone Android dengan RAM minimal 3 GB",
        "Mampu membaca peta/aplikasi seperti google maps/waze",
        "Paham area atau wilayah"
      ],
      benefits: [
        "BPJSTK BPU",
        "Penempatan sesuai domisili Jakarta",
        "Fee 170 Ribu perhari"
      ],
      schedule: "",
      applyUrl: "https://bit.ly/AnterinBlitz"
    },
    {
      id: 6,
      title: "Sorter Ekspedisi",
      partner: "Blitz",
      logo: "https://www.third-derivative.org/hubfs/blitz-logoArtboard%201.png",
      type: "Sorter",
      location: "Jakarta",
      fee: "Rp 150.000/hari",
      requirements: [
        "Sehat secara jasmani (mampu berdiri selama 5 jam)",
        "Memiliki pengalaman di bidang logistik, ekspres, atau pergudangan (diutamakan)",
        "Bersedia bekerja dengan sistem 3 shift, termasuk pada hari libur",
        "Siap ditempatkan di lokasi manapun sesuai kebutuhan perusahaan",
        "Jujur, disiplin, pekerja keras"
      ],
      benefits: [
        "BPJSTK BPU",
        "Penempatan sesuai domisili Jakarta",
        "Fee 150 Ribu perhari"
      ],
      schedule: "",
      applyUrl: "https://bit.ly/AnterinBlitz"
    },
    {
      id: 7,
      title: "Sorter Ekspedisi",
      partner: "Blitz x Anteraja",
      logo: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj8vb3ezy73lHPXbPs2no2Qyqy17yzd5xxzEQICj329NwvhZgPItuqmEATut3L3Elm7_SEWdQLh6Eb90z47lWWuTinmtbtoOGJ4LJpxdy4uthQJjaB8kILRZvXechdhlWvfIFShgdv3QrgaLAkoi77zku8gr4w_VoRhyiojsmldEIWYa_yW1neyd4wt/s320/GKL7_AnterAja%20-%20Koleksilogo.com.jpg",
      type: "Sorter",
      location: "Jakarta",
      fee: "Rp 150.000/hari",
      requirements: [
        "Usia maksimal 35 tahun",
        "Memiliki pengalaman di bidang logistik, ekspres, atau pergudangan (diutamakan)",
        "Bersedia bekerja dengan sistem 3 shift, termasuk pada hari libur",
        "Siap ditempatkan di lokasi manapun sesuai kebutuhan perusahaan",
        "Jujur, disiplin, pekerja keras"
      ],
      benefits: [
        "BPJSTK BPU",
        "Penempatan sesuai domisili Jakarta",
        "Fee 150 Ribu perhari"
      ],
      schedule: "",
      applyUrl: "https://bit.ly/blitzXanteraja"
    },
    {
      id: 8,
      title: "Kurir Pengantaran Barang",
      partner: "Blitz Electric Mobility",
      logo: "https://www.third-derivative.org/hubfs/blitz-logoArtboard%201.png",
      type: "Kurir",
      location: "Jakarta",
      fee: "Hingga Rp 200.000/hari",
      requirements: [
        "Memiliki handphone Android"
      ],
      benefits: [
        "Dapatkan pendapatan harian hingga Rp 200.000/hari",
        "Kesempatan untuk memiliki motor listrik dengan metode sewa milik",
        "Pendaftaran & Training GRATIS"
      ],
      schedule: "",
      applyUrl: "https://bit.ly/JoinRideBlitz"
    },
    {
      id: 9,
      title: "ShopeeFood Driver",
      partner: "Blitz x ShopeeFood",
      logo: "https://images.seeklogo.com/logo-png/39/1/shopee-food-indonesia-logo-png_seeklogo-397473.png",
      type: "Kurir",
      location: "Jakarta",
      fee: "Rp 50.000 - Rp 150.000/hari",
      requirements: [
        "Belum pernah terdaftar di akun ShopeeFood",
        "eKTP asli",
        "SIM C/D Asli (masih dalam masa berlaku)",
        "STNK Asli (pajak 5 tahunan dalam masa berlaku) dan SKPD (Pajak Tahunan) Asli",
        "SKCK Asli/Legalisir",
        "Pastikan akun Shopee sudah plus"
      ],
      benefits: [
        "Dapatkan kesempatan menambah pendapatan per hari mulai dari 50.000 hingga 150.000",
        "Undangan pendaftaran akan dikirimkan melalui WhatsApp, pastikan WhatsApp mu masih aktif ya!",
        "Siapkan dokumen asli untuk pendaftaran: KTP | SIM C | STNK | SKCK | Buku tabungan"
      ],
      schedule: "",
      note: "*Pendapatan tergantung pegawas harian & minguan berdasarkan performa",
      applyUrl: "https://bit.ly/BlitzxShopeefood"
    },
    {
      id: 10,
      title: "Project Envio",
      partner: "Blitz x Envio Digital Logistics",
      logo: "https://www.feeder.co.id/wp-content/uploads/2024/02/envio.png",
      type: "Kurir",
      location: "ENVIO Bonang, ENVIO Kembangan, ENVIO Tebet",
      fee: "Rp 14.000 - Rp 25.000",
      requirements: [],
      benefits: [],
      rateDetails: {
        title: "Rate Fee:",
        rates: [
          { range: "Dibawah 40 KG", fee: "Rp 14.000" },
          { range: "Untuk 41-50 KG", fee: "Rp 18.000" },
          { range: "Lebih dari 50 KG", fee: "Rp 25.000" }
        ]
      },
      schedule: "Gaji Mingguan (setiap Rabu), Senin-Minggu 06.00-11.00, Saddle Bag disediakan, Jenis barang Groceries, Sekali bawa 4/5 order",
      locations: [
        {
          name: "ENVIO Bonang",
          address: "JL. SUNAN BONANG VIII BLOK SJ8 NO.4, RT.3/RW.3, BOJONG NANGKA, KEC. KLP. DUA, KABUPATEN TANGERANG, BANTEN 15810"
        },
        {
          name: "ENVIO Kembangan",
          address: "JL. PURI KEMBANGAN NO.57F, RT.11/RW.5, KEMBANGAN SEL., KEC. KEMBANGAN, JAKARTA BARAT, DKI JAKARTA 11610"
        },
        {
          name: "ENVIO Tebet",
          address: "JL. TEBET RAYA NO.62, KEC. TEBET, JAKARTA SELATAN, DKI JAKARTA 12820"
        }
      ],
      applyUrl: ""
    },
    {
      id: 11,
      title: "SwipeRX - Tangerang & Bekasi",
      partner: "Blitz x SwipeRX",
      logo: "https://www.swiperx.com/wp-content/uploads/2022/05/SwipeRx-Thumbnail.jpg",
      type: "Kurir",
      location: "Tangerang, Bekasi, Bogor, Kelapa 2 Tangerang",
      fee: "Rp 8.000 - Rp 10.000 + bonus/KG",
      requirements: [],
      benefits: [
        "Gaji dibayarkan mingguan",
        "Jam kerja mulai 15:00",
        "Penempatan: Tangerang, Bekasi, Bogor, Kelapa 2 Tangerang"
      ],
      rateDetails: {
        title: "Skema Jarak & Berat:",
        rates: [
          { range: "0-7,99 km", fee: "Rp 9.500" },
          { range: "8-15,99 km", fee: "Rp 10.000" },
          { range: ">15 km", fee: "Rp 800/KM" },
          { range: ">5 kg", fee: "Rp 800/KG" }
        ]
      },
      schedule: "Jam kerja mulai 15:00",
      applyUrl: "",
      note: "Bisa bekerja hari ini"
    },
    {
      id: 12,
      title: "SwipeRX - Cibitung",
      partner: "Blitz x SwipeRX",
      logo: "https://www.swiperx.com/wp-content/uploads/2022/05/SwipeRx-Thumbnail.jpg",
      type: "Kurir",
      location: "Hub Cibitung, Bekasi",
      fee: "Rp 8.000 - Rp 9.000 + bonus/KG",
      requirements: [],
      benefits: [
        "Gaji dibayarkan mingguan",
        "Jam kerja mulai 15:00",
        "Penempatan: Hub Cibitung, Bekasi"
      ],
      rateDetails: {
        title: "Skema Jarak & Berat:",
        rates: [
          { range: "0-7,99 KM", fee: "Rp 8.000" },
          { range: "8-15,99 KM", fee: "Rp 9.000" },
          { range: ">15 KM", fee: "+Rp 800/KM" },
          { range: ">5 KG", fee: "+Rp 800/KG" }
        ]
      },
      schedule: "Jam kerja mulai 15:00",
      applyUrl: ""
    }
  ];

  const jobTypes = ["Semua", "Kurir", "Sorter"];

  const filteredJobs = activeFilter === "Semua" 
    ? jobs 
    : jobs.filter(job => job.type === activeFilter);

  const careerPath = [
    {
      level: 1,
      title: "Driver",
      description: "Memulai karir sebagai mitra driver yang handal dan profesional",
      icon: Users
    },
    {
      level: 2,
      title: "Kapten",
      description: "Naik jabatan menjadi kapten dengan tanggung jawab lebih besar",
      icon: Award
    },
    {
      level: 3,
      title: "Korlap",
      description: "Koordinator lapangan yang memimpin tim operasional",
      icon: Target
    },
    {
      level: 4,
      title: "Staff Perusahaan",
      description: "Bergabung sebagai bagian dari tim internal perusahaan",
      icon: Briefcase
    }
  ];

  const getWhatsAppUrl = (job) => {
    const message = `Halo Kak, saya tertarik dengan posisi *${job.title}* (${job.partner}).

Berikut data singkat saya:
- Nama lengkap: 
- Nomor WhatsApp aktif: 
- Email: 
- Domisili saat ini: 
- Tanggal siap bergabung: 

Mohon informasi lebih lanjut mengenai posisi ini. Terima kasih.`;

    return `https://wa.me/6287855172580?text=${encodeURIComponent(message)}`;
  };

  const getRegisterWhatsAppUrl = () => {
    const message = `Halo Kak, saya ingin mendapatkan informasi terkait pendaftaran Mitra Kurir di Blitz Electric Mobility. Terima kasih

Jika Kakak berminat bergabung, silakan kirimkan data singkat berikut:
- Nama lengkap:
- Nomor WhatsApp aktif:
- Email:
- Domisili saat ini:
- Tanggal siap bergabung:
- Project: (sebutkan project yang diminati)`;

    return `https://wa.me/6287855172580?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl mb-8 shadow-xl">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">
            Pusat Karir Blitz
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Bergabunglah dengan keluarga besar Blitz Electric Mobility dan wujudkan karir impian Anda bersama kami dalam merevolusi industri logistik Indonesia
          </p>
          <a
            href={getRegisterWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Phone className="w-5 h-5" />
            Daftar Sekarang
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>

        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Jenjang Karir Anda</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Kami memberikan kesempatan pengembangan karir yang jelas berdasarkan kinerja dan dedikasi Anda
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
              {careerPath.map((step, index) => (
                <div key={step.level} className="relative">
                  <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-slate-100 h-full">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center mb-6 shadow-md">
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 rounded-full mb-4">
                        <span className="text-lg font-bold text-slate-700">{step.level}</span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">{step.title}</h3>
                      <p className="text-slate-600 leading-relaxed text-base">{step.description}</p>
                    </div>
                  </div>
                  
                  {index < careerPath.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-20">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-slate-300">
                        <ArrowRight className="w-4 h-4 text-slate-600" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-8 border-2 border-slate-200">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-800 mb-4">Kriteria Penilaian Jenjang Karir</h3>
                <p className="text-slate-700 text-lg leading-relaxed mb-4">
                  Penilaian jenjang karir ditentukan berdasarkan <span className="font-bold text-slate-900">kinerja dan performa</span> yang Anda tunjukkan. Mitra terbaik dengan peringkat #1 akan mendapatkan prioritas rekomendasi saat kami membuka project baru.
                </p>
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <p className="text-slate-700 text-base leading-relaxed mb-3">
                    <span className="font-bold text-slate-900">Punya skill khusus?</span> Jika Anda memiliki kemampuan pengembangan yang dapat diterapkan untuk kemajuan Blitz Electric Mobility Logistic, kami sangat terbuka untuk peluang kolaborasi.
                  </p>
                  <div className="flex items-center gap-3 text-slate-700">
                    <span className="text-base">Kirim CV dan portfolio Anda ke:</span>
                    <a 
                      href="mailto:septa.git@gmail.com" 
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-lg hover:from-slate-800 hover:to-slate-950 font-semibold text-base shadow-md"
                    >
                      septa.git@gmail.com
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-4xl font-bold text-slate-800 text-center mb-10">Posisi yang Tersedia</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {jobTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-10 py-4 rounded-xl font-semibold text-lg shadow-md ${
                  activeFilter === type
                    ? "bg-gradient-to-r from-slate-700 to-slate-900 text-white scale-105"
                    : "bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-20">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-2xl overflow-hidden cursor-pointer border-2 border-slate-100 hover:border-slate-300 transition-all duration-300"
              onClick={() => setSelectedJob(job)}
            >
              <div className="h-64 bg-white flex items-center justify-center p-8 border-b-2 border-slate-100">
                <img 
                  src={job.logo} 
                  alt={job.partner}
                  className="w-full h-full object-contain scale-110"
                />
              </div>
              
              <div className="p-7">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{job.title}</h3>
                <p className="text-slate-600 text-sm font-semibold mb-4">{job.partner}</p>

                <div className="flex items-start gap-4 text-slate-600 mb-4">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-1 text-slate-500" />
                  <span className="text-base line-clamp-2 leading-relaxed">{job.location}</span>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-3 text-slate-600">
                    <DollarSign className="w-5 h-5 flex-shrink-0 text-slate-500" />
                    <span className="text-base font-bold text-slate-800">{job.fee}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-5 border-t-2 border-slate-100">
                  <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700">
                    {job.type}
                  </span>
                  <span className="text-base text-slate-800 font-semibold flex items-center gap-2">
                    Lihat Detail
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-12 border-2 border-slate-200">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl mb-6 shadow-md">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-slate-800 mb-3">Tim Recruitment Kami</h2>
            <p className="text-slate-600 text-lg">Hubungi kami untuk informasi lebih lanjut dan konsultasi karir</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <a
              href={getRegisterWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-5 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1 font-medium">Recruitment Officer</p>
                <p className="font-bold text-slate-800 text-xl mb-1">Nana</p>
                <p className="text-sm text-slate-600 font-medium">WhatsApp Tersedia</p>
              </div>
            </a>
            
            <a 
              href="https://wa.me/6281371800754?text=Halo%20Kak,%20saya%20ingin%20mendapatkan%20informasi%20terkait%20pendaftaran%20Mitra%20Kurir%20di%20Blitz%20Electric%20Mobility.%20Terima%20kasih%0A%0AJika%20Kakak%20berminat%20bergabung,%20silakan%20kirimkan%20data%20singkat%20berikut:%0A-%20Nama%20lengkap:%0A-%20Nomor%20WhatsApp%20aktif:%0A-%20Email:%0A-%20Domisili%20saat%20ini:%0A-%20Tanggal%20siap%20bergabung:%0A-%20Project:%20(sebutkan%20project%20yang%20diminati)"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-5 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1 font-medium">Recruitment Officer</p>
                <p className="font-bold text-slate-800 text-xl mb-1">Tiara</p>
                <p className="text-sm text-slate-600 font-medium">0813-7180-0754</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {selectedJob && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setSelectedJob(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-4xl w-full my-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-slate-700 to-slate-900 text-white p-10 rounded-t-3xl z-10">
              <div className="flex justify-between items-start">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg text-sm font-semibold mb-4 backdrop-blur-sm">
                    <Award className="w-4 h-4" />
                    {selectedJob.type}
                  </div>
                  <h2 className="text-4xl font-bold mb-3">{selectedJob.title}</h2>
                  <p className="text-slate-200 font-semibold text-lg">{selectedJob.partner}</p>
                </div>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="text-white hover:bg-white/20 rounded-xl p-3 transition-all duration-200"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-7 border-2 border-slate-200">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 mb-3 text-xl">Lokasi Penempatan</h3>
                    <p className="text-slate-700 leading-relaxed text-lg">{selectedJob.location}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-7 border-2 border-emerald-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 mb-3 text-xl">Pendapatan</h3>
                    <p className="text-emerald-900 font-bold text-2xl">{selectedJob.fee}</p>
                  </div>
                </div>
              </div>

              {selectedJob.schedule && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-7 border-2 border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 mb-3 text-xl">Jadwal Kerja</h3>
                      <p className="text-slate-700 leading-relaxed text-lg">{selectedJob.schedule}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedJob.deliveryRange && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-7 border-2 border-purple-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 mb-3 text-xl">Jarak Pengantaran</h3>
                      <p className="text-slate-700 leading-relaxed text-lg">{selectedJob.deliveryRange}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedJob.rateDetails && (
                <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-xl">{selectedJob.rateDetails.title}</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedJob.rateDetails.rates.map((rate, idx) => (
                      <div key={idx} className="flex justify-between items-center py-4 px-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                        <span className="text-slate-700 font-semibold text-base">{rate.range || rate.desc}</span>
                        <span className="font-bold text-slate-900 text-lg">{rate.fee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.pickupDetails && (
                <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-xl">{selectedJob.pickupDetails.title}</h3>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider">Slot Pickup</h4>
                    <div className="space-y-3">
                      {selectedJob.pickupDetails.slots.map((slot, idx) => (
                        <div key={idx} className="flex justify-between items-center py-4 px-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                          <span className="text-slate-700 font-semibold text-base">{slot.name}</span>
                          <span className="font-bold text-slate-900 text-lg">{slot.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider">Rate Harga</h4>
                    <div className="space-y-3">
                      {selectedJob.pickupDetails.rates.map((rate, idx) => (
                        <div key={idx} className="flex justify-between items-center py-4 px-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                          <span className="text-slate-700 font-semibold text-base">{rate.desc}</span>
                          <span className="font-bold text-slate-900 text-lg">{rate.fee}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedJob.pickupDetails.example && (
                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 mb-4">
                      <p className="text-base text-blue-900 leading-relaxed font-medium">{selectedJob.pickupDetails.example}</p>
                    </div>
                  )}

                  {selectedJob.pickupDetails.payment && (
                    <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                      <p className="text-base text-emerald-900 leading-relaxed font-semibold">{selectedJob.pickupDetails.payment}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedJob.locations && selectedJob.locations.length > 0 && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-xl">Lokasi Hub</h3>
                  </div>
                  <div className="space-y-4">
                    {selectedJob.locations.map((loc, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border-2 border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-3 text-lg">
                          <span className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
                            {idx + 1}
                          </span>
                          {loc.name}
                        </h4>
                        <p className="text-base text-slate-700 leading-relaxed">{loc.address}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-xl">Persyaratan</h3>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-7 border-2 border-slate-200">
                    <ul className="space-y-4">
                      {selectedJob.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-4">
                          <CheckCircle className="w-6 h-6 text-slate-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700 leading-relaxed text-lg">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-xl">Benefit</h3>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-7 border-2 border-amber-200">
                    <ul className="space-y-4">
                      {selectedJob.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-4">
                          <Award className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700 leading-relaxed text-lg">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedJob.note && (
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-500 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-base text-amber-900 leading-relaxed font-semibold">{selectedJob.note}</p>
                  </div>
                </div>
              )}

              <div className="pt-6">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border-2 border-slate-200">
                  <h3 className="font-bold text-slate-800 text-xl mb-4 text-center">Hubungi Tim Recruitment Kami</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <a
                      href={getRegisterWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-5 bg-white rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Phone className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1 font-medium">Recruitment Officer</p>
                        <p className="font-bold text-slate-800 text-lg">Nana</p>
                      </div>
                    </a>
                    
                    <a 
                      href="https://wa.me/6281371800754?text=Halo%20Kak,%20saya%20ingin%20mendapatkan%20informasi%20terkait%20pendaftaran%20Mitra%20Kurir%20di%20Blitz%20Electric%20Mobility.%20Terima%20kasih%0A%0AJika%20Kakak%20berminat%20bergabung,%20silakan%20kirimkan%20data%20singkat%20berikut:%0A-%20Nama%20lengkap:%0A-%20Nomor%20WhatsApp%20aktif:%0A-%20Email:%0A-%20Domisili%20saat%20ini:%0A-%20Tanggal%20siap%20bergabung:%0A-%20Project:%20(sebutkan%20project%20yang%20diminati)"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-5 bg-white rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Phone className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1 font-medium">Recruitment Officer</p>
                        <p className="font-bold text-slate-800 text-lg">Tiara</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}