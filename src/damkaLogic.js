function createDamkaBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 !== 0) {
                if (row < 3) board[row][col] = { player: 1, isKing: false }; 
                else if (row > 4) board[row][col] = { player: 0, isKing: false }; 
            }
        }
    }
    return board;
}

function isValidPos(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function hasCaptureMoves(board, playerIndex, r, c) {
    const piece = board[r][c];
    if (!piece || piece.player !== playerIndex) return false;

    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    
    if (piece.isKing) {
        for (let [dRow, dCol] of directions) {
            let currR = r + dRow;
            let currC = c + dCol;
            let foundOpponent = false;
            
            while (isValidPos(currR, currC)) {
                const target = board[currR][currC];
                if (target !== null) {
                    if (target.player === playerIndex) break; 
                    if (foundOpponent) break; 
                    foundOpponent = true;
                } else if (foundOpponent) {
                    return true; 
                }
                currR += dRow;
                currC += dCol;
            }
        }
    } else {
        for (let [dRow, dCol] of directions) {
            const midR = r + dRow;
            const midC = c + dCol;
            const toR = r + dRow * 2;
            const toC = c + dCol * 2;
            
            if (isValidPos(toR, toC)) {
                const midPiece = board[midR][midC];
                if (midPiece && midPiece.player !== playerIndex && board[toR][toC] === null) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 🟢 ამოწმებს მოთამაშის ნებისმიერ ქვას ხომ არ აქვს მოჭრის საშუალება
function playerHasAnyCapture(board, playerIndex) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] && board[r][c].player === playerIndex) {
                if (hasCaptureMoves(board, playerIndex, r, c)) return true;
            }
        }
    }
    return false;
}

function validateDamkaMove(board, playerIndex, from, to) {
    if (!isValidPos(from.r, from.c) || !isValidPos(to.r, to.c)) return { valid: false, error: 'არასწორი უჯრა' };
    
    const piece = board[from.r][from.c];
    if (!piece || piece.player !== playerIndex) return { valid: false, error: 'შენი ქვა არ არის' };
    if (board[to.r][to.c] !== null) return { valid: false, error: 'უჯრა დაკავებულია' };

    const rowDiff = to.r - from.r;
    const colDiff = to.c - from.c;
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);

    if (absRowDiff !== absColDiff) return { valid: false, error: 'მხოლოდ დიაგონალზე!' };

    const dirRow = Math.sign(rowDiff);
    const dirCol = Math.sign(colDiff);

    let isCapture = false;
    let capturedPos = null;

    if (piece.isKing) {
        let obstacleCount = 0;
        let currR = from.r + dirRow;
        let currC = from.c + dirCol;

        while (currR !== to.r && currC !== to.c) {
            if (board[currR][currC] !== null) {
                obstacleCount++;
                capturedPos = { r: currR, c: currC };
                if (board[currR][currC].player === playerIndex) return { valid: false, error: 'საკუთარ ქვას ვერ გადაახტები' }; 
            }
            currR += dirRow;
            currC += dirCol;
        }

        if (obstacleCount > 1) return { valid: false, error: 'ორ ქვას ერთად ვერ გადაახტები' }; 
        if (obstacleCount === 1) isCapture = true;

    } else {
        const forwardDir = playerIndex === 0 ? -1 : 1;

        if (absRowDiff === 1) {
            if (dirRow !== forwardDir) return { valid: false, error: 'ჩვეულებრივი ქვა უკან ვერ ივლის' };
        } else if (absRowDiff === 2) {
            const midRow = from.r + dirRow;
            const midCol = from.c + dirCol;
            const midPiece = board[midRow][midCol];

            if (!midPiece || midPiece.player === playerIndex) return { valid: false, error: 'არასწორი მოჭრა' };
            isCapture = true;
            capturedPos = { r: midRow, c: midCol };
        } else {
            return { valid: false, error: 'მეტ უჯრაზე ვერ გადახტები' }; 
        }
    }

    // 🟢 აქ მოწმდება აუცილებელი მოჭრის წესი!
    if (!isCapture) {
        if (playerHasAnyCapture(board, playerIndex)) {
            return { valid: false, error: 'აუცილებელია მოჭრა!' };
        }
    }

    let becomesKing = piece.isKing;
    if (!piece.isKing) {
        if (playerIndex === 0 && to.r === 0) becomesKing = true;
        if (playerIndex === 1 && to.r === 7) becomesKing = true;
    }

    return { valid: true, isCapture, capturedPos, becomesKing };
}

module.exports = {
    createDamkaBoard,
    validateDamkaMove,
    hasCaptureMoves
};