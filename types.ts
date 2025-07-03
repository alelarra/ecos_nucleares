
export interface Location {
  id: string;
  name: string;
  baseDescription: string;
  exits: { [key: string]: string }; 
  items: string[];
  enemies?: string[];
}

export interface Item {
  id: string;
  name: string;
  baseDescription: string;
  isContainer?: boolean;
  isOpen?: boolean;
  contains?: string[];
  useEffects?: {
    heals?: number;
  };
  equipable?: boolean;
  damage?: number;
}

export interface Enemy {
    id: string;
    name: string;
    description: string;
    health: number;
    maxHealth: number;
    attack: number;
    isAggressive: boolean;
    drops?: string[];
    descriptionOnEnter: string;
}

export interface GameState {
  currentLocationId: string;
  inventory: string[];
  log: GameLogEntry[];
  world: {
    locations: { [key:string]: Location };
    items: { [key: string]: Item };
    enemies: { [key: string]: Enemy };
  };
  isInitialized: boolean;
  playerHealth: number;
  maxPlayerHealth: number;
  currentEnemyId: string | null;
  equippedWeapon: string | null;
  isGameOver: boolean;
}

export interface GameLogEntry {
  id: number;
  type: 'player' | 'system' | 'error' | 'info' | 'combat' | 'enemy_turn';
  text: string;
}
