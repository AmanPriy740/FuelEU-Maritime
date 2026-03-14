import React, { useState } from 'react';
import { Ship, BarChart3, Landmark, Network, CheckCircle2, XCircle } from 'lucide-react';


const TARGET_INTENSITY = 89.3368;
const calculateEnergy = (consumption) => consumption * 41000;
const calculateCB = (actual, consumption) => (TARGET_INTENSITY - actual) * calculateEnergy(consumption);
const formatCB = (cb) => (cb / 1000000).toFixed(2) + ' tCO₂e'; // For display

const SEED_DATA = [
  { id: "R001", vesselType: "Container", fuelType: "HFO", year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: false },
  { id: "R002", vesselType: "Bulk Carrier", fuelType: "LNG", year: 2024, ghgIntensity: 88.0, fuelConsumption: 4800, distance: 11500, totalEmissions: 4200, isBaseline: false },
  { id: "R003", vesselType: "Tanker", fuelType: "MGO", year: 2024, ghgIntensity: 93.5, fuelConsumption: 5100, distance: 12500, totalEmissions: 4700, isBaseline: false },
  { id: "R004", vesselType: "RoRo", fuelType: "HFO", year: 2025, ghgIntensity: 89.2, fuelConsumption: 4900, distance: 11800, totalEmissions: 4300, isBaseline: false },
  { id: "R005", vesselType: "Container", fuelType: "LNG", year: 2025, ghgIntensity: 90.5, fuelConsumption: 4950, distance: 11900, totalEmissions: 4400, isBaseline: false },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('routes');
  const [routes, setRoutes] = useState(SEED_DATA);
  const [bankedAmounts, setBankedAmounts] = useState({});
  const [poolResults, setPoolResults] = useState(null);
  
  const baselineRoute = routes.find(r => r.isBaseline);

  // --- ADAPTERS (UI Components) ---

  const handleSetBaseline = (id) => {
    setRoutes(routes.map(r => ({ ...r, isBaseline: r.id === id })));
  };

  const renderRoutesTab = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Ship className="text-blue-600" /> Route Registry
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="p-3">Route ID</th>
              <th className="p-3">Vessel</th>
              <th className="p-3">Fuel</th>
              <th className="p-3">Year</th>
              <th className="p-3">GHG (gCO₂e/MJ)</th>
              <th className="p-3">Consumption (t)</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {routes.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-medium text-slate-800">{r.id}</td>
                <td className="p-3">{r.vesselType}</td>
                <td className="p-3">{r.fuelType}</td>
                <td className="p-3">{r.year}</td>
                <td className="p-3">{r.ghgIntensity}</td>
                <td className="p-3">{r.fuelConsumption}</td>
                <td className="p-3">
                  <button 
                    onClick={() => handleSetBaseline(r.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${r.isBaseline ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {r.isBaseline ? 'Baseline Active' : 'Set Baseline'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCompareTab = () => {
    if (!baselineRoute) return <div className="p-6 bg-yellow-50 text-yellow-800 rounded-xl">Please set a Baseline Route in the Routes tab first.</div>;

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart3 className="text-blue-600" /> GHG Comparison
        </h2>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-600 font-semibold">Target Intensity (2025)</p>
            <p className="text-2xl font-bold text-blue-900">{TARGET_INTENSITY} <span className="text-sm font-normal">gCO₂e/MJ</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-600 font-semibold">Baseline Route ({baselineRoute.id})</p>
            <p className="text-2xl font-bold text-blue-900">{baselineRoute.ghgIntensity} <span className="text-sm font-normal">gCO₂e/MJ</span></p>
          </div>
        </div>

        <table className="w-full text-left text-sm mb-8">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="p-3">Route ID</th>
              <th className="p-3">GHG Intensity</th>
              <th className="p-3">% Diff (vs Baseline)</th>
              <th className="p-3">Compliance (Target)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {routes.map(r => {
              const percentDiff = (((r.ghgIntensity / baselineRoute.ghgIntensity) - 1) * 100).toFixed(2);
              const isCompliant = r.ghgIntensity <= TARGET_INTENSITY;
              return (
                <tr key={r.id}>
                  <td className="p-3 font-medium">{r.id} {r.isBaseline && <span className="text-xs text-blue-500">(Base)</span>}</td>
                  <td className="p-3">{r.ghgIntensity}</td>
                  <td className={`p-3 ${percentDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>{percentDiff > 0 ? '+' : ''}{percentDiff}%</td>
                  <td className="p-3">
                    {isCompliant ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBankingTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {routes.map(r => {
        const cb = calculateCB(r.ghgIntensity, r.fuelConsumption);
        const banked = bankedAmounts[r.id] || 0;
        const netCb = cb + banked;
        const isSurplus = netCb > 0;

        return (
          <div key={r.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-800">{r.id} - {r.vesselType}</h3>
                <p className="text-xs text-slate-500">Year: {r.year} | Intensity: {r.ghgIntensity}</p>
              </div>
              <Landmark className="text-slate-400" />
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-600">Compliance Balance</p>
              <p className={`text-xl font-bold ${isSurplus ? 'text-green-600' : 'text-red-600'}`}>
                {formatCB(netCb)}
              </p>
            </div>

            <div className="mt-auto pt-4 border-t flex gap-2">
              <button 
                disabled={!isSurplus}
                onClick={() => setBankedAmounts(prev => ({...prev, [r.id]: (prev[r.id] || 0) - 1000000}))}
                className="flex-1 py-2 bg-green-50 text-green-700 font-medium rounded-lg text-sm hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Bank Surplus
              </button>
              <button 
                disabled={isSurplus || banked === 0}
                onClick={() => setBankedAmounts(prev => ({...prev, [r.id]: (prev[r.id] || 0) + 1000000}))}
                className="flex-1 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg text-sm hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Apply Banked
              </button>
            </div>
          </div>
        )
      })}
    </div>
  );

  const renderPoolingTab = () => {
    // Generate poolable members list
    const members = routes.map(r => ({
      id: r.id,
      cb: calculateCB(r.ghgIntensity, r.fuelConsumption)
    }));

    const totalCb = members.reduce((sum, m) => sum + m.cb, 0);
    const canPool = totalCb >= 0;

    const handleCreatePool = () => {
      // Hexagonal Application Logic mirrored here for the UI demo
      let surpluses = members.filter(m => m.cb > 0).sort((a,b) => b.cb - a.cb);
      let deficits = members.filter(m => m.cb < 0).sort((a,b) => a.cb - b.cb);
      
      let results = {};
      members.forEach(m => results[m.id] = { id: m.id, before: m.cb, after: m.cb });

      let sIdx = 0;
      for (let def of deficits) {
        let needed = Math.abs(def.cb);
        while (needed > 0 && sIdx < surpluses.length) {
          let surp = surpluses[sIdx];
          let available = results[surp.id].after;
          
          if (available >= needed) {
            results[surp.id].after -= needed;
            results[def.id].after = 0;
            needed = 0;
          } else {
            results[def.id].after += available;
            needed -= available;
            results[surp.id].after = 0;
            sIdx++;
          }
        }
      }
      setPoolResults(Object.values(results));
    };

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Network className="text-purple-600" /> Fleet Pooling (Art. 21)
            </h2>
            <div className={`px-4 py-2 rounded-full font-bold ${canPool ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              Pool Net CB: {formatCB(totalCb)}
            </div>
         </div>

         {!poolResults ? (
            <div>
              <p className="text-slate-600 mb-6">Current fleet balances. Pool requires sum of CB to be positive or zero.</p>
              <div className="grid grid-cols-5 gap-4 mb-6">
                {members.map(m => (
                  <div key={m.id} className={`p-4 rounded-lg border ${m.cb > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="font-bold text-slate-800 text-center">{m.id}</p>
                    <p className={`text-center text-sm font-medium ${m.cb > 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCB(m.cb)}</p>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleCreatePool}
                disabled={!canPool}
                className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
                Execute Pool Allocation (Greedy Algorithm)
              </button>
            </div>
         ) : (
           <div>
             <h3 className="font-bold text-slate-800 mb-4">Post-Allocation Balances</h3>
             <table className="w-full text-left text-sm mb-6">
                <thead className="bg-slate-50 text-slate-600 border-b">
                  <tr>
                    <th className="p-3">Route ID</th>
                    <th className="p-3">CB Before</th>
                    <th className="p-3">CB After Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {poolResults.map(r => (
                    <tr key={r.id}>
                      <td className="p-3 font-medium">{r.id}</td>
                      <td className={`p-3 ${r.before < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCB(r.before)}</td>
                      <td className="p-3 font-bold text-slate-800">{formatCB(r.after)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
             <button onClick={() => setPoolResults(null)} className="px-4 py-2 text-slate-600 border border-slate-300 rounded hover:bg-slate-50">Reset Pool</button>
           </div>
         )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">FuelEU Maritime</h1>
          <p className="text-slate-500 mt-1">Compliance Management Dashboard</p>
        </header>

        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-px">
          {[
            { id: 'routes', label: 'Routes', icon: Ship },
            { id: 'compare', label: 'Compare', icon: BarChart3 },
            { id: 'banking', label: 'Banking', icon: Landmark },
            { id: 'pooling', label: 'Pooling', icon: Network }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-t-lg'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            )
          })}
        </div>

        <main className="transition-all">
          {activeTab === 'routes' && renderRoutesTab()}
          {activeTab === 'compare' && renderCompareTab()}
          {activeTab === 'banking' && renderBankingTab()}
          {activeTab === 'pooling' && renderPoolingTab()}
        </main>

      </div>
    </div>
  );
}