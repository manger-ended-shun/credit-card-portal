export interface Card {
  id: string;
  card_name: string;
  transfer_partners: string | null;
  miles_conversion_ratio: number | null;
  base_reward_rate: string | null;
  annual_fee: number | null;
}

export interface Flight {
  origin: string;
  dest: string;
  flight_class: string;
  partner: string; 
  program: string; 
  points: string;  
  taxes: string;   
}

// ==========================================
// SECTION 3 LOGIC: Match user's cards to flights
// ==========================================
export function calculateLoyaltyResults(flights: Flight[], selectedCards: Card[]) {
  return flights.map(flight => {
    const numericPointsRequired = parseInt(flight.points.replace(/,/g, ''), 10);
    
    // BUG 3 FIX: Seamlessly rename the old Air India program
    const displayProgram = flight.program.match(/flying returns/i) 
      ? 'Maharaja Club' 
      : flight.program;

    // Find which of the user's selected cards can transfer here
    const validCards = selectedCards.map(card => {
      const tp = card.transfer_partners?.toLowerCase() || '';
      const supportsPartner = tp.includes(flight.partner.toLowerCase()) || tp.includes(flight.program.toLowerCase());
      
      if (!supportsPartner) return null;

      // BUG 4 FIX: Smart Transfer Ratio Parser
      // It looks for patterns like "(5:4)" or "(2:1)" specifically next to the airline name in the AI's text
      let bankPointsNeeded = 0;
      let parsedRatioText = "1:1";
      let foundRatio = false;

      if (tp) {
        // Split by the "|" delimiter the AI used
        const segments = tp.split('|');
        for (const segment of segments) {
          if (segment.includes(flight.partner.toLowerCase()) || segment.includes(flight.program.toLowerCase())) {
            // Regex to grab the numbers inside the parentheses e.g. (5:4)
            const ratioMatch = segment.match(/\(\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*\)/);
            
            if (ratioMatch) {
              const bankPoints = parseFloat(ratioMatch[1]);
              const airlineMiles = parseFloat(ratioMatch[2]);
              
              // Precise Math: (Flight Miles * Bank Points) / Airline Miles
              bankPointsNeeded = Math.ceil(numericPointsRequired * (bankPoints / airlineMiles));
              parsedRatioText = `${bankPoints}:${airlineMiles}`;
              foundRatio = true;
              break;
            }
          }
        }
      }

      // Safety Fallback if the AI text didn't contain explicit parentheses 
      if (!foundRatio) {
        const fallbackRatio = card.miles_conversion_ratio || 1; 
        bankPointsNeeded = Math.ceil(numericPointsRequired / fallbackRatio);
      }

      return {
        cardName: card.card_name,
        ratioText: parsedRatioText,
        ccPointsNeeded: bankPointsNeeded.toLocaleString('en-IN')
      };
    }).filter(Boolean); 

    return {
      ...flight,
      displayProgram,
      numericPointsRequired,
      transferableCards: validCards
    };
  });
}

// ==========================================
// SECTION 4 LOGIC: Recommend best new cards
// ==========================================
export function getRecommendedCards(flights: Flight[], allCards: Card[], selectedCards: Card[]) {
  const requiredPrograms = Array.from(new Set(flights.map(f => f.program.toLowerCase())));
  const selectedCardNames = selectedCards.map(c => c.card_name);
  const availableCards = allCards.filter(c => !selectedCardNames.includes(c.card_name));

  const recommendations = availableCards.map(card => {
    let matchScore = 0;
    requiredPrograms.forEach(program => {
      if (card.transfer_partners?.toLowerCase().includes(program)) {
        matchScore++;
      }
    });
    return { ...card, matchScore };
  });

  return recommendations
    .filter(c => c.matchScore > 0)
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return (b.miles_conversion_ratio || 0) - (a.miles_conversion_ratio || 0);
    })
    .slice(0, 3);
}