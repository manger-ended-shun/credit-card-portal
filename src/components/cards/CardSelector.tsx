'use client';
 
import { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { Card } from '@/types/database';
import { cn } from '@/utils/helpers';
import { Badge } from '@/components/ui/Badge';
 
interface CardSelectorProps {
  cards: Card[];
  selectedCards: string[];
  onSelectionChange: (selected: string[]) => void;
}
 
export function CardSelector({ cards, selectedCards, onSelectionChange }: CardSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  
  const banks = useMemo(() => {
const uniqueBanks = Array.from(new Set(cards.map(card => card.bank_name)));
    return ['all', ...uniqueBanks];
  }, [cards]);
  
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const matchesSearch = card.card_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           card.bank_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBank = selectedBank === 'all' || card.bank_name === selectedBank;
      return matchesSearch && matchesBank && card.is_active;
    });
  }, [cards, searchQuery, selectedBank]);
  
  const toggleCard = (cardId: string) => {
    if (selectedCards.includes(cardId)) {
      onSelectionChange(selectedCards.filter(id => id !== cardId));
    } else {
      if (selectedCards.length < 4) {
        onSelectionChange([...selectedCards, cardId]);
      }
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={selectedBank}
          onChange={(e) => setSelectedBank(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {banks.map(bank => (
            <option key={bank} value={bank}>
              {bank === 'all' ? 'All Banks' : bank}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {selectedCards.length} of 4 cards selected
        </p>
        {selectedCards.length > 0 && (
          <button
            onClick={() => onSelectionChange([])}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCards.map(card => {
          const isSelected = selectedCards.includes(card.id);
          
          return (
            <button
              key={card.id}
              onClick={() => toggleCard(card.id)}
              className={cn(
                'flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all',
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                  isSelected
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {card.card_name}
                </p>
                <p className="text-sm text-gray-500">{card.bank_name}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {card.card_tier && (
                    <Badge variant="info">{card.card_tier}</Badge>
                  )}
                  {card.annual_fee === 0 && (
                    <Badge variant="success">Free</Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {filteredCards.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          No cards found matching your criteria
        </div>
      )}
    </div>
  );
}