export const KIE_VEO31_MODEL_PRESETS = [
  {
    label: 'Veo 3.1 Lite',
    value: 'veo3_lite',
    durations: [4, 6, 8],
    resolutions: ['720p', '1080p'],
    aspectRatios: ['Auto', '16:9', '9:16'],
  },
  {
    label: 'Veo 3.1 Fast',
    value: 'veo3_fast',
    durations: [4, 6, 8],
    resolutions: ['720p', '1080p', '4k'],
    aspectRatios: ['Auto', '16:9', '9:16'],
  },
  {
    label: 'Veo 3.1 Quality',
    value: 'veo3',
    durations: [4, 6, 8],
    resolutions: ['720p', '1080p', '4k'],
    aspectRatios: ['Auto', '16:9', '9:16'],
  },
]

export const DEFAULT_KIE_VEO31_OPTIONS = {
  model: 'veo3_fast',
  generationType: 'IMAGE_TO_VIDEO',
  duration: 8,
  resolution: '1080p',
  aspectRatio: '16:9',
  enableTranslation: true,
  enableFallback: false,
  watermark: '',
}

export function isKieVeo31Model(model) {
  const m = String(model || '').trim().toLowerCase()
  return m === 'veo3' || m === 'veo3_fast' || m === 'veo3_lite' || m === 'veo3_quality'
}

export function getKieVeo31Preset(model) {
  const m = String(model || '').trim().toLowerCase()
  return KIE_VEO31_MODEL_PRESETS.find((p) => p.value.toLowerCase() === m)
    || KIE_VEO31_MODEL_PRESETS.find((p) => p.value === DEFAULT_KIE_VEO31_OPTIONS.model)
}

export function normalizeKieVeo31Options(input = {}) {
  const base = { ...DEFAULT_KIE_VEO31_OPTIONS, ...(input || {}) }
  const preset = getKieVeo31Preset(base.model)
  const duration = Number(base.duration)
  const resolution = String(base.resolution || '').trim().toLowerCase()
  const aspectRatio = String(base.aspectRatio || base.aspect_ratio || '').trim()
  return {
    ...base,
    model: preset.value,
    generationType: 'IMAGE_TO_VIDEO',
    duration: preset.durations.includes(duration) ? duration : DEFAULT_KIE_VEO31_OPTIONS.duration,
    resolution: preset.resolutions.includes(resolution) ? resolution : preset.resolutions[0],
    aspectRatio: preset.aspectRatios.includes(aspectRatio) ? aspectRatio : DEFAULT_KIE_VEO31_OPTIONS.aspectRatio,
    enableTranslation: base.enableTranslation !== false,
    enableFallback: base.enableFallback === true,
    watermark: String(base.watermark || '').slice(0, 200),
  }
}
