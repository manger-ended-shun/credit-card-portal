'use client';

import { useState } from 'react';
import { Card as DatabaseCard } from '@/types/database'; // 1. Alias the original import
import { formatCurrency } from '@/utils/helpers';
import { Badge } from '@/components/ui/Badge';
import { Check, X, Star, Plane, Fuel, Shield, Gift, AlertCircle, ThumbsUp, ThumbsDown, ArrowRightLeft, ChevronDown, ChevronUp } from 'lucide-react';

// 2. Extend the base database type with your new custom fields!
export interface Card extends DatabaseCard {
  earn_base_rate?: string | null;
  earn_accelerated?: string | null;
  points_per_100?: string | number | null;
  transfer_partners?: string | null;
  earn_exclusions?: string | null;
  best_use?: string | null;
  worst_use?: string | null;
}

// 3. The "Pop" Effect Helper: Automatically badges important keywords
const highlightText = (text: string | number) => {
  const str = String(text);
  if (!str) return str;

  const keywords = ['Unlimited', '0 RP', '0 EDGE', '0 TC', 'SmartBuy', 'Waiver', 'Free'];
  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = str.split(regex);

  return parts.map((part, i) => {
    if (keywords.some(k => k.toLowerCase() === part.toLowerCase())) {
      return (
        <span key={i} className="font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-xs uppercase tracking-wider border border-indigo-100">
          {part}
        </span>
      );
    }
    return part;
  });
};

interface ComparisonTableProps {
  cards: Card[];
}

export function ComparisonTable({ cards }: ComparisonTableProps) {
  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
        <p className="text-slate-500 font-medium">Select cards to compare</p>
      </div>
    );
  }

  const formatValue = (value: number | null | undefined, suffix: string = '') => {
    if (value === null || value === undefined) return '-';
    if (value === 99) return 'Unlimited'; 
    return `${value}${suffix}`;
  };

  const formatBoolean = (value: boolean | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return value ? <Check className="h-5 w-5 text-emerald-500" /> : <X className="h-5 w-5 text-rose-400" />;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/50">
            <th className="sticky left-0 bg-slate-50/90 backdrop-blur px-4 py-4 text-left text-sm font-bold text-slate-900 z-10 shadow-[1px_0_0_0_#e2e8f0]">
              Feature
            </th>
            {cards.map(card => (
              <th key={card.id} className="px-4 py-4 text-left min-w-[280px] align-top">
                <div>
                  <p className="font-extrabold text-base text-slate-900">{card.card_name}</p>
                  <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">{card.bank_name}</p>
                  <a 
                    href={`/cards/${card.id}`}
                    className="inline-flex text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 transition-all shadow-sm"
                  >
                    View Details →
                  </a>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          
          <ComparisonRow label="Card Tier" icon={<Star className="h-4 w-4" />}>
            {cards.map(card => <td key={card.id} className="px-4 py-3"><Badge variant="info">{card.card_tier || '-'}</Badge></td>)}
          </ComparisonRow>
          
          <ComparisonRow label="Annual Fee" icon={<span className="text-sm font-bold">₹</span>}>
            {cards.map(card => <td key={card.id} className="px-4 py-3 font-semibold text-slate-900 tabular-nums">{formatCurrency(card.annual_fee)}</td>)}
          </ComparisonRow>

          <ExpandableTextRow label="Base Earn Rate" icon={<Gift className="h-4 w-4" />} cards={cards} field="earn_base_rate" />
          <ExpandableTextRow label="Accelerated Earn" icon={<Star className="h-4 w-4 text-amber-500" />} cards={cards} field="earn_accelerated" />
          <ExpandableTextRow label="Points per ₹100" icon={<span className="text-sm font-bold text-slate-400">Pts</span>} cards={cards} field="points_per_100" />
          <ExpandableTextRow label="Transfer Partners" icon={<ArrowRightLeft className="h-4 w-4" />} cards={cards} field="transfer_partners" />
          <ExpandableTextRow label="Exclusions & Caps" icon={<AlertCircle className="h-4 w-4 text-rose-500" />} cards={cards} field="earn_exclusions" />
          
          <ExpandableTextRow label="Best Use" icon={<ThumbsUp className="h-4 w-4 text-emerald-500" />} cards={cards} field="best_use" />
          <ExpandableTextRow label="Worst Use" icon={<ThumbsDown className="h-4 w-4 text-rose-500" />} cards={cards} field="worst_use" />

          <ComparisonRow label="Domestic Lounge" icon={<Plane className="h-4 w-4" />}>
            {cards.map(card => <td key={card.id} className="px-4 py-3 font-medium text-slate-700">{highlightText(formatValue(card.domestic_lounge_access, ' visits/year'))}</td>)}
          </ComparisonRow>
          
          <ComparisonRow label="International Lounge" icon={<Plane className="h-4 w-4" />}>
            {cards.map(card => <td key={card.id} className="px-4 py-3 font-medium text-slate-700">{highlightText(formatValue(card.international_lounge_access, ' visits/year'))}</td>)}
          </ComparisonRow>
          
          <ComparisonRow label="Fuel Surcharge Waiver" icon={<Fuel className="h-4 w-4" />}>
            {cards.map(card => <td key={card.id} className="px-4 py-3">{formatBoolean(card.fuel_surcharge_waiver)}</td>)}
          </ComparisonRow>
          
          <ComparisonRow label="Golf Access" icon={<span className="text-sm">⛳</span>}>
            {cards.map(card => <td key={card.id} className="px-4 py-3 font-medium text-slate-700">{highlightText(formatValue(card.golf_access, ' rounds/year'))}</td>)}
          </ComparisonRow>
          
          <ComparisonRow label="Air Accident Insurance" icon={<Shield className="h-4 w-4" />}>
            {cards.map(card => {
              let displayValue = '-';
              if (card.air_accident_insurance) {
                if (card.air_accident_insurance >= 10000000) displayValue = `₹${card.air_accident_insurance / 10000000} Crore`;
                else if (card.air_accident_insurance >= 100000) displayValue = `₹${card.air_accident_insurance / 100000} Lakh`;
                else displayValue = formatCurrency(card.air_accident_insurance);
              }
              return <td key={card.id} className="px-4 py-3 font-medium text-slate-700 tabular-nums">{displayValue}</td>;
            })}
          </ComparisonRow>

          <ComparisonRow label="Min. Monthly Income" icon={<span className="text-sm">💰</span>}>
            {cards.map(card => <td key={card.id} className="px-4 py-3 font-medium text-slate-700 tabular-nums">{card.min_income_monthly ? formatCurrency(card.min_income_monthly) : '-'}</td>)}
          </ComparisonRow>
          
        </tbody>
      </table>
    </div>
  );
}

function ComparisonRow({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode; }) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="sticky left-0 bg-white px-4 py-4 text-sm font-semibold text-slate-700 z-10 shadow-[1px_0_0_0_#e2e8f0]">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{icon}</span>
          {label}
        </div>
      </td>
      {children}
    </tr>
  );
}

function ExpandableTextRow({ label, icon, cards, field }: { label: string; icon: React.ReactNode; cards: Card[]; field: keyof Card }) {
  const [isExpanded, setIsExpanded] = useState(true); 
  
  if (!cards.some(c => c[field])) return null;

  const formatTextToLines = (text: string) => {
    if (!text || text === '-') return [];
    const formatted = text
      .replace(/;\s+/g, '\n')
      .replace(/\.\s+/g, '\n')
      .replace(/,\s+/g, '\n')
      .replace(/[;.,]$/, ''); 
    return formatted.split('\n').filter(line => line.trim().length > 0);
  };

  return (
    <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
      <td className="sticky left-0 bg-white px-4 py-5 text-sm font-semibold text-slate-700 z-10 shadow-[1px_0_0_0_#e2e8f0] align-top w-48">
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{icon}</span>
            {label}
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] text-slate-500 hover:text-slate-800 uppercase tracking-widest font-bold bg-slate-100 px-2 py-1 rounded transition-colors"
          >
            {isExpanded ? <><ChevronUp className="h-3 w-3 inline"/> Collapse</> : <><ChevronDown className="h-3 w-3 inline"/> Expand</>}
          </button>
        </div>
      </td>
      {cards.map(card => {
        const fullText = card[field] ? String(card[field]) : '-';
        const lines = formatTextToLines(fullText);

        return (
          <td key={card.id} className="px-4 py-5 text-sm text-slate-700 align-top max-w-xs">
            {!isExpanded ? (
              <div className="truncate text-slate-500">{fullText.substring(0, 40)}...</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {lines.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-slate-300 mt-0.5">•</span>
                    <span className="leading-relaxed font-medium opacity-90">{highlightText(line.trim())}</span>
                  </div>
                ))}
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}