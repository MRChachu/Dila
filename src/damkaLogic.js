// damkaLogic.js

function createDamkaBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 !== 0) {
                if (row < 3) board[row][col] = { player: 1, isKing: false }; // შავები
                else if (row > 4) board[row][col] = { player: 0, isKing: false }; // თეთრები
            }
        }
    }
    return board;
}

function isValidPos(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// ამოწმებს, არის თუ არა სვლა წესების მიხედვით სწორი
function validateDamkaMove(board, playerIndex, from, to) {
    if (!isValidPos(from.r, from.c) || !isValidPos(to.r, to.c)) return { valid: false };
    
    const piece = board[from.r][from.c];
    if (!piece || piece.player !== playerIndex) return { valid: false };
    if (board[to.r][to.c] !== null) return { valid: false }; // უჯრა თავისუფალი უნდა იყოს

    const rowDiff = to.r - from.r;
    const colDiff = to.c - from.c;
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);

    if (absRowDiff !== absColDiff) return { valid: false }; // მხოლოდ დიაგონალი

    const dirRow = Math.sign(rowDiff);
    const dirCol = Math.sign(colDiff);

    let isCapture = false;
    let capturedPos = null;

    if (piece.isKing) {
        // 👑 დამკას ლოგიკა
        let obstacleCount = 0;
        let currR = from.r + dirRow;
        let currC = from.c + dirCol;

        while (currR !== to.r && currC !== to.c) {
            if (board[currR][currC] !== null) {
                obstacleCount++;
                capturedPos = { r: currR, c: currC };
                if (board[currR][currC].player === playerIndex) return { valid: false }; // საკუთარ ქვას ვერ გადაახტება
            }
            currR += dirRow;
            currC += dirCol;
        }

        if (obstacleCount > 1) return { valid: false }; // ორ ქვას ერთად ვერ გადაახტება
        if (obstacleCount === 1) isCapture = true;

    } else {
        // ♟️ ჩვეულებრივი ქვის ლოგიკა
        const forwardDir = playerIndex === 0 ? -1 : 1;

        if (absRowDiff === 1) {
            // ჩვეულებრივი სვლა (მხოლოდ წინ)
            if (dirRow !== forwardDir) return { valid: false };
        } else if (absRowDiff === 2) {
            // მოჭრა (კლასიკურში/რუსულში უკან მოჭრაც მოსულა)
            const midRow = from.r + dirRow;
            const midCol = from.c + dirCol;
            const midPiece = board[midRow][midCol];

            if (!midPiece || midPiece.player === playerIndex) return { valid: false };
            isCapture = true;
            capturedPos = { r: midRow, c: midCol };
        } else {
            return { valid: false }; // ჩვეულებრივი ქვა 2 უჯრაზე შორს ვერ წავა
        }
    }

    // დამკად გადაქცევის შემოწმება
    let becomesKing = piece.isKing;
    if (!piece.isKing) {
        if (playerIndex === 0 && to.r === 0) becomesKing = true;
        if (playerIndex === 1 && to.r === 7) becomesKing = true;
    }

    return { valid: true, isCapture, capturedPos, becomesKing };
}

module.exports = {
    createDamkaBoard,
    validateDamkaMove
};