'use client';
 
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Offer } from '@/types/database';
import { formatDate, timeAgo } from '@/utils/helpers';
import { Badge } from '@/components/ui/Badge';
import { ExternalLink, Clock, Tag } from 'lucide-react';
 
export function OffersFeed() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  
  useEffect(() => {
    fetchOffers();
  }, []);
  
  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const offerTypes = ['all', 'card_offer', 'miles_bonus', 'transfer_bonus', 'cashback_offer'];
  
  const filteredOffers = selectedType === 'all' 
    ? offers 
    : offers.filter(o => o.offer_type === selectedType);
  
  const getOfferTypeBadge = (type: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      card_offer: { color: 'info', label: 'Card Offer' },
      miles_bonus: { color: 'success', label: 'Miles Bonus' },
      transfer_bonus: { color: 'warning', label: 'Transfer Bonus' },
      cashback_offer: { color: 'error', label: 'Cashback' },
    };
    const config = variants[type] || { color: 'default', label: type };
    return <Badge variant={config.color as any}>{config.label}</Badge>;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {offerTypes.map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === 'all' ? 'All Offers' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>
      
      {/* Offers List */}
      <div className="space-y-4">
        {filteredOffers.map(offer => (
          <div
            key={offer.id}
            className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getOfferTypeBadge(offer.offer_type)}
                  {offer.is_featured && (
                    <Badge variant="warning">Featured</Badge>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {offer.title}
                </h3>
                
                {offer.description && (
                  <p className="text-gray-600 text-sm mb-3">
                    {offer.description}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {offer.bank_name && (
                    <span className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      {offer.bank_name}
                    </span>
                  )}
                  
                  {offer.valid_until && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Valid until {formatDate(offer.valid_until)}
                    </span>
                  )}
                  
                  <span className="text-gray-400">
                    {timeAgo(offer.created_at)}
                  </span>
                </div>
                
                {offer.merchants && offer.merchants.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {offer.merchants.map(merchant => (
                      <span
                        key={merchant}
                        className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {merchant}
                      </span>
                   
