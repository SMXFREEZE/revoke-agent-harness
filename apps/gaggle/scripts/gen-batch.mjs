// Batch-generate Tulum DJ Academy imagery via Azure gpt-image.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

function loadEnv() {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}
const env = loadEnv();
const endpoint = env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "");
const url = `${endpoint}/openai/deployments/${env.AZURE_IMAGE_DEPLOYMENT}/images/generations?api-version=${env.AZURE_OPENAI_API_VERSION || "2024-02-01"}`;

const STYLE = "Cinematic premium editorial photography, warm golden hour light, turquoise and emerald green tones, lush tropical Tulum jungle and Caribbean coast, shallow depth of field, film grain, no text, no watermark.";

const JOBS = [
  ["public/images/tulum/prog-dj-course.jpg", "Close-up of hands on a glowing Pioneer CDJ and mixer in a dim Tulum beach club, neon green accents on the jog wheels.", "1024x1024"],
  ["public/images/tulum/prog-online.jpg", "A DJ at home practicing on a controller with a laptop, headphones on, a webcam lesson on screen, plants and warm light.", "1024x1024"],
  ["public/images/tulum/prog-production.jpg", "Music producer at a studio desk with monitors, MIDI keyboard and a DAW glowing on screen, moody green and teal lighting.", "1024x1024"],
  ["public/images/tulum/prog-recording.jpg", "Videographer filming a DJ performing on a jungle deck at sunset in Tulum, cinematic camera rig, palm trees.", "1024x1024"],
  ["public/images/tulum/prog-social.jpg", "A DJ filming vertical content of their set on a phone gimbal, beach sunset, vibrant and aspirational.", "1024x1024"],
  ["public/images/tulum/prog-ghost.jpg", "Atmospheric studio close-up of a synthesizer and waveform on a screen, headphones, deep green and teal glow.", "1024x1024"],
  ["public/images/tulum/prog-events.jpg", "An open-air Tulum beach party at golden hour, crowd dancing, DJ booth with speakers and warm festoon lights.", "1024x1024"],
  ["public/images/tulum/loc-cenote.jpg", "A surreal Tulum cenote, crystal-clear turquoise water in a limestone cave with shafts of light, a DJ booth on a wooden platform.", "1536x1024"],
  ["public/images/tulum/loc-beach.jpg", "Pristine Tulum beachfront at golden hour, turquoise sea, white sand, a DJ setup under a palm-thatch palapa.", "1536x1024"],
  ["public/images/tulum/loc-jungle.jpg", "A hidden wooden deck deep in the Tulum jungle canopy, lush palms, a DJ playing as light filters through.", "1536x1024"],
  ["public/images/tulum/loc-rooftop.jpg", "A Tulum rooftop at sunset overlooking the town and jungle, DJ booth, warm sky turning pink and gold.", "1536x1024"],
];

async function gen(out, prompt, size) {
  if (existsSync(out)) { console.log("skip", out); return; }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": env.AZURE_API_KEY },
    body: JSON.stringify({ prompt: `${prompt} ${STYLE}`, n: 1, size, quality: env.AZURE_IMAGE_QUALITY || "high" }),
  });
  if (!res.ok) { console.error("FAIL", out, res.status, (await res.text()).slice(0, 200)); return; }
  const j = await res.json();
  const b64 = j?.data?.[0]?.b64_json;
  mkdirSync(dirname(out), { recursive: true });
  if (b64) { writeFileSync(out, Buffer.from(b64, "base64")); console.log("saved", out); }
  else if (j?.data?.[0]?.url) { const i = await fetch(j.data[0].url); writeFileSync(out, Buffer.from(await i.arrayBuffer())); console.log("saved", out); }
  else console.error("no image", out);
}

for (const [out, prompt, size] of JOBS) {
  try { await gen(out, prompt, size); } catch (e) { console.error("ERR", out, e.message); }
}
console.log("BATCH DONE");
