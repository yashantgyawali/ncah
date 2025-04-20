import { nanoid } from 'nanoid';
import { Game, Player, Card } from '../types';
import { blackCards, whiteCards } from '../data/cards';

const HAND_SIZE = 7;

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function createGame(): Game {
  return {
    id: nanoid(),
    players: [],
    currentBlackCard: null,
    whiteDeck: shuffleArray([...whiteCards]),
    blackDeck: shuffleArray([...blackCards]),
    playedCards: [],
    round: 0,
    status: 'waiting',
    cardCzarIndex: 0
  };
}

export function createPlayer(name: string): Player {
  return {
    id: nanoid(),
    name,
    isCardCzar: false,
    score: 0,
    hand: []
  };
}

export function dealCards(game: Game, player: Player): void {
  while (player.hand.length < HAND_SIZE && game.whiteDeck.length > 0) {
    const card = game.whiteDeck.pop();
    if (card) {
      player.hand.push(card);
    }
  }
}

export function startRound(game: Game): void {
  // Clear played cards from last round
  game.playedCards = [];
  
  // Deal new black card
  if (game.blackDeck.length === 0) {
    game.blackDeck = shuffleArray([...blackCards]);
  }
  game.currentBlackCard = game.blackDeck.pop() || null;

  // Set new Card Czar
  game.players.forEach((player, index) => {
    player.isCardCzar = index === game.cardCzarIndex;
    player.submittedCard = undefined;
  });

  // Deal cards to all players
  game.players.forEach(player => {
    if (!player.isCardCzar) {
      dealCards(game, player);
    }
  });

  game.status = 'playing';
}

export function submitCard(game: Game, playerId: string, cardId: string): void {
  const player = game.players.find(p => p.id === playerId);
  if (!player || player.isCardCzar || player.submittedCard) return;

  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return;

  const [card] = player.hand.splice(cardIndex, 1);
  player.submittedCard = card;
  game.playedCards.push({ playerId, card });

  // Check if all players have submitted
  const allPlayersSubmitted = game.players.every(p => 
    p.isCardCzar || p.submittedCard
  );

  if (allPlayersSubmitted) {
    game.status = 'selecting';
  }
}

export function selectWinner(game: Game, cardId: string): void {
  const winningPlay = game.playedCards.find(p => p.card.id === cardId);
  if (!winningPlay) return;

  const winner = game.players.find(p => p.id === winningPlay.playerId);
  if (winner) {
    winner.score += 1;
  }

  // Move to next round
  game.round += 1;
  game.cardCzarIndex = (game.cardCzarIndex + 1) % game.players.length;
  
  // Check for game end
  if (game.round >= 10) {
    game.status = 'finished';
  } else {
    startRound(game);
  }
}
