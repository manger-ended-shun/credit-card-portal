'use client';
 
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/types/database';
import { CardSelector } from '@/components/cards/CardSelector';
import { ComparisonTable } from '@/components/cards/ComparisonTable';
import { Button } from '@/components/ui/Button';
import { Download, RefreshCw } from 'lucide-react';
 
export default function ComparePage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCards();
  }, []);
  
  const fetchCards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('is_active', true)
        .order('bank_name')
        .order('card_tier');
      
      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const selectedCardObjects = cards.filter(card => selectedCards.includes(card.id));
  
  const exportToCSV = () => {
    if (selectedCardObjects.length === 0) return;
    
    const headers = [
      'Card Name',
      'Bank',
      'Annual Fee',
      'Reward Type',
      'Base Reward Rate',
      'Domestic Lounge',
      'International Lounge',
    ];
    
    const rows = selectedCardObjects.map(card => [
      card.card_name,
      card.bank_name,
      card.annual_fee,
      card.reward_type || '',
      card.base_reward_rate || '',
      card.domestic_lounge_access,
      card.international_lounge_access,
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'card-comparison.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Compare Cards</h1>
          <p className="mt-1 text-gray-500">Select up to 4 cards to compare side by side</p>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Card Selector */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Select Cards</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchCards}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
              
              <CardSelector
                cards={cards}
                selectedCards={selectedCards}
                onSelectionChange={setSelectedCards}
              />
            </div>
            
            {/* Comparison Table */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Comparison</h2>
                {selectedCards.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCSV}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                )}
              </div>
              
              <ComparisonTable cards={selectedCardObjects} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
