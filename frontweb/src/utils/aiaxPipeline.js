export const AIAxPipelineStatus = {
  PENDING: 'pending',
  DONE: 'done',
  WAIVED: 'waived',
}

export const AIAxPipelineGates = [
  {
    id: 'script_lock',
    title: 'Script Lock',
    label: 'Khóa kịch bản',
    after: 'Screenplay V2',
    blocks: ['storyboard'],
    rule: 'Trước khi tạo storyboard, kịch bản cần được duyệt để tránh đổi story, beat hoặc thoại ngược quy trình.',
  },
  {
    id: 'storyboard_lock',
    title: 'Storyboard Lock',
    label: 'Khóa storyboard',
    after: 'Storyboard FINAL',
    blocks: ['batch_video'],
    rule: 'Trước khi gen video hàng loạt, shot list và storyboard cần được duyệt.',
  },
  {
    id: 'test_shots',
    title: 'Test Shots',
    label: 'Duyệt test shots',
    after: '3-5 shot thử',
    blocks: ['batch_video'],
    rule: 'Trước batch generation nên có test shots để kiểm tra model, style, motion setting và negative prompt.',
  },
  {
    id: 'shot_qc',
    title: 'Shot QC',
    label: 'Duyệt shot QC',
    after: 'Main Shots',
    blocks: ['final_video'],
    rule: 'Trước khi tổng hợp video, các shot cần được kiểm tra best take và lỗi re-gen.',
  },
  {
    id: 'picture_lock',
    title: 'Picture Lock',
    label: 'Khóa bản dựng',
    after: 'Fine Cut',
    blocks: ['final_video'],
    rule: 'Trước khi export master, cấu trúc dựng cần được khóa để tránh sửa ngược.',
  },
  {
    id: 'signoff',
    title: 'Sign-off',
    label: 'Duyệt bàn giao',
    after: 'Creative approval',
    blocks: [],
    rule: 'Sau khi duyệt creative, chỉ export master và bàn giao đúng định dạng.',
  },
]

export function createDefaultPipelineState() {
  return {
    version: 1,
    current_step: 'idea',
    gates: Object.fromEntries(AIAxPipelineGates.map((gate) => [gate.id, {
      status: AIAxPipelineStatus.PENDING,
      note: '',
      updated_at: null,
    }])),
    notes: '',
  }
}

export function normalizePipelineState(raw) {
  const base = createDefaultPipelineState()
  if (!raw || typeof raw !== 'object') return base
  const gates = { ...base.gates }
  for (const gate of AIAxPipelineGates) {
    const src = raw.gates?.[gate.id] || raw[gate.id]
    if (!src || typeof src !== 'object') continue
    gates[gate.id] = {
      status: src.status || base.gates[gate.id].status,
      note: src.note || '',
      updated_at: src.updated_at || null,
    }
  }
  return {
    ...base,
    ...raw,
    gates,
  }
}

export function getPipelineStateFromDrama(drama) {
  const metadata = drama?.metadata || {}
  return normalizePipelineState(metadata.step_data?.aiax_pipeline || metadata.aiax_pipeline)
}

export function isPipelineGateDone(state, gateId) {
  const status = normalizePipelineState(state).gates?.[gateId]?.status
  return status === AIAxPipelineStatus.DONE || status === AIAxPipelineStatus.WAIVED
}

export function getMissingPipelineGates(state, action) {
  const normalized = normalizePipelineState(state)
  return AIAxPipelineGates.filter((gate) => gate.blocks.includes(action) && !isPipelineGateDone(normalized, gate.id))
}

export function derivePipelineSignals(drama, episode, helpers = {}) {
  const storyboards = episode?.storyboards || []
  const hasScript = !!String(episode?.script_content || '').trim()
  const hasStoryboards = storyboards.length > 0
  const hasStoryboardImages = hasStoryboards && storyboards.some((sb) => helpers.hasSbImage?.(sb))
  const allStoryboardImages = hasStoryboards && storyboards.every((sb) => helpers.hasSbImage?.(sb))
  const hasStoryboardVideos = hasStoryboards && storyboards.some((sb) => helpers.hasSbVideo?.(sb))
  const allStoryboardVideos = hasStoryboards && storyboards.every((sb) => helpers.hasSbVideo?.(sb))
  const hasFinalVideo = !!(episode?.video_url || episode?.final_video_url || episode?.merged_video_url || episode?.video_local_path)
  return {
    hasScript,
    hasStoryboards,
    hasStoryboardImages,
    allStoryboardImages,
    hasStoryboardVideos,
    allStoryboardVideos,
    hasFinalVideo,
    projectTitle: drama?.title || '',
  }
}
