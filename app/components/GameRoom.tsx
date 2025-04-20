'use client';

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface Card {
  id: string;
  text: string;
  type: 'white' | 'black';
}

interface Player {
  id: string;
  name: string;
  score: number;
  hand: Card[];
}

interface GameState {
  id: string;
  players: Player[];
  status: 'playing' | 'selecting';
  currentBlackCard: Card | null;
  submittedCards: { playerId: string; card: Card }[];
  cardCzar: string;
  round: number;
}

interface GameRoomProps {
  socket: Socket;
  roomCode: string;
  playerName: string;
}

export default function GameRoom({ socket, roomCode, playerName }: GameRoomProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  useEffect(() => {
    socket.on('gameStateUpdate', (state: { game: GameState; currentPlayer: any }) => {
      setGameState(state.game);
    });

    return () => {
      socket.off('gameStateUpdate');
    };
  }, [socket]);

  const currentPlayer = gameState?.players.find(p => p.id === socket.id);
  const isCardCzar = gameState?.cardCzar === socket.id;

  const submitCard = (cardId: string) => {
    if (!isCardCzar && gameState?.status === 'playing') {
      socket.emit('submitCard', { cardId });
      setSelectedCard(null);
    }
  };

  const selectWinner = (submissionId: string) => {
    if (isCardCzar && gameState?.status === 'selecting') {
      socket.emit('selectWinner', { cardId: submissionId });
    }
  };

  if (!gameState || !currentPlayer) {
    return <div>Loading game...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F5FF] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-xl font-bold">Round {gameState.round}</div>
            <div className="text-sm">Room: {roomCode}</div>
          </div>
          <button 
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            onClick={() => window.location.href = '/'}
          >
            End Game
          </button>
        </div>

        {/* Players */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gameState.players.map((player) => (
            <div 
              key={player.id}
              className={`p-4 rounded-lg ${
                player.id === gameState.cardCzar 
                  ? 'bg-purple-100 border-2 border-purple-300' 
                  : 'bg-white'
              }`}
            >
              <div className="font-medium">{player.name}</div>
              <div className="text-sm text-gray-600">
                {player.id === gameState.cardCzar ? '👑 Card Czar' : ''} • Score: {player.score}
              </div>
            </div>
          ))}
        </div>

        {/* Game Area */}
        <div className="flex justify-center min-h-[300px] relative">
          {/* Black Card */}
          {gameState.currentBlackCard && (
            <div className="w-64 h-96 bg-black text-white rounded-lg p-6 shadow-xl">
              <p className="text-lg">{gameState.currentBlackCard.text}</p>
            </div>
          )}

          {/* Submitted Cards (only visible to Card Czar during selection) */}
          {isCardCzar && gameState.status === 'selecting' && (
            <div className="absolute top-4 left-0 right-0">
              <div className="flex justify-center gap-4 flex-wrap">
                {gameState.submittedCards.map((submission) => (
                  <div
                    key={submission.card.id}
                    onClick={() => selectWinner(submission.playerId)}
                    className="w-48 h-64 bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:-translate-y-2 transition-transform"
                  >
                    <p>{submission.card.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Player's Hand */}
        {!isCardCzar && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex gap-4 overflow-x-auto pb-4">
                {currentPlayer.hand.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => submitCard(card.id)}
                    className={`flex-shrink-0 w-48 h-64 bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:-translate-y-2 transition-transform ${
                      selectedCard === card.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                  >
                    <p>{card.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
