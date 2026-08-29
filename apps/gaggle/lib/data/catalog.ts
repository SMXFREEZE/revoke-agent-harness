// Demo catalog for the Watch / Browse experience. Posters reuse the licensed
// program photography; sample clips are the Pexels videos in /public/videos.

export type Category = {
  id: string;
  name: string;
  tagline: string;
  poster: string;
  accent: string;
};

export const CATEGORIES: Category[] = [
  { id: "fitness", name: "Fitness", tagline: "Heart-pumping follow-alongs", poster: "/images/gen/disc-fitness.jpg", accent: "#6901ff" },
  { id: "dance", name: "Dance", tagline: "Choreography that sparks joy", poster: "/images/gen/disc-dance.jpg", accent: "#ff4db5" },
  { id: "yoga", name: "Yoga", tagline: "Focus, balance & strength", poster: "/images/gen/disc-yoga.jpg", accent: "#00c2a8" },
  { id: "mindfulness", name: "Mindfulness", tagline: "Resets that centre the room", poster: "/images/gen/disc-mindfulness.jpg", accent: "#ffc400" },
  { id: "meditation", name: "Meditation", tagline: "Calm for happier days", poster: "/images/gen/disc-meditation.jpg", accent: "#9b6bff" },
  { id: "sports", name: "Sports", tagline: "Skill drills with game energy", poster: "/images/gen/disc-sports.jpg", accent: "#ff7a45" },
  { id: "martial-arts", name: "Martial Arts", tagline: "Confidence, one move at a time", poster: "/images/gen/disc-martial-arts.jpg", accent: "#2bb3ff" },
];

export type Program = {
  id: string;
  title: string;
  category: string;
  poster: string;
  video: string;
  duration: string;
  level: string;
  description: string;
  featured?: boolean;
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// Each program has its own distinct clip in /public/videos (filename = its slug),
// fetched per-program via scripts/fetch-videos.mjs, no more shared/fallback video.
const clip = (title: string) => `/videos/${slugify(title)}.mp4`;

type Seed = [title: string, cat: string, dur: string, level: string, desc: string];

const SEEDS: Seed[] = [
  ["Wake-Up Shake-Up", "fitness", "6 min", "All ages", "A quick full-body burst to start the day standing and smiling.", ],
  ["Energy Boost Circuit", "fitness", "9 min", "Gr. 3–5", "Bodyweight stations the whole class can follow from their desks."],
  ["Cool-Down Stretch", "fitness", "5 min", "All ages", "Gentle stretches to settle the room after recess."],
  ["Freeze Dance Party", "dance", "8 min", "K–2", "Move, freeze, giggle, a guaranteed mood-lifter."],
  ["Hip-Hop Basics", "dance", "10 min", "Gr. 3–5", "Learn four moves and string them into a routine."],
  ["Around the World", "dance", "7 min", "All ages", "Dances and rhythms from cultures across the globe."],
  ["Morning Sun Flow", "yoga", "8 min", "All ages", "A calming flow to build focus before learning."],
  ["Animal Poses", "yoga", "6 min", "K–2", "Be a tree, a cat, a flamingo, balance made playful."],
  ["Breathe & Balance", "yoga", "7 min", "Gr. 3–5", "Steady poses paired with simple breathing."],
  ["One-Minute Reset", "mindfulness", "3 min", "All ages", "A tiny pause that brings the whole class back to centre."],
  ["Gratitude Moment", "mindfulness", "5 min", "All ages", "A short practice for kinder, calmer classrooms."],
  ["Belly Breathing", "meditation", "4 min", "K–2", "Guided breathing that melts the wiggles away."],
  ["Body Scan", "meditation", "6 min", "Gr. 3–5", "Release tension from head to toe."],
  ["Dribble & Pass", "sports", "9 min", "Gr. 3–5", "Ball-handling drills with real game energy."],
  ["Agility Ladder", "sports", "7 min", "All ages", "Fast feet and big smiles, no equipment needed."],
  ["White Belt Basics", "martial-arts", "8 min", "All ages", "Stances, blocks and focus, discipline made fun."],
  ["Power & Control", "martial-arts", "10 min", "Gr. 3–5", "Kicks and combinations that build confidence."],
];

export const PROGRAMS: Program[] = SEEDS.map(([title, cat, dur, level, desc], i) => ({
  id: slugify(title),
  title,
  category: cat,
  poster: `/images/gen/prog-${slugify(title)}.jpg`,
  video: clip(title),
  duration: dur,
  level,
  description: desc,
  featured: i === 0 || i === 3 || i === 6,
}));

export const FEATURED = PROGRAMS.find((p) => p.featured) ?? PROGRAMS[0];

export function programsByCategory(catId: string): Program[] {
  return PROGRAMS.filter((p) => p.category === catId);
}

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getProgram(id: string): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}
