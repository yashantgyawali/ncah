'use client';

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  isHost?: boolean;
  score: number;
}

interface RoomState {
  players: Player[];
  status: string;
  host: string;
}

interface GameLobbyProps {
  roomCode: string;
  socket: Socket;
  playerName: string;
}

export default function GameLobby({ roomCode, socket, playerName }: GameLobbyProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    // Listen for game state updates
    const handleGameState = (state: { game: any; currentPlayer: any }) => {
      console.log('Game state updated:', state);
      setPlayers(state.game.players);
      
      // First player is considered the host
      const firstPlayer = state.game.players[0];
      setIsHost(firstPlayer && firstPlayer.id === socket.id);
    };

    socket.on('gameStateUpdate', handleGameState);

    // Clean up listeners
    return () => {
      socket.off('gameStateUpdate', handleGameState);
    };
  }, [socket]);

  const startGame = () => {
    if (isHost && players.length >= 2) {
      socket.emit('startGame', roomCode);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5FF] flex flex-col items-center p-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <svg width="183" height="125" viewBox="0 0 183 125" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* SVG paths */}
          </svg>
        </div>

        {/* Room Code */}
        <div className="text-center space-y-2">
          <div className="text-sm text-gray-600">room code</div>
          <div className="flex items-center justify-center space-x-2">
            <div className="bg-white px-4 py-2 rounded-lg border border-[#8A7DC5] text-[#8A7DC5]">
              {roomCode}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(roomCode)}
              className="p-2 text-[#8A7DC5] hover:bg-[#8A7DC5] hover:text-white rounded-lg transition-colors"
            >
              📋
            </button>
          </div>
        </div>

        {/* Player Name */}
        <div className="text-center space-y-2">
          <div className="text-sm text-gray-600">my name is</div>
          <div className="bg-white px-4 py-2 rounded-lg border border-[#8A7DC5]">
            {playerName}
          </div>
        </div>

        {/* Players List */}
        <div className="text-center space-y-4">
          <div className="text-sm text-gray-600">who's in the game?</div>
          <div className="grid grid-cols-2 gap-4">
            {players.map((player) => (
              <div
                key={player.id}
                className={`bg-white px-4 py-2 rounded-lg border ${
                  player.id === socket.id ? 'border-purple-500' : 'border-[#8A7DC5]'
                } ${player.id === socket.id ? 'text-purple-500' : 'text-[#8A7DC5]'}`}
              >
                {player.name} {player.id === socket.id && '(you)'}
              </div>
            ))}
          </div>
        </div>

        {/* Start Game Button (only visible to host) */}
        {isHost && players.length >= 2 && (
          <button
            onClick={startGame}
            className="w-full py-3 px-6 bg-[#8A7DC5] text-white rounded-lg hover:bg-[#7A6DB5] transition-colors"
          >
            Start Game
          </button>
        )}

        {isHost && players.length < 2 && (
          <div className="text-center text-gray-600">
            Waiting for more players to join...
          </div>
        )}

        {!isHost && (
          <div className="text-center text-gray-600">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}
