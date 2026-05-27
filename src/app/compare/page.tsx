'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/types/database';
import { CardSelector } from '@/components/cards/CardSelector';
import { ComparisonTable } from '@/components/cards/ComparisonTable';
import { Button } from '@/components/ui/Button';
import { Download, RefreshCw, Search, Filter } from 'lucide-react';

export default function ComparePage() {
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('cards').select('*').eq('is_active', true);
      if (error) throw error;
      setAllCards(data || []);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  // The Discovery Engine Logic
  const filteredCards = useMemo(() => {
    return allCards.filter(card => {
      const matchesSearch = card.card_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBank = selectedBank === 'All' || card.bank_name === selectedBank;
      const matchesTier = selectedTier === 'All' || card.card_tier === selectedTier;
      return matchesSearch && matchesBank && matchesTier;
    });
  }, [allCards, searchQuery, selectedBank, selectedTier]);

  const selectedCardObjects = allCards.filter(card => selectedCards.includes(card.id));

  // Dynamic Dropdown Options based on DB
  const uniqueBanks = ['All', ...Array.from(new Set(allCards.map(c => c.bank_name)))].filter(Boolean);
  const uniqueTiers = ['All', ...Array.from(new Set(allCards.map(c => c.card_tier)))].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Compare Cards</h1>
          <p className="mt-1 text-gray-500">Discover and compare the best Indian credit cards.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>
        ) : (
          <div className="space-y-8">
            
            {/* The Discovery Toolbar */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Cards</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="e.g. Infinia..." 
                    className="w-full pl-9 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full sm:w-1/4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Bank</label>
                <select className="w-full border rounded-md p-2" value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
                  {uniqueBanks.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                </select>
              </div>
              <div className="w-full sm:w-1/4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Tier</label>
                <select className="w-full border rounded-md p-2" value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)}>
{uniqueTiers.map(tier => (
  <option key={tier || 'unspecified'} value={tier || ''}>
    {tier || 'Unspecified'}
  </option>
))}                </select>
              </div>
              <Button variant="ghost" onClick={fetchCards} className="flex gap-2 h-10 ml-auto">
                <RefreshCw className="h-4 w-4" /> Refresh DB
              </Button>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Cards ({filteredCards.length} found)</h2>
              <CardSelector cards={filteredCards} selectedCards={selectedCards} onSelectionChange={setSelectedCards} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 overflow-hidden">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Comparison</h2>
              <ComparisonTable cards={selectedCardObjects} />
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}