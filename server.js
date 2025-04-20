const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { whiteCards, blackCards } = require('./dist/app/data/cards');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store active games and players
const games = new Map();
const players = new Map();

// Shuffle array helper
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Deal cards to a player
function dealCards(gameState, playerId, count = 7) {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return;

  while (player.hand.length < count) {
    if (gameState.whiteDeck.length === 0) {
      // Reshuffle discarded white cards if deck is empty
      gameState.whiteDeck = shuffleArray([...gameState.discardedWhiteCards]);
      gameState.discardedWhiteCards = [];
    }
    if (gameState.whiteDeck.length > 0) {
      player.hand.push(gameState.whiteDeck.pop());
    }
  }
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle both joinRoom and joinGame events for compatibility
  const handleJoin = ({ roomId, playerName }) => {
    try {
      // Validate room code
      if (!roomId || typeof roomId !== 'string' || roomId.length < 4) {
        socket.emit('error', { message: 'Invalid room code' });
        return;
      }

      // Validate player name
      if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
        socket.emit('error', { message: 'Invalid player name' });
        return;
      }

      console.log(`Client ${socket.id} joining room ${roomId} as ${playerName}`);
      socket.join(roomId);
      
      if (!games.has(roomId)) {
        // Create new game
        const game = {
          id: roomId,
          players: [],
          status: 'waiting',
          host: socket.id,
          whiteDeck: shuffleArray([...whiteCards]),
          blackDeck: shuffleArray([...blackCards]),
          currentBlackCard: null,
          discardedWhiteCards: [],
          discardedBlackCards: [],
          submittedCards: [],
          cardCzar: null,
          round: 0
        };
        games.set(roomId, game);
      }

      const game = games.get(roomId);
      
      // Check if player is already in the game
      const existingPlayer = game.players.find(p => p.id === socket.id);
      if (!existingPlayer) {
        const player = {
          id: socket.id,
          name: playerName,
          isHost: game.players.length === 0,
          hand: [],
          score: 0
        };

        game.players.push(player);
        players.set(socket.id, { roomId, name: playerName });
        
        // Emit to all clients in the room including sender
        io.in(roomId).emit('roomState', {
          players: game.players,
          status: game.status,
          host: game.host
        });

        // Log room state for debugging
        console.log(`Room ${roomId} updated:`, {
          players: game.players.map(p => ({ id: p.id, name: p.name })),
          playerCount: game.players.length
        });
      }
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  };

  socket.on('joinRoom', handleJoin);
  socket.on('joinGame', handleJoin);

  socket.on('startGame', ({ roomId }) => {
    const game = games.get(roomId);
    if (game && game.host === socket.id && game.players.length >= 2) {
      game.status = 'playing';
      game.round = 1;
      game.cardCzar = game.players[0].id; // First player is card czar
      game.currentBlackCard = game.blackDeck.pop();
      game.submittedCards = [];
      
      // Deal 7 cards to each player
      game.players.forEach(player => {
        dealCards(game, player.id);
      });

      io.to(roomId).emit('gameState', game);
    }
  });

  socket.on('submitCard', ({ roomId, cardId }) => {
    const game = games.get(roomId);
    if (!game || game.status !== 'playing') return;

    const player = game.players.find(p => p.id === socket.id);
    if (!player || player.id === game.cardCzar) return;

    // Check if player already submitted
    if (game.submittedCards.some(submission => submission.playerId === socket.id)) return;

    // Find and remove card from player's hand
    const cardIndex = player.hand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;

    const submittedCard = player.hand.splice(cardIndex, 1)[0];
    game.submittedCards.push({
      playerId: socket.id,
      card: submittedCard
    });

    // Deal a new card
    dealCards(game, socket.id, 7);

    // If all players (except czar) submitted, show cards to czar
    if (game.submittedCards.length === game.players.length - 1) {
      game.status = 'selecting';
      game.submittedCards = shuffleArray(game.submittedCards);
    }

    io.to(roomId).emit('gameState', game);
  });

  socket.on('selectWinner', ({ roomId, submissionId }) => {
    const game = games.get(roomId);
    if (!game || game.status !== 'selecting' || socket.id !== game.cardCzar) return;

    const winningSubmission = game.submittedCards.find(s => s.playerId === submissionId);
    if (!winningSubmission) return;

    // Award point to winner
    const winner = game.players.find(p => p.id === winningSubmission.playerId);
    if (winner) winner.score += 1;

    // Move cards to discard piles
    game.discardedBlackCards.push(game.currentBlackCard);
    game.submittedCards.forEach(submission => {
      game.discardedWhiteCards.push(submission.card);
    });

    // Start new round
    game.round += 1;
    game.status = 'playing';
    game.submittedCards = [];
    game.currentBlackCard = game.blackDeck.pop();

    // Rotate card czar
    const czarIndex = game.players.findIndex(p => p.id === game.cardCzar);
    game.cardCzar = game.players[(czarIndex + 1) % game.players.length].id;

    io.to(roomId).emit('gameState', game);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected (${socket.id}):`, reason);
    
    const playerData = players.get(socket.id);
    if (playerData) {
      const { roomId } = playerData;
      const game = games.get(roomId);
      
      if (game) {
        game.players = game.players.filter(p => p.id !== socket.id);
        
        if (game.host === socket.id && game.players.length > 0) {
          game.host = game.players[0].id;
          game.players[0].isHost = true;
        }
        
        if (game.players.length === 0) {
          games.delete(roomId);
        } else {
          // If disconnected player was card czar, assign new one
          if (game.cardCzar === socket.id) {
            game.cardCzar = game.players[0].id;
          }
          io.to(roomId).emit('gameState', game);
        }
      }
      
      players.delete(socket.id);
    }
  });
});

// Error handling
io.engine.on("connection_error", (err) => {
  console.log('Connection error:', err.req);
  console.log('Error message:', err.code, err.message);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
