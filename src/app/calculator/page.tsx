"use client";

import { useState, useEffect, useMemo } from 'react';
import { calculateLoyaltyResults, getRecommendedCards, Card, Flight } from '@/utils/calculatorLogic';

export default function CalculatorDashboard() {
  const [route, setRoute] = useState({ origin: '', dest: '', flightClass: 'Economy' });
  const [flights, setFlights] = useState<Flight[]>([]);
  
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);

  useEffect(() => {
    async function fetchCards() {
      const res = await fetch('/api/cards'); 
      const json = await res.json();
      if (json.success) setAllCards(json.data);
    }
    fetchCards();
  }, []);

  // BUG 1 FIX: Accept flightClass and filter the API payload
  const handleSearchFlight = async (origin: string, dest: string, flightClass: string) => {
    setRoute({ origin, dest, flightClass });
    setIsLoadingFlights(true);
    
    const res = await fetch(`/api/update-data?origin=${origin}&dest=${dest}`);
    const json = await res.json();
    
    if (json.success) {
      // Filter out Business/First if the user selected Economy
      const filteredFlights = json.data.filter((f: Flight) => 
        f.flight_class.toLowerCase() === flightClass.toLowerCase()
      );
      setFlights(filteredFlights);
    }
    setIsLoadingFlights(false);
  };

  const selectedCards = useMemo(() => 
    allCards.filter(c => selectedCardIds.includes(c.id)), 
  [allCards, selectedCardIds]);

  const loyaltyResults = useMemo(() => 
    calculateLoyaltyResults(flights, selectedCards), 
  [flights, selectedCards]);

  const recommendedCards = useMemo(() => 
    getRecommendedCards(flights, allCards, selectedCards), 
  [flights, allCards, selectedCards]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      
      {/* BUG 2 FIX: The Disclaimer Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-800">
              <strong className="font-bold">Disclaimer:</strong> The points and taxes displayed are estimates based on standard award charts. Actual values may vary dynamically based on dates, availability, and airline pricing changes. Always verify on the official airline website before transferring your bank points.
            </p>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-4">Award Flight Calculator</h1>

      {/* SECTION 1: SEARCH FLIGHT ROUTE */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">1. Search Flight Route</h2>
        <div className="flex gap-4">
          <input type="text" placeholder="Origin (e.g. DEL)" id="originInput" className="border p-2 rounded" />
          <input type="text" placeholder="Dest (e.g. LHR)" id="destInput" className="border p-2 rounded" />
          
          {/* BUG 1 FIX: The Dropdown */}
          <select id="flightClassInput" className="border p-2 rounded bg-white">
            <option value="Economy">Economy</option>
            <option value="Premium Economy">Premium Economy</option>
            <option value="Business">Business</option>
            <option value="First">First</option>
          </select>

          <button 
            className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition"
            onClick={() => handleSearchFlight(
              (document.getElementById('originInput') as HTMLInputElement).value,
              (document.getElementById('destInput') as HTMLInputElement).value,
              (document.getElementById('flightClassInput') as HTMLSelectElement).value
            )}
          >
            {isLoadingFlights ? 'Searching...' : 'Search'}
          </button>
        </div>
      </section>

      {/* SECTION 2: SELECT YOUR CARDS */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">2. Select Your Cards</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allCards.map(card => (
            <label key={card.id} className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
              <input 
                type="checkbox" 
                checked={selectedCardIds.includes(card.id)}
                onChange={(e) => {
                  if (e.target.checked) setSelectedCardIds(prev => [...prev, card.id]);
                  else setSelectedCardIds(prev => prev.filter(id => id !== card.id));
                }}
              />
              <span className="text-sm font-medium">{card.card_name}</span>
            </label>
          ))}
        </div>
      </section>

      {/* SECTION 3: LOYALTY PROGRAM RESULTS */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">3. Loyalty Program Results</h2>
        {flights.length === 0 && <p className="text-gray-500">Search a route to see requirements.</p>}
        
        <div className="space-y-6">
          {loyaltyResults.map((flight, idx) => (
            <div key={idx} className="border-b pb-4">
              <h3 className="font-bold text-lg">{flight.flight_class} via {flight.partner} ({flight.displayProgram})</h3>
              <p className="text-gray-600 mb-2">Requires: {flight.points} Miles + {flight.taxes} in Taxes</p>
              
              {flight.transferableCards.length > 0 ? (
                <div className="bg-green-50 p-4 rounded text-green-900 text-sm">
                  <p className="font-semibold mb-1">Cards you own that can book this:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {flight.transferableCards.map((c: any, i: number) => (
                      <li key={i}>
                        {c.cardName}: You need <strong>{c.ccPointsNeeded}</strong> reward points 
                        <span className="text-green-700/70 text-xs ml-1">(Ratio {c.ratioText})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded text-red-900 text-sm">
                  None of your selected cards can transfer to {flight.displayProgram}.
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: RECOMMENDED CARDS */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">4. Recommended Cards for Your Selection</h2>
        {recommendedCards.length === 0 ? (
          <p className="text-gray-500">Search a route to see our algorithmic recommendations.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedCards.map(card => (
              <div key={card.id} className="border border-blue-200 bg-blue-50 p-4 rounded-xl relative">
                <span className="absolute -top-3 right-4 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                  Top Match
                </span>
                <h3 className="font-bold text-blue-900 mb-2">{card.card_name}</h3>
                <p className="text-sm text-blue-800 mb-1">Matches {card.matchScore} needed loyalty programs!</p>
              </div>
            ))}
          </div>
        )}
      </section>
      
    </div>
  );
}