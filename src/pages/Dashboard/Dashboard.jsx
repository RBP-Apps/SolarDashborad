import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { supabase, supabaseReady } from '../../lib/supabase';

const columns = [
  { key: 'created_at', label: 'Date', render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString('en-IN', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '-') },
  { key: 'owner_name', label: 'Name' },
  { key: 'mobile', label: 'Mobile Number' },
  { key: 'village', label: 'Village' },
  { key: 'tehsil', label: 'Tehsil' },
  { key: 'district', label: 'District' },
  { key: 'khasra_numbers', label: 'Khasra Numbers', render: (r) => (Array.isArray(r.khasra_numbers) ? r.khasra_numbers.join(', ') : r.khasra_numbers || '-') },
  { key: 'total_acres', label: 'Total Area (Acres)' },
  { key: 'farmer_count', label: 'No. of Farmers' },
  { key: 'substation_name', label: '33/11 kV Substation' },
  { key: 'substation_road_km', label: 'Distance from Substation (km)' },
  { key: 'road_to_road_km', label: 'Road-to-Road Distance (km)' },
  { key: 'expected_rent_per_acre', label: 'Expected Rent (₹/Acre)' }
];

const TABLE = 'kusum_land_proposals';

const filterFields = [
  { key: 'district', label: 'District' },
  { key: 'tehsil', label: 'Tehsil' },
  { key: 'village', label: 'Village' },
  { key: 'substation_name', label: 'Substation' }
];
const initials = (name) => {
  const parts = String(name ?? '').trim().split(/s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const emptyFilters = { district: '', tehsil: '', village: '', substation_name: '' };
const norm = (v) => String(v ?? '').trim().toLowerCase();

const cell = (col, row) => (col.render ? col.render(row) : row[col.key] ?? '-');

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [selected, setSelected] = useState(null);

  const load = async (silent = false) => {
    if (!supabaseReady) { toast.error('Database is not configured'); setLoading(false); return; }
    if (!silent) setLoading(true);
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
    setLoading(false);
    if (error) { if (!silent) toast.error(error.message || 'Could not load data'); return; }
    setRows(data || []);
  };

  useEffect(() => {
    load();
    if (!supabaseReady) return undefined;

    const byNewest = (a, b) => String(b.created_at).localeCompare(String(a.created_at));
    const channel = supabase
      .channel('proposals-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setRows((prev) => prev.filter((r) => r.proposal_id !== payload.old.proposal_id));
        } else {
          setRows((prev) => [payload.new, ...prev.filter((r) => r.proposal_id !== payload.new.proposal_id)].sort(byNewest));
        }
      })
      .subscribe();

    // safety net: quietly re-sync every 10s and when the tab becomes visible again, in case realtime is off or drops
    const timer = setInterval(() => load(true), 10000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(true); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, []);

  const options = useMemo(() => Object.fromEntries(filterFields.map((f) => {
    const seen = new Map();
    rows.forEach((r) => { const v = String(r[f.key] ?? '').trim(); if (v && !seen.has(norm(v))) seen.set(norm(v), v); });
    return [f.key, [...seen.values()].sort((a, b) => a.localeCompare(b))];
  })), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) =>
      filterFields.every((f) => !filters[f.key] || norm(r[f.key]) === norm(filters[f.key])) &&
      (!q || columns.some((c) => String(cell(c, r)).toLowerCase().includes(q)))
    );
  }, [rows, query, filters]);

  const hasFilters = query || Object.values(filters).some(Boolean);
  const clearAll = () => { setQuery(''); setFilters(emptyFilters); };


  const exportExcel = () => {
    const data = filtered.map((r) => Object.fromEntries(columns.map((c) => [c.label, cell(c, r)])));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Proposals');
    XLSX.writeFile(wb, 'saur-sanyantra-proposals.xlsx');
  };

  useEffect(() => {
    if (!selected) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected]);

  const empty = loading ? 'Loading...' : 'No data found';

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[#fdf3e1]">
      <div className="flex-1 min-h-0 w-full max-w-[1800px] mx-auto p-3 md:p-4 flex flex-col gap-3">

        <div className="grid grid-cols-2 lg:flex lg:flex-nowrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search (name, mobile, village, district...)"
            className="col-span-2 h-10 w-full lg:flex-1 lg:min-w-[220px] border border-[#ecd9b8] rounded-lg px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f5a36]"
          />
          {filterFields.map((f) => (
            <select
              key={f.key}
              value={filters[f.key]}
              onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="h-10 w-full lg:w-[150px] lg:flex-shrink-0 min-w-0 border border-[#ecd9b8] rounded-lg px-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1f5a36]"
            >
              <option value="">All {f.label}s</option>
              {options[f.key].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          {hasFilters && <button onClick={clearAll} className="h-10 px-2 text-sm font-semibold text-[#14301f] underline whitespace-nowrap lg:flex-shrink-0">Clear</button>}
          <button onClick={exportExcel} disabled={!filtered.length} className={`${hasFilters ? '' : 'col-span-2'} h-10 px-4 lg:flex-shrink-0 rounded-lg bg-[#14301f] text-white text-sm font-semibold hover:bg-[#1f5a36] disabled:opacity-50 whitespace-nowrap`}>Download Excel</button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col bg-white border border-[#f0e2c4] rounded-xl overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            {/* mobile: one card per record, no sideways scrolling */}
            <div className="md:hidden">
              {filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-gray-500">{empty}</p>
              ) : filtered.map((r, i) => (
                <div key={r.proposal_id ?? i} className={`flex items-center gap-3 px-3 py-3 border-b border-[#f0e2c4] ${i % 2 ? 'bg-[#fffaf0]' : 'bg-white'}`}>
                  <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#14301f] text-white flex items-center justify-center font-bold">{initials(r.owner_name)}</div>
                  <div className="flex-1 min-w-0 text-sm space-y-0.5">
                    <p className="font-bold text-[#14301f] truncate">{r.owner_name}</p>
                    <p className="text-gray-700 truncate">{r.mobile}</p>
                    <p className="text-gray-600 truncate">{[r.village, r.district].filter(Boolean).join(', ')}</p>
                  </div>
                  <button type="button" onClick={() => setSelected(r)} className="flex-shrink-0 h-9 px-3 rounded-lg border border-[#14301f] text-[#14301f] text-sm font-semibold active:bg-[#14301f] active:text-white">View</button>
                </div>
              ))}
            </div>

            {/* tablet / desktop: table */}
            <table className="hidden md:table w-full min-w-max text-sm border-collapse">
              <thead className="text-white">
                <tr>
                  <th className="sticky top-0 z-10 bg-[#14301f] px-4 py-2.5 text-center align-middle whitespace-nowrap">S.No.</th>
                  {columns.map((c) => <th key={c.key} className="sticky top-0 z-10 bg-[#14301f] px-4 py-2.5 text-center align-middle whitespace-nowrap">{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={columns.length + 1} className="px-3 py-8 text-center text-gray-500">{empty}</td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.proposal_id ?? i} className={i % 2 ? 'bg-[#fffaf0]' : 'bg-white'}>
                    <td className="px-4 py-2.5 text-center align-middle">{i + 1}</td>
                    {columns.map((c) => <td key={c.key} className="px-4 py-2.5 text-center align-middle whitespace-nowrap">{cell(c, r)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex-shrink-0 border-t border-[#f0e2c4] bg-[#fffaf0] px-4 py-2 text-sm text-gray-700 font-medium">
            {filtered.length} of {rows.length} records
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md max-h-[85dvh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 bg-[#14301f] text-white px-4 py-3">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-white text-[#14301f] flex items-center justify-center font-bold">{initials(selected.owner_name)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{selected.owner_name}</p>
                <p className="text-xs opacity-80">{cell(columns[0], selected)}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="flex-shrink-0 w-9 h-9 rounded-full text-2xl leading-none hover:bg-white/10">×</button>
            </div>
            <dl className="flex-1 overflow-y-auto divide-y divide-[#f0e2c4] text-sm">
              {columns.slice(2).map((c) => (
                <div key={c.key} className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <dt className="text-gray-600 flex-shrink-0 max-w-[48%]">{c.label}</dt>
                  <dd className="font-semibold text-[#14301f] text-right break-words min-w-0">
                    {c.key === 'mobile' && selected.mobile ? <a href={`tel:${selected.mobile}`} className="underline">{selected.mobile}</a> : cell(c, selected)}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="p-3 border-t border-[#f0e2c4]">
              <button type="button" onClick={() => setSelected(null)} className="w-full h-10 rounded-lg bg-[#14301f] text-white font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
