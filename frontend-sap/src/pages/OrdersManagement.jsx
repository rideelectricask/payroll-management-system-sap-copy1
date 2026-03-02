import React, { useState, memo } from "react";
import { Package, Database, Upload, Truck, Users, BarChart3, MapPin, Calendar } from "lucide-react";
import JNE from "./operations/3PL/JNE";
import MUP from "./operations/3PL/MUP";
import SayurboxDistribution from "./operations/3PL/SB";
import UnileverDistribution from "./operations/3PL/UnileverDistribution";
import WingsDistribution from "./operations/3PL/WingsDistribution";
import OrderTracking from "./operations/OrderTracking";
import DeliveryAssignment from "./operations/DeliveryAssignment";
import PerformanceAnalytics from "./operations/PerformanceAnalytics";

const TabButton = memo(({ id, label, icon, isActive, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700 border border-blue-200'
        : 'text-gray-600 hover:bg-gray-50 border border-transparent'
    }`}
  >
    {icon}
    {label}
  </button>
));

export default function OrdersManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState('jne');

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Orders Management</h1>
              <p className="text-slate-600 text-lg">Sistem Manajemen Pesanan & Pengiriman Logistics</p>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Sistem Operasional Aktif
            </div>
          </div>
        </div>

        <div className="mb-6 border-b border-gray-200 bg-white rounded-lg p-2">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <TabButton id="overview" label="Overview" icon={<Upload size={18} />} isActive={activeTab === 'overview'} onClick={setActiveTab} />
              <TabButton id="tracking" label="Order Tracking" icon={<MapPin size={18} />} isActive={activeTab === 'tracking'} onClick={setActiveTab} />
              <TabButton id="assignment" label="Delivery Assignment" icon={<Truck size={18} />} isActive={activeTab === 'assignment'} onClick={setActiveTab} />
              <TabButton id="analytics" label="Performance Analytics" icon={<BarChart3 size={18} />} isActive={activeTab === 'analytics'} onClick={setActiveTab} />
            </div>

            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-lg border border-blue-200">
              <Database size={18} className="text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">3PL Project:</span>
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setActiveTab('project');
                }}
                className="px-3 py-1.5 border-0 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-700 cursor-pointer shadow-sm"
              >
                <option value="jne">📦 JNE Overview</option>
                <option value="mup">🏢 MUP Distribution</option>
                <option value="sayurbox">🥬 Sayurbox Distribution</option>
                <option value="unilever">🧴 Unilever Distribution</option>
                <option value="wings">🦅 Wings Distribution</option>
              </select>
            </div>
          </div>
        </div>

        {activeTab === 'tracking' && (
          <div className="mb-6">
            <OrderTracking selectedProject={selectedProject} />
          </div>
        )}

        {activeTab === 'assignment' && (
          <div className="mb-6">
            <DeliveryAssignment selectedProject={selectedProject} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="mb-6">
            <PerformanceAnalytics selectedProject={selectedProject} />
          </div>
        )}

        {activeTab === 'project' && (
          <div className="mb-6">
            {selectedProject === 'jne' && <JNE />}
            {selectedProject === 'mup' && <MUP />}
            {selectedProject === 'sayurbox' && <SayurboxDistribution />}
            {selectedProject === 'unilever' && <UnileverDistribution />}
            {selectedProject === 'wings' && <WingsDistribution />}
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Package className="w-8 h-8 opacity-80" />
                  <div className="text-right">
                    <p className="text-sm opacity-90">Total Orders</p>
                    <p className="text-3xl font-bold">1,234</p>
                  </div>
                </div>
                <p className="text-sm opacity-80">+12% dari bulan lalu</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Truck className="w-8 h-8 opacity-80" />
                  <div className="text-right">
                    <p className="text-sm opacity-90">Delivered</p>
                    <p className="text-3xl font-bold">987</p>
                  </div>
                </div>
                <p className="text-sm opacity-80">80% success rate</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <MapPin className="w-8 h-8 opacity-80" />
                  <div className="text-right">
                    <p className="text-sm opacity-90">In Transit</p>
                    <p className="text-3xl font-bold">187</p>
                  </div>
                </div>
                <p className="text-sm opacity-80">15% dalam perjalanan</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 opacity-80" />
                  <div className="text-right">
                    <p className="text-sm opacity-90">Active Drivers</p>
                    <p className="text-3xl font-bold">45</p>
                  </div>
                </div>
                <p className="text-sm opacity-80">Online sekarang</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Pengiriman Hari Ini
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-800">JNE</p>
                      <p className="text-sm text-slate-600">45 paket</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-600 font-semibold">38 delivered</p>
                      <p className="text-xs text-slate-500">84% completion</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-800">Internal Fleet</p>
                      <p className="text-sm text-slate-600">67 paket</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600 font-semibold">62 delivered</p>
                      <p className="text-xs text-slate-500">93% completion</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-800">Partner Network</p>
                      <p className="text-sm text-slate-600">31 paket</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-purple-600 font-semibold">28 delivered</p>
                      <p className="text-xs text-slate-500">90% completion</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Performa Mingguan
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">On-Time Delivery</span>
                      <span className="font-semibold text-slate-800">87%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Customer Satisfaction</span>
                      <span className="font-semibold text-slate-800">92%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Driver Efficiency</span>
                      <span className="font-semibold text-slate-800">85%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Route Optimization</span>
                      <span className="font-semibold text-slate-800">78%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-sm border border-slate-700 p-8 text-white">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Quick Access
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button onClick={() => setActiveTab('tracking')} className="bg-white/10 hover:bg-white/20 rounded-lg p-4 backdrop-blur transition-all text-left">
                  <MapPin className="w-6 h-6 mb-2" />
                  <p className="font-semibold mb-1">Order Tracking</p>
                  <p className="text-sm text-slate-300">Lacak semua pesanan</p>
                </button>
                <button onClick={() => setActiveTab('assignment')} className="bg-white/10 hover:bg-white/20 rounded-lg p-4 backdrop-blur transition-all text-left">
                  <Truck className="w-6 h-6 mb-2" />
                  <p className="font-semibold mb-1">Delivery Assignment</p>
                  <p className="text-sm text-slate-300">Assign driver & route</p>
                </button>
                <button onClick={() => setActiveTab('analytics')} className="bg-white/10 hover:bg-white/20 rounded-lg p-4 backdrop-blur transition-all text-left">
                  <BarChart3 className="w-6 h-6 mb-2" />
                  <p className="font-semibold mb-1">Analytics</p>
                  <p className="text-sm text-slate-300">Performa & insights</p>
                </button>
                <button onClick={() => { setSelectedProject('jne'); setActiveTab('project'); }} className="bg-white/10 hover:bg-white/20 rounded-lg p-4 backdrop-blur transition-all text-left">
                  <Database className="w-6 h-6 mb-2" />
                  <p className="font-semibold mb-1">3PL Projects</p>
                  <p className="text-sm text-slate-300">JNE, MUP, Sayurbox, dll</p>
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}