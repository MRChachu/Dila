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

function validateDamkaMove(board, playerIndex, from, to) {
    if (!isValidPos(from.r, from.c) || !isValidPos(to.r, to.c)) return { valid: false };
    
    const piece = board[from.r][from.c];
    if (!piece || piece.player !== playerIndex) return { valid: false };
    if (board[to.r][to.c] !== null) return { valid: false }; 

    const rowDiff = to.r - from.r;
    const colDiff = to.c - from.c;
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);

    if (absRowDiff !== absColDiff) return { valid: false }; 

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
                if (board[currR][currC].player === playerIndex) return { valid: false }; 
            }
            currR += dirRow;
            currC += dirCol;
        }

        if (obstacleCount > 1) return { valid: false }; 
        if (obstacleCount === 1) isCapture = true;

    } else {
        const forwardDir = playerIndex === 0 ? -1 : 1;

        if (absRowDiff === 1) {
            if (dirRow !== forwardDir) return { valid: false };
        } else if (absRowDiff === 2) {
            const midRow = from.r + dirRow;
            const midCol = from.c + dirCol;
            const midPiece = board[midRow][midCol];

            if (!midPiece || midPiece.player === playerIndex) return { valid: false };
            isCapture = true;
            capturedPos = { r: midRow, c: midCol };
        } else {
            return { valid: false }; 
        }
    }

    let becomesKing = piece.isKing;
    if (!piece.isKing) {
        if (playerIndex === 0 && to.r === 0) becomesKing = true;
        if (playerIndex === 1 && to.r === 7) becomesKing = true;
    }

    return { valid: true, isCapture, capturedPos, becomesKing };
}

// 🟢 დამატებული ლოგიკა: ამოწმებს აქვს თუ არა კონკრეტულ ქვას მოჭრის გაგრძელების საშუალება
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
                    if (foundOpponent) break; // ორი ქვა გადაბმულად არის
                    foundOpponent = true;
                } else if (foundOpponent) {
                    return true; // ცარიელი უჯრა მოწინააღმდეგის უკან
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

module.exports = {
    createDamkaBoard,
    validateDamkaMove,
    hasCaptureMoves // ვაექსპორტებთ ახალ ფუნქციას სერვერისთვის
};