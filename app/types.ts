export interface Card {
  id: string;
  text: string;
  type: 'black' | 'white';
}

export interface Player {
  id: string;
  name: string;
  isCardCzar: boolean;
  score: number;
  hand: Card[];
  submittedCard?: Card;
}

export interface PlayedCard {
  playerId: string;
  card: Card;
}

export interface Game {
  id: string;
  players: Player[];
  currentBlackCard: Card | null;
  whiteDeck: Card[];
  blackDeck: Card[];
  playedCards: PlayedCard[];
  round: number;
  status: 'waiting' | 'playing' | 'selecting' | 'finished';
  cardCzarIndex: number;
}

export interface GameState {
  game: Game;
  currentPlayer: Player | null;
}
