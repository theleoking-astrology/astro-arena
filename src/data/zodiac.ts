export const SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces'
] as const;

export type SignName = (typeof SIGNS)[number];

export interface TrialOption {
  id: string;
  label: string;
  description: string;
  isCorrect: boolean;
  reaction: string;
}

export interface TrialScene {
  prompt: string;
  ambient: string;
  options: TrialOption[];
  success: string;
  failure: string;
}

export const TRAITS = {
  Aries: {
    sun: ['reckless', 'bold', 'combustible'],
    rising: ['sparks instantly', 'martian swagger', 'battle-ready']
  },
  Taurus: {
    sun: ['sensual', 'grounded', 'lux-seeking'],
    rising: ['slow burn', 'velvet aura', 'impeccable taste']
  },
  Gemini: {
    sun: ['curious', 'hyper', 'multithreaded'],
    rising: ['talkative', 'quick-witted', 'restless hands']
  },
  Cancer: {
    sun: ['protective', 'tidal emotions', 'moon-bound'],
    rising: ['soft shields', 'intuitive', 'homey glow']
  },
  Leo: {
    sun: ['radiant', 'dramatic', 'center-stage'],
    rising: ['spotlight magnet', 'golden mane', 'loud heart']
  },
  Virgo: {
    sun: ['precise', 'analytical', 'restorative'],
    rising: ['laser focus', 'tidy aura', 'quiet competence']
  },
  Libra: {
    sun: ['balanced', 'diplomatic', 'stylish'],
    rising: ['glossy charm', 'social gravity', 'ever curated']
  },
  Scorpio: {
    sun: ['intense', 'secretive', 'magnetic'],
    rising: ['piercing gaze', 'mystery cloak', 'x-ray vibes']
  },
  Sagittarius: {
    sun: ['wild', 'questing', 'boundary-free'],
    rising: ['laughing prophetic', 'wanderlust', 'blazing arrows']
  },
  Capricorn: {
    sun: ['stoic', 'strategic', 'high-altitude'],
    rising: ['laser ambition', 'executive aura', 'stone calm']
  },
  Aquarius: {
    sun: ['inventive', 'rebellious', 'future-coded'],
    rising: ['alien chic', 'electric ideas', 'orbit-shifter']
  },
  Pisces: {
    sun: ['mythic', 'dream-drowned', 'empathic'],
    rising: ['misty presence', 'psychic nods', 'ocean eyes']
  }
} satisfies Record<SignName, { sun: string[]; rising: string[] }>;

export const SUN_SCENES: Record<SignName, TrialScene> = {
  Aries: {
    prompt: 'Street vendor splashes water on you. Fight or walk?',
    ambient: 'Neon alley // Red sparks',
    options: [
      {
        id: 'aries-sun-brawl',
        label: 'Square up instantly',
        description: 'Challenge to duel',
        isCorrect: true,
        reaction: 'You ignite like a solar flare!'
      },
      {
        id: 'aries-sun-breathe',
        label: 'Count to ten',
        description: 'Walk away calm',
        isCorrect: false,
        reaction: 'Crowd yawns at restraint.'
      }
    ],
    success: 'Classic Aries combustion!',
    failure: 'Mars asks: where was the heat?'
  },
  Taurus: {
    prompt: 'Luxury truffle tasting costs half your score. Indulge?',
    ambient: 'Velvet lounge // Champagne glow',
    options: [
      {
        id: 'taurus-sun-lux',
        label: 'Swipe the card',
        description: 'Indulge immediately',
        isCorrect: true,
        reaction: 'Every star tastes richer now.'
      },
      {
        id: 'taurus-sun-skip',
        label: 'Save points',
        description: 'Stay practical',
        isCorrect: false,
        reaction: 'Taurus glow dims slightly.'
      }
    ],
    success: 'Luxury fuels momentum!',
    failure: 'Venus sighs at the denial.'
  },
  Gemini: {
    prompt: 'Two poets challenge you to simultaneous trivia battle.',
    ambient: 'Billboard canyon // Buzzing chatter',
    options: [
      {
        id: 'gemini-sun-talk',
        label: 'Answer both at once',
        description: 'Triple the chaos',
        isCorrect: true,
        reaction: 'Words ricochet like lightning!'
      },
      {
        id: 'gemini-sun-quiet',
        label: 'Silent treatment',
        description: 'Fold arms quietly',
        isCorrect: false,
        reaction: 'Your twins protest in stereo.'
      }
    ],
    success: 'Everyone quotes you!',
    failure: 'Mercury checks your Wi-Fi.'
  },
  Cancer: {
    prompt: 'Friend stuck in flooded arcade. Help or retreat?',
    ambient: 'Moonlit boardwalk // Silver puddles',
    options: [
      {
        id: 'cancer-sun-rescue',
        label: 'Build barricade',
        description: 'Shield with moon-shells',
        isCorrect: true,
        reaction: 'Protective fortress glows!'
      },
      {
        id: 'cancer-sun-retreat',
        label: 'Retreat to dry ground',
        description: 'Wave from distance',
        isCorrect: false,
        reaction: "Where's the shell armor?"
      }
    ],
    success: 'Crowd chants like lullaby!',
    failure: 'Luna sends soggy memo.'
  },
  Leo: {
    prompt: 'Spotlight on you. Empty mic. Crowd waits. Perform?',
    ambient: 'Rooftop stage // Laser sky',
    options: [
      {
        id: 'leo-sun-stage',
        label: 'Take the mic',
        description: 'Command the skyline',
        isCorrect: true,
        reaction: 'You roar solar riffs!'
      },
      {
        id: 'leo-sun-shy',
        label: 'Let others shine',
        description: 'Step aside gracefully',
        isCorrect: false,
        reaction: 'Spotlight flickers confused.'
      }
    ],
    success: 'City crowns you with confetti!',
    failure: 'Sun sets five minutes early.'
  },
  Virgo: {
    prompt: 'Synth lab: tangled cables, misaligned LEDs. Fix it?',
    ambient: 'Sterile alley // Glitch grids',
    options: [
      {
        id: 'virgo-sun-fix',
        label: 'Organize chaos',
        description: 'Color-code everything',
        isCorrect: true,
        reaction: 'Synth purrs in frequency!'
      },
      {
        id: 'virgo-sun-ignore',
        label: 'Leave it messy',
        description: "Someone else's job",
        isCorrect: false,
        reaction: 'Inner editor throws spreadsheet.'
      }
    ],
    success: 'Mercury salutes with checklists!',
    failure: 'Label maker writes "really?"'
  },
  Libra: {
    prompt: 'Two performers argue over runway aesthetics. Mediate?',
    ambient: 'Rose quartz plaza // Reflective pools',
    options: [
      {
        id: 'libra-sun-mediate',
        label: 'Host runway duel',
        description: 'Judge with grace',
        isCorrect: true,
        reaction: 'Flawless peace treaty!'
      },
      {
        id: 'libra-sun-avoid',
        label: 'Slip away quiet',
        description: 'Avoid conflict',
        isCorrect: false,
        reaction: 'Scales wobble uncertainly.'
      }
    ],
    success: 'Venus gifts laurel crown!',
    failure: 'Pigeons boo politely.'
  },
  Scorpio: {
    prompt: 'Velvet door whispers about shadow speakeasy. Enter?',
    ambient: 'Midnight street // UV fog',
    options: [
      {
        id: 'scorpio-sun-enter',
        label: 'Slip inside silently',
        description: 'Embrace mystery',
        isCorrect: true,
        reaction: 'Secrets sing to you!'
      },
      {
        id: 'scorpio-sun-pass',
        label: 'Stay topside',
        description: 'Too many secrets',
        isCorrect: false,
        reaction: 'Shadows mutter sadly.'
      }
    ],
    success: 'Pluto winks approval!',
    failure: 'Raven notes: dive deeper.'
  },
  Sagittarius: {
    prompt: 'Portal taxi to comet market. Leap in?',
    ambient: 'Open boulevard // Starfield stretch',
    options: [
      {
        id: 'sag-sun-go',
        label: 'Leap into portal',
        description: 'Adventure now',
        isCorrect: true,
        reaction: 'Rocket forward laughing!'
      },
      {
        id: 'sag-sun-stay',
        label: 'Stick to plan',
        description: 'No surprises',
        isCorrect: false,
        reaction: 'Centaur hooves tap impatiently.'
      }
    ],
    success: 'Jupiter meteor high-five!',
    failure: 'Travel brochure cries.'
  },
  Capricorn: {
    prompt: 'Executive drone offers skyline summit. Climb?',
    ambient: 'Granite ridge // Icy stars',
    options: [
      {
        id: 'cap-sun-climb',
        label: 'Accept and ascend',
        description: 'Seal the deal',
        isCorrect: true,
        reaction: 'Contracts etch in wind!'
      },
      {
        id: 'cap-sun-decline',
        label: 'Wave it off',
        description: 'Work-life balance',
        isCorrect: false,
        reaction: 'Saturn arches skeptical brow.'
      }
    ],
    success: 'Mountain hums approval!',
    failure: 'Goat statue crosses arms.'
  },
  Aquarius: {
    prompt: 'Crowd wants radical invention upgrade. Hack it?',
    ambient: 'Electric plaza // Teal lightning',
    options: [
      {
        id: 'aquarius-sun-hack',
        label: 'Rewire on spot',
        description: 'Prototype revolution',
        isCorrect: true,
        reaction: 'Reality reprogrammed!'
      },
      {
        id: 'aquarius-sun-conform',
        label: 'Follow manual',
        description: 'Stick to instructions',
        isCorrect: false,
        reaction: 'Future groans at old manual.'
      }
    ],
    success: 'Uranus holographic patent!',
    failure: 'Inventors guild side-eyes.'
  },
  Pisces: {
    prompt: 'Mer poet invites you to tidal jam. Join?',
    ambient: 'Fog harbor // Bioluminescent mist',
    options: [
      {
        id: 'pisces-sun-dive',
        label: 'Sing underwater',
        description: 'Merge with the choir',
        isCorrect: true,
        reaction: 'Dream chords echo galaxy-wide!'
      },
      {
        id: 'pisces-sun-decline',
        label: 'Stay on pier',
        description: 'Hum solo',
        isCorrect: false,
        reaction: 'Tide sighs in lowercase.'
      }
    ],
    success: 'Neptune crowns you siren!',
    failure: 'Shell radio loses signal.'
  }
};

export const RISING_SCENES: Record<SignName, TrialScene> = {
  Aries: {
    prompt: 'Stranger challenges dance-off. Accept?',
    ambient: 'Synth gym // Crimson strobes',
    options: [
      {
        id: 'aries-rising-accept',
        label: 'Battle without question',
        description: 'Spin sparks everywhere',
        isCorrect: true,
        reaction: 'Embers whirlpool the floor!'
      },
      {
        id: 'aries-rising-decline',
        label: 'Politely decline',
        description: 'Bow out gracefully',
        isCorrect: false,
        reaction: 'Mars side-eye intensifies.'
      }
    ],
    success: 'Crowd roars battlefield cheers!',
    failure: 'Speaker crackles “coward??”.'
  },
  Taurus: {
    prompt: 'Pop-up garden invites picnic. Stay?',
    ambient: 'Emerald terrace // Velvet night',
    options: [
      {
        id: 'taurus-rising-picnic',
        label: 'Claim a plush cushion',
        description: 'Arrange charcuterie',
        isCorrect: true,
        reaction: 'Senses bloom with gratitude!'
      },
      {
        id: 'taurus-rising-rush',
        label: 'Keep moving',
        description: 'Goals first',
        isCorrect: false,
        reaction: 'Venus pouts softly.'
      }
    ],
    success: 'Constellations toast your taste!',
    failure: 'Scented candles flicker sadly.'
  },
  Gemini: {
    prompt: 'Hologram twins want improv interview. Try?',
    ambient: 'Signal street // Neon scroll',
    options: [
      {
        id: 'gemini-rising-interview',
        label: 'Question both simultaneously',
        description: 'Juggle data streams',
        isCorrect: true,
        reaction: 'Dialogue splits into fireworks!'
      },
      {
        id: 'gemini-rising-ghost',
        label: 'Mute notifications',
        description: 'Avoid overload',
        isCorrect: false,
        reaction: 'Chatbots file complaint.'
      }
    ],
    success: 'Mercury spins satellites!',
    failure: 'Inbox fills with disappointed memes.'
  },
  Cancer: {
    prompt: 'Neighborhood kid fell asleep on bench. React?',
    ambient: 'Tidal park // Lavender fog',
    options: [
      {
        id: 'cancer-rising-blanket',
        label: 'Tuck them in',
        description: 'Summon moon-blanket',
        isCorrect: true,
        reaction: 'Seashell choir hums appreciation!'
      },
      {
        id: 'cancer-rising-leave',
        label: 'Keep distance',
        description: 'Respect space',
        isCorrect: false,
        reaction: 'Tides ebb with disappointment.'
      }
    ],
    success: 'Crabs salute with tiny banners!',
    failure: 'Moonlight dims to grayscale.'
  },
  Leo: {
    prompt: 'Ambient DJ quits mid-set. Spotlight swivels to you. Do it?',
    ambient: 'Gold atrium // Beam storms',
    options: [
      {
        id: 'leo-rising-takeover',
        label: 'Own the booth',
        description: 'Drop royal remix',
        isCorrect: true,
        reaction: 'City skyline pulses with pride!'
      },
      {
        id: 'leo-rising-pass',
        label: 'Let silence ride',
        description: 'It’s not your gig',
        isCorrect: false,
        reaction: 'Audience groans dramatically.'
      }
    ],
    success: 'Solar flare confetti!',
    failure: 'Crown emoji flickers out.'
  },
  Virgo: {
    prompt: 'Pop quiz: reorganize chaotic neon sign. Attempt?',
    ambient: 'Lab skyway // Chrome mist',
    options: [
      {
        id: 'virgo-rising-fix',
        label: 'Rewire immediately',
        description: 'Color order restored',
        isCorrect: true,
        reaction: 'Grids align singing gratitude!'
      },
      {
        id: 'virgo-rising-wait',
        label: 'Wait for tech',
        description: 'Not your job',
        isCorrect: false,
        reaction: 'Clipboard appears with judgement.'
      }
    ],
    success: 'Mercury clipboard badge!',
    failure: 'LEDs blink “really?”'
  },
  Libra: {
    prompt: 'Two stylists want you to judge outfit duel. Step in?',
    ambient: 'Rose hall // Mirror haze',
    options: [
      {
        id: 'libra-rising-judge',
        label: 'Host the duel',
        description: 'Balance aesthetics',
        isCorrect: true,
        reaction: 'Harmony ripples through runway!'
      },
      {
        id: 'libra-rising-avoid',
        label: 'Decline gracefully',
        description: 'Stay impartial',
        isCorrect: false,
        reaction: 'Scales wobble uncertainly.'
      }
    ],
    success: 'Venus sends glitter decree!',
    failure: 'Audience shrugs politely.'
  },
  Scorpio: {
    prompt: 'Shadow market opens secret vault for you. Enter?',
    ambient: 'Violet alley // Whisper fog',
    options: [
      {
        id: 'scorpio-rising-enter',
        label: 'Slip inside',
        description: 'Decode mysteries',
        isCorrect: true,
        reaction: 'Secrets kneel in formation!'
      },
      {
        id: 'scorpio-rising-wait',
        label: 'Circle perimeter',
        description: 'Gather intel first',
        isCorrect: false,
        reaction: 'Ravens caw “cowardice”.'
      }
    ],
    success: 'Pluto upgrades your cloak!',
    failure: 'Fog mutters disapproval.'
  },
  Sagittarius: {
    prompt: 'Free-fall elevator to cosmic bazaar. Jump?',
    ambient: 'Turquoise tower // Comet streaks',
    options: [
      {
        id: 'sag-rising-leap',
        label: 'Dive headfirst',
        description: 'Adventure escalate',
        isCorrect: true,
        reaction: 'Centaurs high-five midair!'
      },
      {
        id: 'sag-rising-hold',
        label: 'Buckle safely',
        description: 'Request instructions',
        isCorrect: false,
        reaction: 'Constellations boo softly.'
      }
    ],
    success: 'Meteor applause echoes!',
    failure: 'Map folds in disappointment.'
  },
  Capricorn: {
    prompt: 'Skyline boardroom invites midnight merger. Attend?',
    ambient: 'Obsidian summit // Frost beams',
    options: [
      {
        id: 'cap-rising-enter',
        label: 'Step inside purposefully',
        description: 'Network pre-sunrise',
        isCorrect: true,
        reaction: 'Contracts rearrange in your favor!'
      },
      {
        id: 'cap-rising-decline',
        label: 'Stay street level',
        description: 'Boundaries matter',
        isCorrect: false,
        reaction: 'Saturn checks watch unimpressed.'
      }
    ],
    success: 'Marble footstep trail!',
    failure: 'Briefcase whispers "missed it".'
  },
  Aquarius: {
    prompt: 'Rogue drone wants city playlist hack. Help?',
    ambient: 'Cobalt plaza // Static fizz',
    options: [
      {
        id: 'aquarius-rising-hack',
        label: 'Rewrite soundtrack',
        description: 'Future-funk paradise',
        isCorrect: true,
        reaction: 'Everyone walks in syncopation!'
      },
      {
        id: 'aquarius-rising-comply',
        label: 'Report drone',
        description: 'Rules exist',
        isCorrect: false,
        reaction: 'Drone mutters “conformist” in binary.'
      }
    ],
    success: 'Uranus glitch-art cascade!',
    failure: 'Bulletin board removes your flyer.'
  },
  Pisces: {
    prompt: 'Tea shop offers dream-sharing cup. Sip?',
    ambient: 'Foggy quay // Bioluminescent koi',
    options: [
      {
        id: 'pisces-rising-sip',
        label: 'Drink deeply',
        description: 'Merge imaginations',
        isCorrect: true,
        reaction: "See everyone's heart wishes!"
      },
      {
        id: 'pisces-rising-decline',
        label: 'Regular tea only',
        description: 'Boundaries important',
        isCorrect: false,
        reaction: 'Aura craves mystic soup.'
      }
    ],
    success: 'Neptune paints halos!',
    failure: 'Dream-fish disappointed flip.'
  }
};

export function shuffle<T>(values: readonly T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function cloneScene(scene: TrialScene): TrialScene {
  return {
    prompt: scene.prompt,
    ambient: scene.ambient,
    success: scene.success,
    failure: scene.failure,
    options: shuffle(scene.options.map((option) => ({ ...option })))
  };
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

export interface TrialData {
  sunSign: SignName;
  risingSign: SignName;
  sunScene: TrialScene;
  risingScene: TrialScene;
  sunTraits: string[];
  risingTraits: string[];
}

export function makeTrial(sun?: SignName, rising?: SignName): TrialData {
  const sunSign = sun ?? pick(SIGNS);
  const risingPool = SIGNS.filter((sign) => sign !== sunSign);
  const risingSign = rising ?? pick(risingPool.length ? risingPool : SIGNS);

  return {
    sunSign,
    risingSign,
    sunScene: cloneScene(SUN_SCENES[sunSign]),
    risingScene: cloneScene(RISING_SCENES[risingSign]),
    sunTraits: [...TRAITS[sunSign].sun],
    risingTraits: [...TRAITS[risingSign].rising]
  };
}

