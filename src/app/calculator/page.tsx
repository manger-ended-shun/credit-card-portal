'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';

// --- SUPABASE CONFIG ---
const supabaseUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL || '' : '';
const supabaseAnonKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' : '';

// --- TYPESCRIPT INTERFACES ---
interface Tag {
  text: string;
  color: 'green' | 'blue' | 'amber';
}

interface Flight {
  id?: string;
  origin: string;
  dest: string;
  flight_class: string;
  partner: string;
  program: string;
  ratio: string;
  points: string;
  taxes: string;
  tags?: Tag[] | null;
  description: string; // Updated from desc to match database
}

interface Card {
  id: string;
  bank: string;
  name: string;
  desc: string;
  benefits: string[] | null;
  fee: string;
  base_earn: number;
  travel_boost: boolean;
  online_boost: boolean;
}

interface CalculatedCard extends Card {
  score: number;
  calcAnnPts: string;
  calcMonPts: string;
}

export default function AwardCalculator() {
  // --- DATABASE STATE ---
  const [liveCardDB, setLiveCardDB] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchingFlights, setIsSearchingFlights] = useState(false);

  // --- USER INPUT STATE ---
  const [source, setSource] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [seatClass, setSeatClass] = useState<string>('Economy');

  const [monthlySpend, setMonthlySpend] = useState<string>('50000');
  const [annualSpend, setAnnualSpend] = useState<string>('600000');
  const [spendCategory, setSpendCategory] = useState<string>('Travel & Hotels');
  const [currentCards, setCurrentCards] = useState<string[]>([]);

  // --- RESULTS STATE ---
  const [flightResults, setFlightResults] = useState<Flight[]>([]);
  const [recommendedCards, setRecommendedCards] = useState<CalculatedCard[]>([]);

  // --- FETCH INITIAL CARD DATA ---
  useEffect(() => {
    async function fetchCards() {
      if (!supabaseUrl || !supabaseAnonKey) return;
      setIsLoading(true);
      try {
        const headers = {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        };

        const cardRes = await fetch(`${supabaseUrl}/rest/v1/credit_cards?select=*`, { headers });

        if (cardRes.ok) {
          const cards: Card[] = await cardRes.json();
          setLiveCardDB(cards);
          if (cards.length > 0) setCurrentCards([cards[0].name]);
        }
      } catch (error) {
        console.error('Error fetching card data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCards();
  }, []);

  // --- SEARCH ROUTES ---
  const handleSearchRoute = async () => {
    if (!source || !destination) return;

    setIsSearchingFlights(true);
    setFlightResults([]);

    try {
      // Direct call to API without the date logic
      const res = await fetch(
        `/api/update-data?origin=${source}&dest=${destination}`
      );
      const json = await res.json();

      if (json.success && json.data) {
        const exactMatches = json.data.filter((f: Flight) =>
          f.flight_class.toLowerCase().includes(seatClass.toLowerCase())
        );

        setFlightResults(exactMatches.length > 0 ? exactMatches : json.data);
      }
    } catch (error) {
      console.error('Failed to fetch route data:', error);
    } finally {
      setIsSearchingFlights(false);
    }
  };

  // --- CALCULATE CARD POINTS ---
  useEffect(() => {
    if (liveCardDB.length === 0) return;

    const annualVal = parseInt(annualSpend) || 0;

    let scoredCards: CalculatedCard[] = liveCardDB.map((card) => {
      let score = 0;
      let effectiveEarnRate = Number(card.base_earn) || 0;

      if (spendCategory === 'Online Shopping' && card.online_boost) {
        score += 50;
        effectiveEarnRate = 0.05;
      } else if (spendCategory === 'Travel & Hotels' && card.travel_boost) {
        score += 30;
      }

      const calculatedAnnualPts = Math.round(annualVal * effectiveEarnRate);
      const calculatedMonthlyPts = Math.round(calculatedAnnualPts / 12);

      score += calculatedAnnualPts / 1000;

      return {
        ...card,
        score,
        calcAnnPts: calculatedAnnualPts.toLocaleString(),
        calcMonPts: calculatedMonthlyPts.toLocaleString(),
      };
    });

    scoredCards.sort((a, b) => b.score - a.score);
    setRecommendedCards(scoredCards.slice(0, 3));
  }, [annualSpend, spendCategory, liveCardDB]);

  // --- HANDLERS ---
  const handleMonthlyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMonthlySpend(val);
    if (val) setAnnualSpend((parseInt(val) * 12).toString());
    else setAnnualSpend('');
  };

  const handleAnnualChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAnnualSpend(val);
    if (val) setMonthlySpend(Math.round(parseInt(val) / 12).toString());
    else setMonthlySpend('');
  };

  const handleCardChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) selected.push(options[i].value);
    }
    setCurrentCards(selected);
  };

  const removeCard = (cardToRemove: string) => {
    setCurrentCards(currentCards.filter((c) => c !== cardToRemove));
  };

  const getBadgeColors = (colorStr: string): string => {
    switch (colorStr) {
      case 'green': return 'border-green-300 bg-green-50 text-green-700';
      case 'amber': return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'blue':
      default: return 'border-blue-200 bg-blue-50 text-blue-700';
    }
  };

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="w-full flex items-center justify-center p-4 py-20 text-slate-800 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-200 text-center max-w-lg w-full">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Supabase Keys Missing</h2>
          <p className="text-slate-500 mb-6">
            Please add your Supabase URL and Anon Key to your <code>.env.local</code> file to
            connect the live database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-8 text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Breadcrumb */}
        <nav className="flex text-sm text-slate-500 font-medium mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/" className="inline-flex items-center hover:text-blue-600 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Home
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-slate-700 md:ml-2">Points Calculator</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="text-center mb-10 flex flex-col items-center pt-2">
          <h1 className="text-4xl font-normal text-slate-900 mb-3 tracking-tight">
            Fly smarter with points
          </h1>
          <p className="text-slate-500 text-sm">
            Discover how many points you need, which program to use, and which card earns the most.
          </p>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-blue-500 animate-pulse">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-medium">Connecting to secure database...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* SECTION 1: Search Route */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <h2 className="text-lg font-medium text-slate-800">Search Flight Route</h2>
                <div className="flex-grow border-t border-slate-100 ml-4" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
                <div className="bg-white p-5 flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Origin Airport
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value.toUpperCase())}
                    placeholder="e.g. DEL"
                    className="w-full border-none bg-slate-50 rounded-lg p-3 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="bg-white p-5 flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Destination Airport
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value.toUpperCase())}
                    placeholder="e.g. LHR"
                    className="w-full border-none bg-slate-50 rounded-lg p-3 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="bg-white p-5 flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Seat Class
                  </label>
                  <select
                    value={seatClass}
                    onChange={(e) => setSeatClass(e.target.value)}
                    className="w-full border-none bg-slate-50 rounded-lg p-3 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Premium Economy">Premium Economy</option>
                    <option value="Business">Business</option>
                    <option value="First">First Class</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSearchRoute}
                  disabled={isSearchingFlights || !source || !destination}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSearchingFlights ? 'Searching...' : 'Search Flights'}
                </button>
              </div>
            </section>

            {/* SECTION 2: Flight Results */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <h2 className="text-lg font-medium text-slate-800">Loyalty program results</h2>
              </div>

              <div className="space-y-4">
                {flightResults.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 rounded-xl text-slate-500 border border-slate-200">
                    {source && destination
                      ? "Hit 'Search Flights' to find or generate the best routes for your trip."
                      : 'Enter an origin and destination above to see available reward flights.'}
                  </div>
                ) : (
                  flightResults.map((flight, idx) => (
                    <div
                      key={flight.id || idx}
                      className={`${
                        idx === 0
                          ? 'bg-blue-50/50 border-blue-200'
                          : 'bg-white border-slate-200'
                      } border rounded-xl p-6 transition-all hover:shadow-md`}
                    >
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {flight.partner}{' '}
                          <span className="text-sm font-normal text-slate-500 ml-2">
                            ({flight.flight_class})
                          </span>
                        </h3>
                        {flight.tags &&
                          flight.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className={`px-3 py-1 rounded-full border text-xs font-medium ${getBadgeColors(
                                tag.color
                              )}`}
                            >
                              {tag.text}
                            </span>
                          ))}
                      </div>
                      {/* Updated rendering to match new database structure */}
                      <p className="text-sm text-slate-500 mb-5">{flight.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Loyalty program', value: flight.program, color: 'text-slate-800' },
                          { label: 'Transfer ratio', value: flight.ratio, color: 'text-blue-600' },
                          { label: 'Points needed', value: flight.points, color: 'text-slate-800' },
                          { label: 'Est. taxes', value: flight.taxes, color: 'text-green-600' },
                        ].map(({ label, value, color }) => (
                          <div
                            key={label}
                            className={`${
                              idx === 0 ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'
                            } border rounded-lg p-4`}
                          >
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                              {label}
                            </div>
                            <div className={`text-sm font-medium ${color}`}>{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* SECTION 3: Spending Profile */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <h2 className="text-lg font-medium text-slate-800">Your spending profile</h2>
                <div className="flex-grow border-t border-slate-100 ml-4" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
                <div className="bg-white p-5 flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Monthly Spend
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input
                      type="number"
                      value={monthlySpend}
                      onChange={handleMonthlyChange}
                      className="w-full border-none bg-slate-50 rounded-lg p-3 pl-8 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-white p-5 flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Spend Category
                  </label>
                  <select
                    value={spendCategory}
                    onChange={(e) => setSpendCategory(e.target.value)}
                    className="w-full border-none bg-slate-50 rounded-lg p-3 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="Travel & Hotels">Travel & Hotels</option>
                    <option value="General Spend">General Spend</option>
                    <option value="Online Shopping">Online Shopping</option>
                  </select>
                </div>

                <div className="bg-white p-5 flex flex-col md:row-span-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Current Cards (Select All You Own)
                  </label>
                  <select
                    multiple
                    value={currentCards}
                    onChange={handleCardChange}
                    className="w-full border-none bg-slate-50 rounded-lg p-3 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none h-32 mb-3"
                  >
                    {liveCardDB.map((card) => (
                      <option key={card.id || card.name} value={card.name} className="py-1">
                        {card.name} ({card.bank})
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {currentCards.map((card) => (
                      <div
                        key={card}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-200"
                      >
                        {card}
                        <button
                          onClick={() => removeCard(card)}
                          className="hover:bg-blue-200 rounded-full p-0.5 ml-1 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Annual Spend
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input
                      type="number"
                      value={annualSpend}
                      onChange={handleAnnualChange}
                      className="w-full border-none bg-slate-50 rounded-lg p-3 pl-8 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-white p-5 flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Annual Spend Category
                  </label>
                  <select
                    value={spendCategory}
                    onChange={(e) => setSpendCategory(e.target.value)}
                    className="w-full border-none bg-slate-50 rounded-lg p-3 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="Travel & Hotels">Travel & Hotels</option>
                    <option value="General Spend">General Spend</option>
                    <option value="Online Shopping">Online Shopping</option>
                  </select>
                </div>
              </div>
            </section>

            {/* SECTION 4: Recommended Cards */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                  4
                </div>
                <h2 className="text-lg font-medium text-slate-800">Recommended cards</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {recommendedCards.length === 0 ? (
                  <div className="col-span-3 text-center p-8 bg-slate-50 rounded-xl text-slate-500 border border-slate-200">
                    No credit cards found in your database. Add some to get recommendations!
                  </div>
                ) : (
                  recommendedCards.map((card, idx) => (
                    <div
                      key={card.id || idx}
                      className={`border rounded-xl p-6 flex flex-col relative overflow-hidden ${
                        idx === 0 ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white'
                      }`}
                    >
                      {idx === 0 && (
                        <div className="absolute top-0 right-0 w-full h-1 bg-blue-500" />
                      )}

                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                          {card.bank}
                        </span>
                        {idx === 0 && (
                          <span className="px-2.5 py-0.5 rounded-full border border-blue-300 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                            Top pick
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight">
                        {card.name}
                      </h3>
                      <p className="text-sm text-slate-600 mb-5 flex-grow">{card.desc}</p>

                      <div className="mb-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                          Key Benefits
                        </p>
                        <ul className="space-y-2 text-xs text-slate-600">
                          {card.benefits &&
                            card.benefits.map((benefit, bIdx) => (
                              <li key={bIdx} className="flex gap-2 items-start">
                                <span className="text-blue-500">✦</span> {benefit}
                              </li>
                            ))}
                        </ul>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6 mt-auto">
                        <div
                          className={`border rounded-lg p-3 text-center ${
                            idx === 0
                              ? 'border-blue-100 bg-white'
                              : 'border-slate-100 bg-slate-50'
                          }`}
                        >
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                            Monthly pts
                          </div>
                          <div className="text-sm font-bold text-blue-600">{card.calcMonPts}</div>
                        </div>
                        <div
                          className={`border rounded-lg p-3 text-center ${
                            idx === 0
                              ? 'border-blue-100 bg-white'
                              : 'border-slate-100 bg-slate-50'
                          }`}
                        >
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                            Annual pts
                          </div>
                          <div className="text-sm font-bold text-blue-600">{card.calcAnnPts}</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Annual fee</span>
                        <span className="font-semibold text-slate-800">{card.fee}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        <div className="text-center py-6 text-[11px] text-slate-400 uppercase tracking-widest">
          <span>🔒</span> Data pulled live from secure backend · No personal data stored
        </div>
      </div>
    </div>
  );
}