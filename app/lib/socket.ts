import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { Game, Player, GameState } from '../types';

export type SocketServer = SocketIOServer | null;

let io: SocketServer = null;

// In-memory game states
const games = new Map<string, Game>();
const playerRooms = new Map<string, string>();

export const initSocketServer = (server: NetServer) => {
  if (!io) {
    io = new SocketIOServer(server, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('joinGame', ({ gameId, player }: { gameId: string, player: Player }) => {
        if (!io) return;
        
        // Leave any previous room
        const previousRoom = playerRooms.get(socket.id);
        if (previousRoom) {
          socket.leave(previousRoom);
          playerRooms.delete(socket.id);
        }

        // Join new room
        socket.join(gameId);
        playerRooms.set(socket.id, gameId);

        // Get or create game
        let game = games.get(gameId);
        if (!game) {
          game = {
            id: gameId,
            players: [],
            currentBlackCard: null,
            whiteDeck: [],
            blackDeck: [],
            playedCards: [],
            round: 0,
            status: 'waiting',
            cardCzarIndex: 0,
          };
          games.set(gameId, game);
        }

        // Add player if not already in game
        if (!game.players.find(p => p.id === player.id)) {
          game.players.push(player);
        }

        // Broadcast updated game state to all players in room
        io.to(gameId).emit('gameStateUpdate', { game, currentPlayer: player });
      });

      socket.on('startGame', (gameId: string) => {
        if (!io) return;
        
        const game = games.get(gameId);
        if (game) {
          game.status = 'playing';
          io.to(gameId).emit('gameStateUpdate', { game });
        }
      });

      socket.on('disconnect', () => {
        if (!io) return;
        
        const gameId = playerRooms.get(socket.id);
        if (gameId) {
          const game = games.get(gameId);
          if (game) {
            game.players = game.players.filter(p => p.id !== socket.id);
            if (game.players.length === 0) {
              games.delete(gameId);
            } else {
              io.to(gameId).emit('gameStateUpdate', { game });
            }
          }
          playerRooms.delete(socket.id);
        }
      });
    });
  }
  return io;
};

export const getSocketServer = () => io;
