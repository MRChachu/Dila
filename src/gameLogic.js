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
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// 2. კარტის ციფრული მნიშვნელობა (A = 1, ფიგურები = 0)
function getCardValue(rank) {
  if (rank === 'A') return 1; 
  if (['J', 'Q', 'K'].includes(rank)) return 0; 
  return parseInt(rank);
}

// 3. წაყვანის (მოჭრის) სისწორის შემოწმება (ნამდვილი ფურთის წესები)
function isValidCapture(cardFromHand, cardsFromTable) {
  if (cardsFromTable.length === 0) return false;
  
  // 🟢 ვალეტის ლოგიკა: 1 დამას და 1 კაროლს ვერ იღებს, დანარჩენი მიაქვს
  if (cardFromHand.rank === 'J') {
    const qCount = cardsFromTable.filter(c => c.rank === 'Q').length;
    const kCount = cardsFromTable.filter(c => c.rank === 'K').length;
    if (qCount === 1) return false; 
    if (kCount === 1) return false; 
    return true; 
  }

  const handValue = getCardValue(cardFromHand.rank);

  // 🟢 ფიგურების ლოგიკა: მიაქვს მხოლოდ ზუსტად იგივე ფიგურა (K -> K, Q -> Q)
  if (handValue === 0) {
    return cardsFromTable.every(c => c.rank === cardFromHand.rank);
  }

  // 🟢 ციფრებისა და ტუზის ლოგიკა: ხელის კარტი + მაგიდის კარტები უნდა იყოს 11
  const targetSum = 11 - handValue; // რისი მოგროვებაც გვჭირდება მაგიდიდან
  let values = cardsFromTable.map(c => getCardValue(c.rank));
  
  // არცერთი შერჩეული კარტი არ უნდა იყოს ფიგურა ან სამიზნეზე დიდი
  if (values.some(v => v === 0 || v > targetSum)) return false;

  // ვამოწმებთ, იყოფა თუ არა მონიშნული კარტები ზუსტ "11-ის შემავსებელ" ჯგუფებად
  function canPartition(arr) {
    if (arr.length === 0) return true;
    
    function findSubset(currentSubsetIndices, currentSum, index) {
      if (currentSum === targetSum) {
        let remaining = arr.filter((_, i) => !currentSubsetIndices.includes(i));
        return canPartition(remaining);
      }
      if (currentSum > targetSum || index >= arr.length) return false;

      if (findSubset([...currentSubsetIndices, index], currentSum + arr[index], index + 1)) {
        return true;
      }
      return findSubset(currentSubsetIndices, currentSum, index + 1);
    }

    return findSubset([], 0, 0);
  }

  return canPartition(values);
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

  let maxCards = -1; let cardsWinner = null;
  stats.forEach(s => {
    if (s.cardsCount > maxCards) { maxCards = s.cardsCount; cardsWinner = s; }
    else if (s.cardsCount === maxCards) { cardsWinner = null; }
  });

  let maxClubs = -1; let clubsWinner = null;
  stats.forEach(s => {
    if (s.clubsCount > maxClubs) { maxClubs = s.clubsCount; clubsWinner = s; }
    else if (s.clubsCount === maxClubs) { clubsWinner = null; }
  });

  if (cardsWinner) cardsWinner.playerRef.totalScore += 1;
  if (clubsWinner) clubsWinner.playerRef.totalScore += 1;
  
  let diamond10WinnerName = "-";
  let club2WinnerName = "-";

  stats.forEach(s => {
    if (s.has10Diamond) { s.playerRef.totalScore += 1; diamond10WinnerName = s.name; }
    if (s.has2Club) { s.playerRef.totalScore += 1; club2WinnerName = s.name; }
  });

  room.roundSummary = {
    cardsWinner: cardsWinner ? cardsWinner.name : "ყაიმი",
    clubsWinner: clubsWinner ? clubsWinner.name : "ყაიმი",
    diamond10Winner: diamond10WinnerName,
    club2Winner: club2WinnerName,
    matchWinner: null 
  };
}

// 5. ბოტის გაძლიერებული ლოგიკა (Smart AI - ითვლის 11-ებს)
function getBestMove(botCards, tableCards) {
  if (!botCards || botCards.length === 0) return null;

  let bestMove = null;
  let bestScore = -1;

  for (let handCard of botCards) {
     // ვალეტის განხილვა
     if (handCard.rank === 'J') {
        let cardsToTake = tableCards.filter(c => getCardValue(c.rank) > 0);
        let qCount = tableCards.filter(c => c.rank === 'Q').length;
        if (qCount >= 2) cardsToTake.push(...tableCards.filter(c => c.rank === 'Q'));
        let kCount = tableCards.filter(c => c.rank === 'K').length;
        if (kCount >= 2) cardsToTake.push(...tableCards.filter(c => c.rank === 'K'));
        
        if (cardsToTake.length > 0) {
            let score = evaluateCapture(cardsToTake) + 1000; // ვალეტით ბევრის წაღება პრიორიტეტია
            if (score > bestScore) {
                bestScore = score;
                bestMove = { type: 'CAPTURE', cardFromHand: handCard, cardsFromTable: cardsToTake };
            }
        }
        continue;
     }

     // ფიგურების განხილვა
     if (handCard.rank === 'Q' || handCard.rank === 'K') {
        let matching = tableCards.filter(c => c.rank === handCard.rank);
        if (matching.length > 0) {
            let score = evaluateCapture(matching);
            if (score > bestScore) {
                bestScore = score;
                bestMove = { type: 'CAPTURE', cardFromHand: handCard, cardsFromTable: matching };
            }
        }
        continue;
     }

     // რიცხვები: პოულობს მაგიდაზე 11-ის შემავსებელ ყველა შესაძლო კომბინაციას
     const handValue = getCardValue(handCard.rank);
     const target = 11 - handValue;
     
     // ამოვარჩევთ მხოლოდ ციფრებს და ტუზებს მაგიდიდან
     let validTableCards = tableCards.filter(c => getCardValue(c.rank) > 0);
     let validCaptures = findAllValidPartitions(validTableCards, target);
     
     for (let capture of validCaptures) {
         let score = evaluateCapture(capture);
         if (score > bestScore) {
             bestScore = score;
             bestMove = { type: 'CAPTURE', cardFromHand: handCard, cardsFromTable: capture };
         }
     }
  }

  if (bestMove) return bestMove;

  // თუ ვერაფერს ჭრის, ინახავს ძვირფას კარტებს (10♦, 2♣, J, A) და აგდებს უსარგებლოს
  let discardCard = botCards[0];
  let minVal = 9999;
  for (let c of botCards) {
      let val = evaluateDiscardValue(c);
      if (val < minVal) {
          minVal = val;
          discardCard = c;
      }
  }

  return { type: 'DISCARD', cardFromHand: discardCard, cardsFromTable: [] };
}

// აფასებს წაღებული კარტების ღირებულებას (ბოტისთვის)
function evaluateCapture(cards) {
    let score = 0;
    for (let c of cards) {
        if (c.rank === '10' && c.suit === '♦') score += 1000;
        else if (c.rank === '2' && c.suit === '♣') score += 500;
        else if (c.suit === '♣') score += 50;
        else score += 10; // თითო კარტს 10 ქულას ანიჭებს, რომ ბევრი კარტი წაიღოს
    }
    return score;
}

// აფასებს, რომელი კარტი გაიმეტოს გადასაყრელად
function evaluateDiscardValue(c) {
    if (c.rank === '10' && c.suit === '♦') return 1000;
    if (c.rank === '2' && c.suit === '♣') return 500;
    if (c.rank === 'J') return 400;
    if (['Q', 'K', 'A'].includes(c.rank)) return 100;
    if (c.suit === '♣') return 50;
    return getCardValue(c.rank); 
}

// პოულობს ყველა შესაძლო კომბინაციას 11-ის შესავსებად
function findAllValidPartitions(availableCards, targetSum) {
    let results = [];
    // ლიმიტი, რომ სერვერი არ გადაიტვირთოს (მაგიდაზე ძაან ბევრი კარტის შემთხვევაში)
    let n = Math.min(availableCards.length, 12); 
    
    for (let i = 1; i < (1 << n); i++) {
        let subset = [];
        for (let j = 0; j < n; j++) {
            if (i & (1 << j)) {
                subset.push(availableCards[j]);
            }
        }
        if (subset.reduce((a,b) => a + getCardValue(b.rank), 0) % targetSum === 0) {
             if (canPartitionArray(subset.map(c => getCardValue(c.rank)), targetSum)) {
                 results.push(subset);
             }
        }
    }
    return results;
}

function canPartitionArray(arr, target) {
    if (arr.length === 0) return true;
    function findSubset(currentSubsetIndices, currentSum, index) {
        if (currentSum === target) {
            let remaining = arr.filter((_, i) => !currentSubsetIndices.includes(i));
            return canPartitionArray(remaining, target);
        }
        if (currentSum > target || index >= arr.length) return false;
        if (findSubset([...currentSubsetIndices, index], currentSum + arr[index], index + 1)) return true;
        return findSubset(currentSubsetIndices, currentSum, index + 1);
    }
    return findSubset([], 0, 0);
}

module.exports = { createDeck, isValidCapture, calculateRoundScores, getBestMove };