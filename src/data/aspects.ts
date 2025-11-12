export const ASPECTS = {
  conjunction: { label: 'Conjunction', window: [0, 10] as const },
  sextile: { label: 'Sextile', window: [54, 66] as const },
  square: { label: 'Square', window: [84, 96] as const },
  trine: { label: 'Trine', window: [114, 126] as const },
  opposition: { label: 'Opposition', window: [170, 190] as const }
} as const;

export type AspectKey = keyof typeof ASPECTS;

export const aspectOptions = Object.entries(ASPECTS).map(([key, value]) => ({
  key: key as AspectKey,
  label: value.label,
  window: value.window
}));

export const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;

export type PlanetName = (typeof PLANETS)[number];

export function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function pick<T>(collection: readonly T[]): T {
  if (!collection.length) {
    throw new Error('Cannot pick from an empty collection.');
  }
  const index = Math.floor(Math.random() * collection.length);
  const value = collection[index];
  if (value === undefined) {
    throw new Error('Failed to pick a value from collection.');
  }
  return value;
}

export interface AspectState {
  planetA: PlanetName;
  planetB: PlanetName;
  angle: number;
  correct: AspectKey;
}

export function makeAspect(): AspectState {
  const keys = Object.keys(ASPECTS) as AspectKey[];
  const chosen = pick(keys);
  const window = ASPECTS[chosen].window;
  return {
    planetA: pick(PLANETS),
    planetB: pick(PLANETS),
    angle: rand(window[0], window[1]),
    correct: chosen
  };
}

