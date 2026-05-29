export const dynamic = 'force-dynamic';

// 🟢 1. Removed createClient and added your centralized safe client!
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Shield, Plane, Gift, ArrowRightLeft, AlertCircle, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import React from 'react';

// 🟢 2. The local createClient block has been DELETED!

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
              <p className="text-3xl font-black text-slate-900">₹{card.annual_fee?.toLocaleString('en-IN') || '0'}</p>
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
          <div