export type Region = 'global' | 'jp';
export type Language = 'es' | 'en';

export interface ManagerSettings {
  region: Region;
  gameDir?: string | null;
  publicHost: string;
}

export interface ManagerStatus {
  appVersion: string;
  repoRoot: string;
  settings: ManagerSettings;
  venvReady: boolean;
  certReady: boolean;
  enginesReady: boolean;
  assetsReady: boolean;
  patcherInGame: boolean;
  installed: boolean;
  serverRunning: boolean;
  adminReady: boolean;
  gamePort: number;
  adminPort: number;
}

export interface ManagerProgress {
  stage: string;
  pct: number;
  message: string;
}

export interface UserSummary {
  id: string;
  name: string;
  leader?: number;
  level?: number;
  fcoin?: number;
  coin?: number;
  umas?: number;
  supports?: number;
  veterans?: number;
  items?: number;
  career?: {
    card_id: number;
    turn: number;
    scenario: number;
  } | null;
  keys?: number;
  bytes?: number;
  created_at?: number;
  last_seen?: number;
  has_password?: boolean;
  pending_deletion_at?: number | null;
  account?: boolean;
  default?: boolean;
}

export interface UserDetail {
  id: string;
  region: string;
  profile: {
    name?: string;
    comment?: string;
    sex?: number;
    honor_id?: number;
    leader_chara_id?: number;
    leader_chara_dress_id?: number;
    support_card_id?: number;
    fan?: number;
    birth_day?: string;
    tutorial_step?: number;
  };
  social: {
    directory_level?: number;
    team_evaluation_point?: number;
    single_mode_play_count?: number;
    last_login_time?: number;
    comment?: string;
  };
  account: {
    exists: boolean;
    created_at?: number;
    last_seen?: number;
    has_password?: boolean;
    password_reset?: boolean;
    pending_deletion_at?: number | null;
    udid?: string;
  };
  wallet: {
    coin?: number;
    fcoin?: number;
  };
  tp: {
    current_tp?: number;
    max_tp?: number;
  };
  rp: {
    current_rp?: number;
    max_rp?: number;
  };
  money: number;
  counts: {
    umas: number;
    supports: number;
    characters: number;
    veterans: number;
    items: number;
    pieces: number;
    music: number;
    mail_unclaimed: number;
    mail_total: number;
  };
  best_veteran?: {
    card: string;
    card_id: number;
    score: number;
    rank: string;
  } | null;
  career?: {
    card_id?: number;
    card?: string;
    turn?: number;
    scenario?: number;
    state?: number;
  } | null;
  parked: string[];
  paid: Record<string, number | null>;
  keys: { key: string; size: number }[];
}

export interface CatalogUmaCard {
  id: number;
  chara_id: number;
  name: string;
  title: string;
  default_rarity: number;
  max_rarity: number;
  style: number;
  piece_id: number;
  talent: number[];
  apt: number[];
  limited?: number;
}

export interface CatalogSupportCard {
  id: number;
  chara_id: number;
  rarity: number;
  type: 'speed' | 'stamina' | 'power' | 'guts' | 'wiz' | 'friend' | 'group' | 'other';
  name: string;
  title: string;
  start?: number;
  custom?: boolean;
}

export interface CatalogItem {
  id: number;
  name: string;
  desc: string;
  category: number;
  group: string;
  limit: number;
  rare: number;
}

export interface CatalogSkill {
  id: number;
  name: string;
  rarity: number;
  group: number;
  grade: number;
  icon: number;
}

export interface CatalogFactor {
  id: number;
  group: number;
  stars: number;
  kind: string;
  name: string;
}

export interface CatalogCore {
  region: string;
  umas: {
    cards: CatalogUmaCard[];
    aptitudes: string[];
    max_talent: number;
    hint_caps: Record<number, number>;
  };
  supports: {
    cards: CatalogSupportCard[];
    limits: Record<number, number[]>;
    levels: Record<number, [number, number][]>;
  };
  items: CatalogItem[];
  misc: {
    charas: Record<string, string>;
    honors: { id: number; name: string; rank: number }[];
    nicknames: { id: number; name: string; chara: number }[];
    conditions: { id: number; name: string; type: number }[];
    scenarios: Record<string, string>;
    ranks: { id: number; min: number; max: number; label: string }[];
  };
}

export interface OwnedUma {
  id: number;
  rarity: number;
  talent: number;
  hints: number;
  hint_max: number;
  created?: string;
}

export interface OwnedSupport {
  id: number;
  exp: number;
  lb: number;
  level: number;
  stock: number;
  favorite: number;
  created?: string;
}

export interface VeteranSummary {
  id: number;
  card_id: number;
  name: string;
  stats: number[];
  apt: number[];
  score: number;
  rank: number;
  rank_label: string;
  scenario: number;
  style: number;
  talent: number;
  rarity: number;
  fans: number;
  wins: number;
  nickname: number;
  locked: boolean;
  saved: boolean;
  created: string;
  skills: number;
  skill_ids: number[];
  factors: number[];
  band: string;
}

export interface CareerState {
  active: boolean;
  parked: { name: string; card_id: number; card: string; turn: number }[];
  card?: string;
  turn_label?: string;
  state_name?: string;
  scenario_name?: string;
  chara_info?: {
    card_id: number;
    turn: number;
    scenario_id: number;
    state: number;
    speed: number;
    stamina: number;
    pow: number;
    guts: number;
    wiz: number;
    max_speed: number;
    max_stamina: number;
    max_pow: number;
    max_guts: number;
    max_wiz: number;
    vital: number;
    max_vital: number;
    motivation: number;
    skill_point: number;
    fans: number;
    chara_grade: number;
    skill_array?: { skill_id: number; level: number }[];
  };
  goals?: {
    turn: number;
    sort: number;
    kind: string;
    what: string;
    cleared: boolean;
    due: boolean;
  }[];
  goals_cleared?: number;
  races?: { turn: number; program_id: number; rank: number; name: string }[];
  bonds?: {
    target_id: number;
    evaluation: number;
    name: string;
    support_card_id?: number | null;
  }[];
  end_turn?: number;
}

export interface TuningKnob {
  key: string;
  kind: 'int' | 'float';
  min: number;
  max: number;
  label: string;
  help: string;
  value: number | null;
}

export interface HistoryRow {
  id: number;
  t: number;
  viewer: string;
  op: string;
  label: string;
  keys: string[];
}
