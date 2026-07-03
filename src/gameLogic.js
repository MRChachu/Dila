const SUITS = ['♥', '♦', '♣', '♠'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// 1. კალოდის შექმნა და აჩეჩვა
function createDeck() {
  let deck = [];
  for (let suit of SUITS) {
    for (let rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  // Fisher-Yates ალგორითმით რენდომად აჩეჩვა
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// 2. კარტის ციფრული მნიშვნელობის დადგენა (ჯამების დასათვლელად)
function getCardValue(rank) {
  if (rank === 'A') return 1; // ტუზი = 1
  if (['J', 'Q', 'K'].includes(rank)) return 0; // ფიგურებს ჯამი არ აქვთ, ერთმანეთს მიაქვთ
  return parseInt(rank);
}

// 3. წაყვანის (მოჭრის) სისწორის შემოწმება
function isValidCapture(cardFromHand, cardsFromTable) {
  // 🟢 ვალეტის მთავარი წესი: ვალეტს (J) მიაქვს აბსოლუტურად ყველაფერი!
  if (cardFromHand.rank === 'J') return true;

  // თუ მხოლოდ 1 კარტი მიაქვს, რანკი ზუსტად უნდა ემთხვეოდეს (მაგ: Q-ს მიაქვს Q, 7-ს მიაქვს 7)
  if (cardsFromTable.length === 1) {
    return cardFromHand.rank === cardsFromTable[0].rank;
  }

  // თუ რამდენიმე კარტი მიაქვს ერთდროულად:
  const handValue = getCardValue(cardFromHand.rank);
  
  if (handValue === 0) {
      // Q და K ფიგურებს არ შეუძლიათ სხვადასხვა კარტების ჯამით წაღება
      // მათ შეუძლიათ წაიღონ მხოლოდ თავისივე ფიგურები (მაგალითად ერთ K-ს მიაქვს ორი K)
      const allMatch = cardsFromTable.every(c => c.rank === cardFromHand.rank);
      return allMatch;
  }

  // თუ ციფრული კარტია (მაგ: 9), ვამოწმებთ მაგიდაზე მონიშნული კარტების ჯამს
  const tableSum = cardsFromTable.reduce((sum, c) => sum + getCardValue(c.rank), 0);
  
  // თუ ჯამი ზუსტად ემთხვევა, ვატანთ
  if (tableSum === handValue) return true;

  // თუ მონიშნული კარტები იდენტურია (მაგ: ხელში გვიჭირავს 8 და მიგვაქვს ორი 8-იანი მაგიდიდან)
  const allSameAsHand = cardsFromTable.every(c => c.rank === cardFromHand.rank);
  if (allSameAsHand) return true;

  return false;
}

// 4. რაუნდის ბოლოს 4-ვე ქულის განაწილება
function calculateRoundScores(room) {
  const stats = room.players.map(p => {
    let clubsCount = 0;
    let has10Diamond = false;
    let has2Club = false;

    p.captured.forEach(c => {
      if (c.suit === '♣') clubsCount++;
      if (c.rank === '10' && c.suit === '♦') has10Diamond = true;
      if (c.rank === '2' && c.suit === '♣') has2Club = true;
    });

    return {
      id: p.id,
      name: p.name,
      cardsCount: p.captured.length,
      clubsCount,
      has10Diamond,
      has2Club,
      playerRef: p
    };
  });

  // ვინ აიღო მეტი კარტი?
  let maxCards = -1;
  let cardsWinner = null;
  stats.forEach(s => {
    if (s.cardsCount > maxCards) { maxCards = s.cardsCount; cardsWinner = s; }
    else if (s.cardsCount === maxCards) { cardsWinner = null; /* ყაიმის დროს ქულა არავის ეწერება */ }
  });

  // ვინ აიღო მეტი ჯვარი?
  let maxClubs = -1;
  let clubsWinner = null;
  stats.forEach(s => {
    if (s.clubsCount > maxClubs) { maxClubs = s.clubsCount; clubsWinner = s; }
    else if (s.clubsCount === maxClubs) { clubsWinner = null; }
  });

  // რეალური ქულების მიმატება მოთამაშეებისთვის
  if (cardsWinner) cardsWinner.playerRef.totalScore += 1;
  if (clubsWinner) clubsWinner.playerRef.totalScore += 1;
  
  let diamond10WinnerName = "-";
  let club2WinnerName = "-";

  stats.forEach(s => {
    if (s.has10Diamond) { s.playerRef.totalScore += 1; diamond10WinnerName = s.name; }
    if (s.has2Club) { s.playerRef.totalScore += 1; club2WinnerName = s.name; }
  });

  // ვაგზავნით შედეგებს ვიზუალში (მოდალისთვის)
  room.roundSummary = {
    cardsWinner: cardsWinner ? cardsWinner.name : "ყაიმი (არავინ)",
    clubsWinner: clubsWinner ? clubsWinner.name : "ყაიმი (არავინ)",
    diamond10Winner: diamond10WinnerName,
    club2Winner: club2WinnerName,
    matchWinner: null 
  };
}

// 5. ბოტის ლოგიკა (ჭკვიანი სვლები)
function getBestMove(botCards, tableCards) {
  if (!botCards || botCards.length === 0) return null;

  for (let handCard of botCards) {
    // 🟢 თუ ბოტს J უჭირავს და მაგიდაზე რამე დევს, მაშინვე ხვეტავს ყველაფერს!
    if (handCard.rank === 'J' && tableCards.length > 0) {
      return { type: 'CAPTURE', cardFromHand: handCard, cardsFromTable: [...tableCards] };
    }

    // ვამოწმებთ სხვა კარტებით 1-1-ზე წაღებას
    for (let tCard of tableCards) {
      if (isValidCapture(handCard, [tCard])) {
        return { type: 'CAPTURE', cardFromHand: handCard, cardsFromTable: [tCard] };
      }
    }
  }

  // თუ ვერაფერს ვჭრით, ვაგდებთ პირველივე კარტს (მომავალში აქ შეგვიძლია უფრო ჭკვიანი გადმოგდებაც დავუწეროთ)
  const cardToDiscard = botCards[0]; 
  return { type: 'DISCARD', cardFromHand: cardToDiscard, cardsFromTable: [] };
}

module.exports = { createDeck, isValidCapture, calculateRoundScores, getBestMove };