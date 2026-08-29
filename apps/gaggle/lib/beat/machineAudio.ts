/**
 * "The Movement Machine" audio engine — a tiny original, royalty-free Web Audio
 * synth. A gentle C-major-pentatonic loop (always consonant, kid-friendly) over
 * a soft kick, scheduled with a lookahead clock. An AnalyserNode exposes the
 * live output level so the visuals can pulse exactly in time with the sound.
 * No audio files, no libraries.
 */

type Ctx = AudioContext & { webkitAudioContext?: never };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let analyser: AnalyserNode | null = null;
let data: Uint8Array<ArrayBuffer> | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let playing = false;
let muted = false;
let step = 0;
let nextTime = 0;

const TEMPO = 104; // bpm
const EIGHTH = 60 / TEMPO / 2;
// C major pentatonic (Hz) — any subset sounds pleasant together
const NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
// 16 eighth-notes; -1 = rest
const MELODY = [0, 2, 4, 2, 5, 4, 2, 4, 3, 5, 6, 5, 4, 2, 0, 2];

function ensure() {
  if (ctx) return;
  const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.0001;
  analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  data = new Uint8Array(analyser.frequencyBinCount);
  master.connect(analyser);
  analyser.connect(ctx.destination);
}

function note(t: number, freq: number, dur: number, type: OscillatorType, gain: number) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function kick(t: number) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + 0.22);
}

function schedule() {
  if (!ctx) return;
  while (nextTime < ctx.currentTime + 0.12) {
    const s = step % MELODY.length;
    const idx = MELODY[s];
    if (idx >= 0) note(nextTime, NOTES[idx], 0.42, s % 2 ? "sine" : "triangle", 0.14);
    // soft pad every 4 eighths
    if (s % 8 === 0) note(nextTime, NOTES[idx >= 0 ? idx : 0] / 2, 1.4, "sine", 0.06);
    if (s % 2 === 0) kick(nextTime);
    nextTime += EIGHTH;
    step++;
  }
  timer = setTimeout(schedule, 25);
}

export async function startMachine() {
  ensure();
  if (!ctx || !master) return;
  await ctx.resume();
  if (playing) return;
  playing = true;
  muted = false;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.85, ctx.currentTime + 0.35);
  step = 0;
  nextTime = ctx.currentTime + 0.06;
  schedule();
}

export function stopMachine() {
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
  if (timer) clearTimeout(timer);
  timer = null;
  playing = false;
}

export function toggleMute(): boolean {
  if (!ctx || !master) return muted;
  muted = !muted;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 0.85, ctx.currentTime + 0.15);
  return muted;
}

/** Live output level 0..1, for syncing visuals to the sound. */
export function getLevel(): number {
  if (!analyser || !data) return 0;
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / data.length) * 3.2);
}

export function isPlaying() {
  return playing;
}
