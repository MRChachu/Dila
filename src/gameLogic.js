// src/gameLogic.js

// 1. ახალი 52-კარტიანი დასტის შექმნა და არევა
function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  let deck = [];
  
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  
  // კარტების არევა შენი ორიგინალური მეთოდით
  return deck.sort(() => Math.random() - 0.5);
}

// 2. კარტის ციფრული მნიშვნელობის მიღება 11-იანი ჯამის დასათვლელად
function getCardValue(rank) {
  if (rank === 'A') return 1;
  if (['J', 'Q', 'K'].includes(rank)) return 0;
  return parseInt(rank);
}

// 3. მოჭრის ვალიდაცია (შენი თამაშის ძირითადი წესები)
function isValidCapture(cardFromHand, cardsFromTable) {
  // 1. ვალეტის (J) წესი: მიაქვს ყველა ციფრი და ტუზი, მაგრამ ვერ მიაქვს მეფე/დამა
  if (cardFromHand.rank === 'J' && cardsFromTable.length > 0) {
    const hasKingOrQueen = cardsFromTable.some(c => ['K', 'Q'].includes(c.rank));
    if (hasKingOrQueen) return false;
    return true;
  }

  // 2. მეფის (K) და დამის (Q) წესი: მიაქვთ მხოლოდ თავისივე რანგის ერთი კარტი
  if (['K', 'Q'].includes(cardFromHand.rank)) {
    return cardsFromTable.length === 1 && cardsFromTable[0].rank === cardFromHand.rank;
  }

  // 3. ციფრული კარტების (2-10) და ტუზის (A) წესი: ჯამი აუცილებლად უნდა იყოს 11!
  const handVal = getCardValue(cardFromHand.rank);
  let tableSum = 0;

  for (let card of cardsFromTable) {
    const val = getCardValue(card.rank);
    if (val === 0) return false; // სურათებიან კარტს (K, Q) ციფრით ვერ შეეხები
    tableSum += val;
  }

  return (handVal + tableSum) === 11;
}

// 4. მაგიდაზე არსებული კარტების ყველა შესაძლო კომბინაციის პოვნა ბოტისთვის
function getAllTableSubsets(table) {
  return table.reduce((subsets, value) => subsets.concat(subsets.map(set => [value, ...set])), [[]]);
}

// 5. ბოტის ინტელექტი: საუკეთესო სვლის შერჩევა (პრიორიტეტი: აგურის 10, ჯვრის 2)
function getBestMove(hand, table) {
  let possibleCaptures = [];

  hand.forEach(handCard => {
    if (handCard.rank === 'J' && table.length > 0) {
      if (isValidCapture(handCard, table)) {
        possibleCaptures.push({ type: 'CAPTURE', cardFromHand: handCard, cardsFromTable: [...table] });
      }
    }

    const subsets = getAllTableSubsets(table);
    subsets.forEach(subset => {
      if (subset.length > 0 && isValidCapture(handCard, subset)) {
        possibleCaptures.push({ type: 'CAPTURE', cardFromHand: handCard, cardsFromTable: subset });
      }
    });
  });

  if (possibleCaptures.length > 0) {
    possibleCaptures.sort((a, b) => {
      const scoreA = a.cardsFromTable.some(c => (c.rank === '10' && c.suit === '♦') || (c.rank === '2' && c.suit === '♣')) ? 2 : 0;
      const scoreB = b.cardsFromTable.some(c => (c.rank === '10' && c.suit === '♦') || (c.rank === '2' && c.suit === '♣')) ? 2 : 0;
      if (scoreA !== scoreB) return scoreB - scoreA;

      if (a.cardsFromTable.length !== b.cardsFromTable.length) {
        return b.cardsFromTable.length - a.cardsFromTable.length;
      }

      const clubsA = a.cardsFromTable.filter(c => c.suit === '♣').length;
      const clubsB = b.cardsFromTable.filter(c => c.suit === '♣').length;
      return clubsB - clubsA;
    });

    return possibleCaptures[0];
  }

  const safeHand = hand.filter(c => c.rank !== 'J');
  const cardToDiscard = safeHand.length > 0 ? safeHand[0] : hand[0];

  return {
    type: 'DISCARD',
    cardFromHand: cardToDiscard,
    cardsFromTable: []
  };
}

// 6. რაუნდის ფინალური ქულების დათვლა (დასტის ბოლომდე დაცლის შემდეგ)
function calculateRoundScores(room) {
  let maxCards = -1;
  let maxCardsPlayers = [];
  let maxClubs = -1;
  let maxClubsPlayers = [];

  room.roundSummary = {
    cardsWinner: 'ფრე (0 ქულა)',
    clubsWinner: 'ფრე (0 ქულა)',
    diamond10Winner: 'არავინ (0 ქულა)',
    club2Winner: 'არავინ (0 ქულა)',
    gainedPoints: {} 
  };

  room.players.forEach(p => {
    room.roundSummary.gainedPoints[p.id] = 0;
  });

  room.players.forEach(player => {
    const cardCount = player.captured.length;
    const clubCount = player.captured.filter(c => c.suit === '♣').length;
    
    const hasDiamond10 = player.captured.some(c => c.rank === '10' && c.suit === '♦');
    const hasClub2 = player.captured.some(c => c.rank === '2' && c.suit === '♣');

    if (hasDiamond10) {
      player.totalScore += 1;
      room.roundSummary.diamond10Winner = `${player.name} (+1 ქ)`;
      room.roundSummary.gainedPoints[player.id] += 1;
    }
    if (hasClub2) {
      player.totalScore += 1;
      room.roundSummary.club2Winner = `${player.name} (+1 ქ)`;
      room.roundSummary.gainedPoints[player.id] += 1;
    }

    if (cardCount > maxCards) {
      maxCards = cardCount;
      maxCardsPlayers = [player];
    } else if (cardCount === maxCards) {
      maxCardsPlayers.push(player);
    }

    if (clubCount > maxClubs) {
      maxClubs = clubCount;
      maxClubsPlayers = [player];
    } else if (clubCount === maxClubs) {
      maxClubsPlayers.push(player);
    }
  });

  if (maxCardsPlayers.length === 1) {
    maxCardsPlayers[0].totalScore += 2;
    room.roundSummary.cardsWinner = `${maxCardsPlayers[0].name} (${maxCards} კარტი) (+2 ქ)`;
    room.roundSummary.gainedPoints[maxCardsPlayers[0].id] += 2;
  }
  if (maxClubsPlayers.length === 1) {
    maxClubsPlayers[0].totalScore += 1;
    room.roundSummary.clubsWinner = `${maxClubsPlayers[0].name} (${maxClubs} ჯვარი) (+1 ქ)`;
    room.roundSummary.gainedPoints[maxClubsPlayers[0].id] += 1;
  }
}

// 📦 ექსპორტი სერვერისთვის (არანაირი გარე require ფაილის შიგნით!)
module.exports = {
  createDeck,
  isValidCapture,
  calculateRoundScores,
  getBestMove
};