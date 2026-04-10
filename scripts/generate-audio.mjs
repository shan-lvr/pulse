#!/usr/bin/env node
/**
 * Generate BGM + SFX for the Pulse game via the ElevenLabs API.
 *
 * Requires ELEVENLABS_API_KEY in the environment.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... node scripts/generate-audio.mjs            # all assets
 *   ELEVENLABS_API_KEY=sk_... node scripts/generate-audio.mjs bgm pulse  # a subset
 *
 * Output goes to `public/` so Vite copies it into `dist/` at build time.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'public');

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('ELEVENLABS_API_KEY is required');
  process.exit(1);
}

const MUSIC_URL = 'https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192';
const SFX_URL = 'https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192';

const BGM_PROMPT = [
  'A futuristic, modern, mysterious synth-driven ambient beat loop for a space-themed',
  'game. Deep atmospheric pads layered with clean minimal electronic percussion and a',
  'subtle driving pulse. Ethereal shimmering textures, hypnotic arpeggios, cosmic and',
  'slightly mystical. Instrumental only, no vocals, no risers, no sudden drops. Soft',
  'and relaxing to listen to for long sessions but with a clear underlying rhythmic',
  'beat so it feels alive, not dull. Designed to loop seamlessly from end to start.',
  'Clean modern electronic production, minimalist sound design, AAA game soundtrack',
  'quality. Around 90 BPM.',
].join(' ');

const jobs = {
  bgm: {
    type: 'music',
    path: 'bgm.mp3',
    body: {
      prompt: BGM_PROMPT,
      music_length_ms: 60000,
      force_instrumental: true,
      model_id: 'music_v1',
    },
  },
  waveStart: {
    type: 'sfx',
    path: 'sfx/wave-start.mp3',
    body: {
      text:
        'Clean modern sci-fi UI whoosh with a soft electronic beat punch at the start. ' +
        'Crisp, punchy, short tail of subtle reverb. Not harsh, not noisy. AAA game UI sfx.',
      duration_seconds: 0.8,
      loop: false,
      prompt_influence: 0.55,
    },
  },
  win: {
    type: 'sfx',
    path: 'sfx/win.mp3',
    body: {
      text:
        'Bright modern electronic success chime, clean crystalline upward arpeggio with a ' +
        'satisfying bell-like sparkle, short and punchy, not overwhelming. AAA game reward sfx.',
      duration_seconds: 1.6,
      loop: false,
      prompt_influence: 0.55,
    },
  },
  collapse: {
    type: 'sfx',
    path: 'sfx/collapse.mp3',
    body: {
      text:
        'Modern electronic failure hit: descending glitchy synth with a deep clean bass ' +
        'thump, brief downward pitch sweep. Clean, not harsh, not noisy. AAA game fail sfx.',
      duration_seconds: 1.2,
      loop: false,
      prompt_influence: 0.55,
    },
  },
  bonus: {
    type: 'sfx',
    path: 'sfx/bonus.mp3',
    body: {
      text:
        'Crystal clear futuristic notification ping, sparkling high-frequency chime, ' +
        'bright and rewarding, very clean, short punchy tail. AAA game bonus sfx.',
      duration_seconds: 0.9,
      loop: false,
      prompt_influence: 0.55,
    },
  },
  pulse: {
    type: 'sfx',
    path: 'sfx/pulse.mp3',
    body: {
      text:
        'Tight clean electronic kick-drum pulse, soft but punchy low-frequency thump with ' +
        'a subtle sub tail. Modern, minimal, not muddy. AAA game rhythmic tick sfx.',
      duration_seconds: 0.5,
      loop: false,
      prompt_influence: 0.55,
    },
  },
};

async function generate(name, job) {
  const url = job.type === 'music' ? MUSIC_URL : SFX_URL;
  console.log(`[${name}] generating (${job.type})…`);
  const t0 = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify(job.body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `[${name}] ${res.status} ${res.statusText}\n${errText.slice(0, 1000)}`,
    );
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const outPath = resolve(OUT_DIR, job.path);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buf);
  const ms = Date.now() - t0;
  console.log(
    `[${name}] wrote ${job.path} — ${(buf.length / 1024).toFixed(1)} KB in ${ms}ms`,
  );
}

const targets = process.argv.slice(2);
const names = targets.length > 0 ? targets : Object.keys(jobs);

for (const name of names) {
  const job = jobs[name];
  if (!job) {
    console.error(`Unknown job: ${name}. Known: ${Object.keys(jobs).join(', ')}`);
    process.exit(1);
  }
  try {
    await generate(name, job);
  } catch (e) {
    console.error(String(e));
    process.exit(1);
  }
}

console.log('all done.');
