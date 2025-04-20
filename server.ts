import { createServer } from 'http';
import { Server } from 'socket.io';
import { Game, Player } from './app/types';
import { createGame, createPlayer, startRound, submitCard, selectWinner } from './app/utils/game';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpServer = createServer(async (req, res) => {
  try {
    await handle(req, res);
  } catch (err) {
    console.error('Error occurred handling', req.url, err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

const io = new Server(httpServer, {
  path: '/api/socket/io',
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const games = new Map<string, Game>();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  let currentGame: Game | null = null;
  let currentPlayer: Player | null = null;

  socket.on('joinGame', ({ gameId, player }: { gameId: string, player: Player }) => {
    console.log('Join game request:', gameId, player);
    
    // Get or create game
    let game = games.get(gameId);
    if (!game) {
      game = createGame();
      game.id = gameId;
      games.set(gameId, game);
      
      // First player is the Card Czar
      player.isCardCzar = true;
    }
    
    // Add player to game
    player.id = socket.id; // Ensure player ID matches socket ID
    if (!game.players.find(p => p.id === player.id)) {
      game.players.push(player);
    }
    
    socket.join(gameId);
    currentGame = game;
    currentPlayer = player;
    
    // Broadcast updated game state
    io.to(gameId).emit('gameStateUpdate', {
      game,
      currentPlayer: player
    });
  });

  socket.on('startGame', (gameId: string) => {
    console.log('Start game request:', gameId);
    const game = games.get(gameId);
    if (!game) return;
    
    // Start the game
    game.status = 'playing';
    startRound(game);
    
    io.to(gameId).emit('gameStateUpdate', {
      game,
      currentPlayer: currentPlayer
    });
  });

  socket.on('submitCard', ({ cardId }) => {
    if (!currentGame || !currentPlayer) return;
    console.log('Submit card:', cardId);

    submitCard(currentGame, currentPlayer.id, cardId);
    
    io.to(currentGame.id).emit('gameStateUpdate', {
      game: currentGame,
      currentPlayer
    });
  });

  socket.on('selectWinner', ({ cardId }) => {
    if (!currentGame || !currentPlayer || !currentPlayer.isCardCzar) return;
    console.log('Select winner:', cardId);

    selectWinner(currentGame, cardId);
    
    io.to(currentGame.id).emit('gameStateUpdate', {
      game: currentGame,
      currentPlayer
    });
  });

  socket.on('endGame', ({ gameId }) => {
    const game = games.get(gameId);
    if (!game) return;

    game.status = 'finished';
    io.to(gameId).emit('gameState', {
      game,
      currentPlayer
    });
    
    // Clean up the game
    games.delete(gameId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (currentGame) {
      // Remove player from game
      currentGame.players = currentGame.players.filter(p => p.id !== socket.id);
      
      if (currentGame.players.length === 0) {
        // Delete game if no players left
        games.delete(currentGame.id);
      } else {
        // If the disconnected player was the Card Czar, assign a new one
        if (currentPlayer?.isCardCzar && currentGame.players.length > 0) {
          currentGame.players[0].isCardCzar = true;
        }
        
        // Notify remaining players
        io.to(currentGame.id).emit('gameStateUpdate', {
          game: currentGame,
          currentPlayer: null
        });
      }
    }
  });
});

// Prepare Next.js app and start server
app.prepare().then(() => {
  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
