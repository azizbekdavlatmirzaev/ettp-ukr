import { useEffect, useState } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar as RBar, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'
import QRCode from 'qrcode'

export const RANG = ['#1170a8', '#0fa3a3', '#e8a33d', '#7c5cc4', '#d1495b', '#3ba776', '#5b7fa6']
const GRID = 'rgba(148,163,184,.25)'
const AX = { fontSize: 11.5, fill: '#7f93a8' }
const TT = { contentStyle: { borderRadius: 12, border: '1px solid rgba(148,163,184,.35)', boxShadow: '0 12px 28px rgba(15,30,46,.15)', fontSize: 12.5, background: 'var(--surface)', color: 'var(--text)' }, labelStyle: { fontWeight: 700, color: 'var(--text)' }, itemStyle: { color: 'var(--text)' } }

export function AreaCh({ data, keys, height = 240, names }: { data: Record<string, number | string>[]; keys: string[]; height?: number; names?: Record<string, string> }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {keys.map((k, i) => (
            <linearGradient key={k} id={`ag-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={RANG[i]} stopOpacity={0.32} />
              <stop offset="100%" stopColor={RANG[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="x" tick={AX} axisLine={false} tickLine={false} />
        <YAxis tick={AX} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip {...TT} />
        {keys.map((k, i) => (
          <Area key={k} type="monotone" dataKey={k} name={names?.[k] ?? k} stroke={RANG[i]} strokeWidth={2.5} fill={`url(#ag-${k})`} animationDuration={1200} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function LineCh({ data, keys, height = 240, names }: { data: Record<string, number | string>[]; keys: string[]; height?: number; names?: Record<string, string> }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="x" tick={AX} axisLine={false} tickLine={false} />
        <YAxis tick={AX} axisLine={false} tickLine={false} />
        <Tooltip {...TT} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {keys.map((k, i) => (
          <Line key={k} type="monotone" dataKey={k} name={names?.[k] ?? k} stroke={RANG[i]} strokeWidth={2.5} dot={{ r: 3 }} animationDuration={1200} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function BarCh({ data, keys, height = 240, stacked, names, horizontal, colors }: { data: Record<string, number | string>[]; keys: string[]; height?: number; stacked?: boolean; names?: Record<string, string>; horizontal?: boolean; colors?: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 12, left: horizontal ? 8 : -18, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid stroke={GRID} vertical={!!horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={AX} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="x" tick={AX} axisLine={false} tickLine={false} width={150} />
          </>
        ) : (
          <>
            <XAxis dataKey="x" tick={AX} axisLine={false} tickLine={false} />
            <YAxis tick={AX} axisLine={false} tickLine={false} allowDecimals={false} />
          </>
        )}
        <Tooltip {...TT} cursor={{ fill: 'rgba(148,163,184,.12)' }} />
        {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {keys.map((k, i) => (
          <RBar key={k} dataKey={k} name={names?.[k] ?? k} stackId={stacked ? 's' : undefined} fill={(colors ?? RANG)[i]} radius={stacked ? (i === keys.length - 1 ? (horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]) : 0) : horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} animationDuration={1000} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function Donut({ data, height = 220, center, colors }: { data: { name: string; value: number }[]; height?: number; center?: React.ReactNode; colors?: string[] }) {
  return (
    <div style={{ position: 'relative', height }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Tooltip {...TT} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="92%" paddingAngle={2} stroke="none" animationDuration={1100}>
            {data.map((_, i) => (
              <Cell key={i} fill={(colors ?? RANG)[i % (colors ?? RANG).length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {center && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', textAlign: 'center' }}>{center}</div>}
    </div>
  )
}

export function Legenda({ items, colors }: { items: { l: string; v?: string | number }[]; colors?: string[] }) {
  return (
    <div className="legend">
      {items.map((x, i) => (
        <span key={x.l}>
          <i style={{ background: (colors ?? RANG)[i % (colors ?? RANG).length] }} />
          {x.l}
          {x.v !== undefined && <b style={{ marginLeft: 6 }}>{x.v}</b>}
        </span>
      ))}
    </div>
  )
}

export function QR({ matn, size = 132 }: { matn: string; size?: number }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    QRCode.toDataURL(matn, { margin: 1, width: size * 2, color: { dark: '#0a3a5c', light: '#ffffff' } }).then(setSrc)
  }, [matn, size])
  return src ? <img src={src} width={size} height={size} alt="QR-kod" style={{ borderRadius: 10, border: '1px solid var(--border)', background: '#fff', padding: 4 }} /> : <div className="sk" style={{ width: size, height: size }} />
}
