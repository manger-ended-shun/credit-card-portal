import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Shield, Plane, Gift, ArrowRightLeft, AlertCircle, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import React from 'react'; // Added to ensure React.ReactNode is available

// Initialize Supabase Server-Side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: card } = await supabase.from('cards').select('card_name, bank_name').eq('id', params.id).single();
  if (!card) return { title: 'Card Not Found' };
  return {
    title: `${card.card_name} Review & Benefits | Credit Card Portal`,
    description: `Discover the reward rates, lounge access, and transfer partners for the ${card.bank_name} ${card.card_name}.`,
  };
}

export default async function CardDetailPage({ params }: { params: { id: string } }) {
  const { data: card, error } = await supabase.from('cards').select('*').eq('id', params.id).single();

  if (error || !card) return notFound();

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wide">{card.bank_name}</p>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-1">{card.card_name}</h1>
              <div className="flex items-center gap-3 mt-4">
                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">{card.card_tier}</span>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{card.card_network}</span>
              </div>
            </div>
            <div className="text-left md:text-right bg-slate-50 p-5 rounded-xl border border-slate-100">
              <p className="text-sm font-medium text-slate-500">Annual Fee</p>
              <p className="text-3xl font-black text-slate-900">₹{card.annual_fee.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-500 mt-2 max-w-[200px] leading-relaxed">{card.annual_fee_waiver_conditions || 'No fee waiver'}</p>
            </div>
          </div>
        </div>

        {/* The Matrix Data Grid (Semantic Formatting) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SemanticCard title="Base Earn Rate" icon={<Gift />} text={card.earn_base_rate} type="neutral" />
          <SemanticCard title="Accelerated Multipliers" icon={<Star />} text={card.earn_accelerated} type="neutral" />
          
          {/* High-Contrast Pros & Cons */}
          <SemanticCard title="Best Use (Pros)" icon={<ThumbsUp />} text={card.best_use} type="pro" />
          <SemanticCard title="Worst Use (Cons)" icon={<ThumbsDown />} text={card.worst_use} type="con" />
          
          <SemanticCard title="Transfer Partners" icon={<ArrowRightLeft />} text={card.transfer_partners} type="neutral" />
          <SemanticCard title="Exclusions & Caps" icon={<AlertCircle />} text={card.earn_exclusions} type="neutral" />
        </div>

        {/* Perks Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Lifestyle Perks</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PerkStat label="Domestic Lounge" value={card.domestic_lounge_access === 99 ? 'Unlimited' : card.domestic_lounge_access} icon={<Plane />} />
            <PerkStat label="Intl. Lounge" value={card.international_lounge_access === 99 ? 'Unlimited' : card.international_lounge_access} icon={<Plane />} />
            <PerkStat label="Golf Rounds" value={card.golf_access === 99 ? 'Unlimited' : card.golf_access} icon={<span className="text-2xl">⛳</span>} />
            <PerkStat label="Insurance" value={card.air_accident_insurance ? 'Included' : '-'} icon={<Shield />} />
          </div>
        </div>

      </div>
    </div>
  );
}

// ---------------- UI Helper Components ----------------

// 1. Define strict types for SemanticCard to fix the build error
interface SemanticCardProps {
  title: string;
  text: string | null;
  type: 'pro' | 'con' | 'neutral';
  icon: React.ReactNode;
}

function SemanticCard({ title, text, type, icon }: SemanticCardProps) {
  if (!text || text === '-') return null;

  const styles = {
    pro: "bg-emerald-50/50 border-emerald-200",
    con: "bg-rose-50/50 border-rose-200",
    neutral: "bg-white border-slate-200"
  };

  const textColors = {
    pro: "text-emerald-900",
    con: "text-rose-900",
    neutral: "text-slate-900"
  };

  const iconColors = {
    pro: "text-emerald-600",
    con: "text-rose-600",
    neutral: "text-blue-600"
  };

  const formatTextToLines = (rawText: string) => {
    const formatted = rawText
      .replace(/;\s+/g, '\n')
      .replace(/\.\s+/g, '\n')
      .replace(/,\s+/g, '\n')
      .replace(/[;.,]$/, ''); 
    return formatted.split('\n').filter(line => line.trim().length > 0);
  };

  const lines = formatTextToLines(text);

  return (
    <div className={`p-6 rounded-2xl border ${styles[type]} shadow-sm transition-all hover:shadow-md h-full flex flex-col`}>
      <div className="flex items-center gap-3 mb-4">
        <span className={iconColors[type]}>{icon}</span>
        <h3 className={`font-bold ${textColors[type]}`}>{title}</h3>
      </div>
      <div className="flex flex-col gap-2 flex-grow">
        {lines.map((line: string, idx: number) => (
          <div key={idx} className="flex items-start gap-2">
            <span className={`mt-0.5 text-lg leading-none ${type === 'neutral' ? 'text-slate-300' : iconColors[type]}`}>•</span>
            <span className="text-sm text-slate-700 leading-relaxed font-medium opacity-90">{line.trim()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Define strict types for PerkStat to prevent further 'any' errors
interface PerkStatProps {
  label: string;
  value: string | number | null;
  icon: React.ReactNode;
}

function PerkStat({ label, value, icon }: PerkStatProps) {
  return (
    <div className="flex flex-col items-center text-center p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">
      <div className="text-slate-400 mb-3 h-6 w-6 flex items-center justify-center">{icon}</div>
      <p className="font-bold text-lg text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
}