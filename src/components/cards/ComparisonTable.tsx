'use client';
 
import { Card } from '@/types/database';
import { formatCurrency } from '@/utils/helpers';
import { Badge } from '@/components/ui/Badge';
import { Check, X, Star, Plane, Fuel, Shield, Gift } from 'lucide-react';
 
interface ComparisonTableProps {
  cards: Card[];
}
 
export function ComparisonTable({ cards }: ComparisonTableProps) {
  if (cards.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 py-16 text-center">
        <p className="text-gray-500">Select cards to compare</p>
      </div>
    );
  }
  
  const formatValue = (value: number | null | undefined, suffix: string = '') => {
    if (value === null || value === undefined) return '-';
    return `${value}${suffix}`;
  };
  
  const formatBoolean = (value: boolean | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return value ? (
      <Check className="h-5 w-5 text-green-600" />
    ) : (
      <X className="h-5 w-5 text-red-600" />
    );
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="sticky left-0 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Feature
            </th>
            {cards.map(card => (
              <th
                key={card.id}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-900 min-w-[200px]"
              >
                <div>
                  <p className="font-bold">{card.card_name}</p>
                  <p className="text-xs text-gray-500">{card.bank_name}</p>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          <ComparisonRow label="Card Tier" icon={<Star className="h-4 w-4" />}>
            {cards.map(card => (
              <td key={card.id} className="px-4 py-3">
                <Badge variant="info">{card.card_tier || '-'}</Badge>
              </td>
            ))}
          </ComparisonRow>
          
          <ComparisonRow label="Annual Fee" icon={<span className="text-sm">₹</span>}>
            {cards.map(card => (
              <td key={card.id} className="px-4 py-3 font-medium">
                {formatCurrency(card.annual_fee)}
              </td>
            ))}
          </ComparisonRow>
          
          <ComparisonRow label="Joining Fee" icon={<span className="text-sm">₹</span>}>
            {cards.map(card => (
              <td key={card.id} className="px-4 py-3">
                {formatCurrency(card.joining_fee)}
              </td>
            ))}
          </ComparisonRow>
          
          <ComparisonRow label="Reward Type" icon={<Gift className="h-4 w-4" />}>
            {cards.map(card => (
              <td key={card.id} className="px-4 py-3 capitalize">
                {card.reward_type || '-'}
              </td>
            ))}
          </ComparisonRow>
          
          <ComparisonRow label="Base Reward Rate" icon={<span className="text-sm">%</span>}>
            {cards.map(card => (
              <td key={card.id} className="px-4 py-3">
                {formatValue(card.base_reward_rate, '%')}
              </td>
            ))}
          </ComparisonRow>
          
          <ComparisonRow label="Domestic Lounge" icon={<Plane className="h-4 w-4" />}>
            {cards.map(card => (
              <td key={card.id} className="px-4 py-3">
                {formatValue(card.domestic_lounge_access, ' visits/year')}
              </td>
            ))}
          </ComparisonRow>
          
          <ComparisonRow label="International Lounge" icon={<Plane className="h-4 w-4" />}>
            {cards.map(card => (
              <td key={card.id} className="px-4 py-3">
                {formatValue(card.international_lounge_access, ' visits/year')}
              </td>
            ))}
          </ComparisonRow>
          
          <ComparisonRow label="Fuel Surcharge Waiver" icon={<Fuel className="h-4 w-4" />}>
            {cards.map(card => (
              <td key={card.id} className="px-4 py-3">
                {formatBoolean(card.fuel_surcharge_waiver)}
              </td>
            ))}
          </ComparisonRow>
          
          <ComparisonRow label="Concierge Service" icon={<span className="text-sm">🎯</span>}>
            {cards.map(card => (
              <td key={card.id} className="px-4 py-3">
                {formatBoolean(card.concierge_service)}
              </td>
            ))}
          </ComparisonRow>
          
          <ComparisonRow label="Golf Access" icon={<span className="text-sm">⛳</span>}>
            {cards.map(card => (
              <td key={card.id} className="px-4 py-3">
                {formatValue(card.golf_access, ' rounds/year')}
              </td>
            ))}
          </ComparisonRow>
          
          <ComparisonRow label="Air Accident Insurance" icon={<Shield className="h-4 w-4" />}>
            {cards.map(card => (
              <td key={card.id} className="px-4 py-3">
                {card.air_accident_insurance ? formatCurrency(card.air_accident_insurance) : '-'}
              </td>
            ))}
          </ComparisonRow>
          
          <ComparisonRow label="Min. Monthly Income" icon={<span className="text-sm">💰</span>}>
            {cards.map(card => (
              <td key={card.id} className="px-4 py-3">
                {card.min_income_monthly ? formatCurrency(card.min_income_monthly) : '-'}
              </td>
            ))}
          </ComparisonRow>
          
          <ComparisonRow label="Min. Credit Score" icon={<span className="text-sm">📊</span>}>
            {cards.map(card => (
              <td key={card.id} className="px-4 py-3">
                {formatValue(card.min_credit_score)}
              </td>
            ))}
          </ComparisonRow>
        </tbody>
      </table>
    </div>
  );
}
 
function ComparisonRow({ 
  label, 
  icon, 
  children 
}: { 
  label: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="sticky left-0 bg-white px-4 py-3 text-sm font-medium text-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{icon}</span>
          {label}
        </div>
      </td>
      {children}
    </tr>
  );
}