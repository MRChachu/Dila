// შაშის (დამკას) ლოგიკა - კლასიკური 8x8 ვერსია

// 1. დაფის საწყისი გენერაცია
// 0 = ცარიელი უჯრა
// მოთამაშე 0 (თეთრები, იწყებენ ქვემოდან, მიდიან ზემოთ)
// მოთამაშე 1 (შავები, იწყებენ ზემოდან, მოდიან ქვემოთ)
function createDamkaBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            // ქვები იდება მხოლოდ მუქ უჯრებზე ((row + col) % 2 !== 0)
            if ((row + col) % 2 !== 0) {
                if (row < 3) {
                    // ზედა 3 რიგი - შავები (მოთამაშე 1)
                    board[row][col] = { player: 1, isKing: false };
                } else if (row > 4) {
                    // ქვედა 3 რიგი - თეთრები (მოთამაშე 0)
                    board[row][col] = { player: 0, isKing: false };
                }
            }
        }
    }
    return board;
}

// დამხმარე ფუნქცია: არის თუ არა უჯრა დაფის ფარგლებში
function isValidPos(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// 2. შესაძლო სვლების გამოთვლა (სანამ რთულ მოჭრებზე გადავალთ, აქ შევამოწმებთ მარტივ სვლებს)
function getValidMovesForPiece(board, row, col, player) {
    const piece = board[row][col];
    if (!piece || piece.player !== player) return [];

    const validMoves = [];
    
    // ჩვეულებრივი ქვის მიმართულება (თეთრები -1, შავები +1)
    const direction = player === 0 ? -1 : 1; 

    // თუ დამკაა (King), შეუძლია ოთხივე მიმართულებით წასვლა, თუ არა და მხოლოდ წინ
    const directions = piece.isKing 
        ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] 
        : [[direction, 1], [direction, -1]];

    directions.forEach(([dRow, dCol]) => {
        let newRow = row + dRow;
        let newCol = col + dCol;

        if (piece.isKing) {
            // 👑 დამკას ლოგიკა: მიდის ბოლომდე, სანამ ცარიელია
            while (isValidPos(newRow, newCol) && board[newRow][newCol] === null) {
                validMoves.push({ toRow: newRow, toCol: newCol, isCapture: false });
                newRow += dRow;
                newCol += dCol;
            }
            // აქვე დაემატება დამკათი მოჭრის ლოგიკა შემდეგ ეტაპზე
        } else {
            // ♟️ ჩვეულებრივი ქვის სვლა 1 უჯრით წინ
            if (isValidPos(newRow, newCol) && board[newRow][newCol] === null) {
                validMoves.push({ toRow: newRow, toCol: newCol, isCapture: false });
            }
            
            // აქვე დაემატება ჩვეულებრივი ქვით მოჭრის ლოგიკა (მათ შორის უკან მოჭრის)
        }
    });

    return validMoves;
}

module.exports = {
    createDamkaBoard,
    getValidMovesForPiece,
    isValidPos
};