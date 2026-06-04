const fs = require('fs');
const path = require('path');
const aiClient = require('./aiClient');

const PROMPT_DIR = path.resolve(__dirname, '../../prompts/aiax/prompt-engine');

const PROMPT_FILES = {
  system: 'system.md',
  synopsis: '01-synopsis.md',
  screenplay: '02-screenplay.md',
  qaqc: '03-qaqc.md',
};

const STEP_CONFIG = {
  synopsis: {
    sceneKey: 'prompt_engine_synopsis',
    minTokens: 1800,
    temperature: 0.75,
    requiredInput: 'raw_idea',
    missingMessage: 'Thiếu ý tưởng thô để tạo Synopsis',
  },
  screenplay: {
    sceneKey: 'prompt_engine_screenplay',
    minTokens: 4500,
    temperature: 0.72,
    requiredInput: 'synopsis',
    missingMessage: 'Thiếu Synopsis/Pitch Deck để tạo Screenplay',
  },
  qaqc: {
    sceneKey: 'prompt_engine_qaqc',
    minTokens: 2200,
    temperature: 0.25,
    requiredInput: 'screenplay',
    missingMessage: 'Thiếu Screenplay để chạy QAQC',
  },
};

const FALLBACK_PROMPTS = {
  system: [
    'Bạn là AI Script Development Engine chuyên nghiệp của AIAX.Studio.',
    'Viết bằng tiếng Việt, chỉ giữ thuật ngữ chuyên ngành bằng tiếng Anh khi cần.',
    'Luôn bám AIAX SOP: một câu Action = một shot, Action phải tả thực, dùng The Set khi viết screenplay.',
  ].join('\n'),
  synopsis: 'PROMPT 01: GENERATE SYNOPSIS\n\nÝ tưởng thô:\n{{raw_idea}}',
  screenplay: 'PROMPT 02: GENERATE SCREENPLAY\n\nThời lượng mục tiêu: {{target_duration}}\n\nPitch Deck / Synopsis:\n{{synopsis}}',
  qaqc: 'PROMPT 03: QAQC SCREENPLAY\n\nScreenplay:\n{{screenplay}}',
};

function readPromptFile(key) {
  const file = PROMPT_FILES[key];
  if (!file) return FALLBACK_PROMPTS[key] || '';
  try {
    return fs.readFileSync(path.join(PROMPT_DIR, file), 'utf8');
  } catch (_) {
    return FALLBACK_PROMPTS[key] || '';
  }
}

function renderTemplate(template, values) {
  return String(template || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return values[key] == null ? '' : String(values[key]);
  });
}

function normalizeInput(input = {}) {
  return {
    raw_idea: String(input.raw_idea || '').trim(),
    synopsis: String(input.synopsis || '').trim(),
    screenplay: String(input.screenplay || '').trim(),
    target_duration: String(input.target_duration || '3 phút').trim(),
  };
}

function buildPrompt(step, input = {}) {
  const cfg = STEP_CONFIG[step];
  if (!cfg) throw new Error('Prompt Engine step không hợp lệ');

  const values = normalizeInput(input);
  if (!values[cfg.requiredInput]) throw new Error(cfg.missingMessage);

  return {
    sceneKey: cfg.sceneKey,
    minTokens: cfg.minTokens,
    temperature: cfg.temperature,
    userPrompt: renderTemplate(readPromptFile(step), values),
  };
}

function extractScore(text) {
  const m = String(text || '').match(/(?:score|điểm|diem)\D{0,20}(\d{1,2})\s*\/\s*50/i)
    || String(text || '').match(/(\d{1,2})\s*\/\s*50/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.max(0, Math.min(50, n)) : null;
}

async function runPromptEngine(db, log, body = {}) {
  const step = String(body.step || '').trim();
  const prompt = buildPrompt(step, body.input || {});
  const systemPrompt = readPromptFile('system');
  const output = await aiClient.generateText(db, log, 'text', prompt.userPrompt, systemPrompt, {
    scene_key: prompt.sceneKey,
    model: body.model || undefined,
    temperature: prompt.temperature,
    min_max_tokens: prompt.minTokens,
  });
  return {
    step,
    output,
    score: step === 'qaqc' ? extractScore(output) : null,
  };
}

module.exports = {
  runPromptEngine,
};
