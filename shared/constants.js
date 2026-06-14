export const GAME_PHASES = {
  WAITING: 'waiting',
  HIDE: 'hide',
  HUNT: 'hunt',
  RESULTS: 'results',
}

export const ROUND_TIMES = {
  HIDE: 30,
  HUNT: 120,
  RESULTS: 10,
}

export const ROLES = {
  PROP: 'prop',
  HUNTER: 'hunter',
  SPECTATOR: 'spectator',
}

export const EVENTS = {
  // Room
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_UPDATE: 'room:update',
  ROOM_ERROR: 'room:error',
  ROOM_LEAVE: 'room:leave',
  // Lobby
  PLAYER_READY: 'player:ready',
  GAME_START: 'game:start',
  // Game
  PLAYER_MOVE: 'player:move',
  PLAYER_STATE: 'player:state',
  PLAYER_JOIN_GAME: 'player:joinGame',
  PLAYER_LEFT: 'player:left',
  PROP_DISGUISE: 'prop:disguise',
  HUNTER_SHOOT: 'hunter:shoot',
  PLAYER_HIT: 'player:hit',
  PLAYER_ELIMINATED: 'player:eliminated',
  // Phase
  PHASE_CHANGE: 'phase:change',
  TIMER_TICK: 'timer:tick',
  ROUND_END: 'round:end',
  // AI
  AI_ADD: 'ai:add',
}

// All disguisable props with their AABB sizes (width, height, depth)
export const PROP_TYPES = {
  crate:     { label: 'Crate',      size: [1, 1, 1],       color: 0x8B6914 },
  barrel:    { label: 'Barrel',     size: [0.7, 1.2, 0.7], color: 0x555555 },
  chair:     { label: 'Chair',      size: [0.8, 1.1, 0.8], color: 0x8B4513 },
  lamp:      { label: 'Floor Lamp', size: [0.4, 1.8, 0.4], color: 0xCCCC88 },
  tv:        { label: 'TV',         size: [1.2, 0.8, 0.2], color: 0x111111 },
  trashcan:  { label: 'Trash Can',  size: [0.5, 0.8, 0.5], color: 0x448844 },
  plant:     { label: 'Plant',      size: [0.6, 1.0, 0.6], color: 0x226622 },
  sofa:      { label: 'Sofa',       size: [2.0, 0.9, 0.9], color: 0x6655AA },
}

export const MAP_BOUNDS = { x: 20, z: 20 } // half-extents from center
export const PLAYER_SPEED = 5       // units/sec
export const PLAYER_HEIGHT = 1.7
export const HUNTER_SHOOT_RANGE = 30
export const MAX_PLAYERS = 8
export const MIN_PLAYERS_TO_START = 2
