<template>
  <div class="pipeline-page">
    <header class="pipeline-header">
      <button class="back-btn" type="button" @click="router.push(dramaId ? `/film/${dramaId}` : '/')">
        <el-icon><ArrowLeft /></el-icon>
      </button>
      <div>
        <p class="eyebrow">AIAX Pipeline</p>
        <h1>Pipeline sản xuất</h1>
        <p>{{ drama?.title || 'Dự án chưa tải' }}</p>
      </div>
      <div class="header-actions">
        <el-button @click="router.push('/workflow')">
          <el-icon><Guide /></el-icon>
          Xem quy trình
        </el-button>
        <el-button type="primary" :disabled="!dramaId" @click="router.push(`/film/${dramaId}`)">
          <el-icon><VideoPlay /></el-icon>
          Vào phòng LAB
        </el-button>
      </div>
    </header>

    <main v-loading="loading" class="pipeline-main">
      <section class="signal-grid">
        <article v-for="signal in signals" :key="signal.key" class="signal-card" :class="{ done: signal.done }">
          <span>{{ signal.label }}</span>
          <strong>{{ signal.done ? 'Đã có' : 'Chưa đủ' }}</strong>
          <p>{{ signal.hint }}</p>
        </article>
      </section>

      <section class="pipeline-board">
        <div class="board-heading">
          <div>
            <h2>Gate vận hành</h2>
            <p>Đây là các điểm kiểm soát mềm gắn vào luồng gen hiện tại. Nếu gate chưa đạt, app sẽ cảnh báo trước khi chạy bước tốn token/API.</p>
          </div>
          <el-tag effect="plain">{{ completedCount }}/{{ AIAxPipelineGates.length }} gate</el-tag>
        </div>

        <article v-for="gate in AIAxPipelineGates" :key="gate.id" class="gate-row">
          <div class="gate-status">
            <el-icon v-if="state.gates[gate.id]?.status === 'done'" class="status-done"><Check /></el-icon>
            <el-icon v-else-if="state.gates[gate.id]?.status === 'waived'" class="status-waived"><WarningFilled /></el-icon>
            <span v-else class="status-pending" />
          </div>
          <div class="gate-body">
            <div class="gate-top">
              <div>
                <h3>{{ gate.title }}</h3>
                <p>{{ gate.label }} · sau bước {{ gate.after }}</p>
              </div>
              <el-select v-model="state.gates[gate.id].status" size="small" style="width: 150px" @change="onGateChanged(gate.id)">
                <el-option label="Chưa đạt" value="pending" />
                <el-option label="Đã duyệt" value="done" />
                <el-option label="Bỏ qua có lý do" value="waived" />
              </el-select>
            </div>
            <p class="gate-rule">{{ gate.rule }}</p>
            <el-input
              v-model="state.gates[gate.id].note"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder="Ghi chú duyệt, lỗi cần sửa hoặc lý do bỏ qua gate"
              @change="onGateChanged(gate.id)"
              @blur="onGateChanged(gate.id)"
            />
          </div>
        </article>
      </section>

      <section class="pipeline-actions">
        <el-input
          v-model="state.notes"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }"
          placeholder="Ghi chú chung cho pipeline của project"
          @blur="savePipeline({ silent: true, reload: false })"
        />
        <div>
          <el-button @click="loadDrama">Tải lại</el-button>
          <el-button type="primary" :loading="saving" @click="savePipeline">Lưu Pipeline</el-button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check, Guide, VideoPlay, WarningFilled } from '@element-plus/icons-vue'
import { dramaAPI } from '@/api/drama'
import { pipelineAPI } from '@/api/pipeline'
import {
  AIAxPipelineGates,
  AIAxPipelineStatus,
  derivePipelineSignals,
  getPipelineStateFromDrama,
  normalizePipelineState,
} from '@/utils/aiaxPipeline'

const route = useRoute()
const router = useRouter()
const dramaId = computed(() => route.params.id ? Number(route.params.id) : null)
const drama = ref(null)
const state = ref(normalizePipelineState())
const stepRows = ref([])
const loading = ref(false)
const saving = ref(false)

const currentEpisode = computed(() => drama.value?.episodes?.[0] || null)
const derived = computed(() => derivePipelineSignals(drama.value, currentEpisode.value, {
  hasSbImage: (sb) => !!(sb.image_url || sb.image_local_path || sb.first_frame_url || sb.first_frame_local_path),
  hasSbVideo: (sb) => !!(sb.video_url || sb.local_path || sb.video_local_path),
}))
const signals = computed(() => [
  { key: 'script', label: 'Kịch bản', done: derived.value.hasScript, hint: 'Dùng cho Script Lock và Prompt Engine.' },
  { key: 'storyboard', label: 'Storyboard', done: derived.value.hasStoryboards, hint: 'Dùng cho Storyboard Lock.' },
  { key: 'images', label: 'Ảnh phân cảnh', done: derived.value.allStoryboardImages, hint: 'Cần trước khi gen video i2v.' },
  { key: 'videos', label: 'Video phân cảnh', done: derived.value.allStoryboardVideos, hint: 'Cần trước khi tổng hợp video.' },
  { key: 'final', label: 'Bản tổng hợp', done: derived.value.hasFinalVideo, hint: 'Dùng cho Picture Lock và Sign-off.' },
])
const completedCount = computed(() =>
  AIAxPipelineGates.filter((gate) => {
    const status = state.value.gates?.[gate.id]?.status
    return status === AIAxPipelineStatus.DONE || status === AIAxPipelineStatus.WAIVED
  }).length
)

function markGateTouched(gateId) {
  const gate = state.value.gates?.[gateId]
  if (gate) gate.updated_at = new Date().toISOString()
}

async function onGateChanged(gateId) {
  markGateTouched(gateId)
  await saveGate(gateId, { silent: true })
  await syncPipelineMetadata({ silent: true })
}

async function loadDrama() {
  if (!dramaId.value) return
  loading.value = true
  try {
    const d = await dramaAPI.get(dramaId.value)
    drama.value = d
    const res = await pipelineAPI.listSteps(dramaId.value)
    stepRows.value = res?.items || []
    state.value = pipelineRowsToState(stepRows.value, getPipelineStateFromDrama(d))
  } catch (e) {
    ElMessage.error(e.message || 'Không tải được Pipeline')
  } finally {
    loading.value = false
  }
}

function pipelineRowsToState(rows, fallback) {
  const next = normalizePipelineState(fallback)
  for (const row of rows || []) {
    if (!next.gates[row.step_key]) continue
    next.gates[row.step_key] = {
      status: row.status || 'pending',
      note: row.note || '',
      updated_at: row.updated_at || null,
    }
  }
  return next
}

async function saveGate(gateId, options = {}) {
  if (!dramaId.value) return
  const gateDef = AIAxPipelineGates.find((item) => item.id === gateId)
  const gate = state.value.gates?.[gateId]
  if (!gate) return
  try {
    const row = await pipelineAPI.saveStep(dramaId.value, gateId, {
      title: gateDef?.title || gateId,
      status: gate.status,
      note: gate.note || '',
      metadata: {
        label: gateDef?.label,
        after: gateDef?.after,
        rule: gateDef?.rule,
      },
    })
    const idx = stepRows.value.findIndex((item) => item.step_key === gateId)
    if (idx >= 0) stepRows.value.splice(idx, 1, row)
    else stepRows.value.push(row)
    if (!options.silent) ElMessage.success('Đã lưu gate')
  } catch (e) {
    if (!options.silent) ElMessage.error(e.message || 'Không lưu được gate')
  }
}

async function savePipeline(options = {}) {
  if (!dramaId.value) return
  const silent = !!options.silent
  const reload = options.reload !== false
  saving.value = true
  try {
    for (const gate of AIAxPipelineGates) {
      await saveGate(gate.id, { silent: true })
    }
    await syncPipelineMetadata({ silent: true })
    if (!silent) ElMessage.success('Đã lưu Pipeline')
    if (reload) await loadDrama()
  } catch (e) {
    if (!silent) ElMessage.error(e.message || 'Không lưu được Pipeline')
  } finally {
    saving.value = false
  }
}

async function syncPipelineMetadata() {
  const normalized = normalizePipelineState(state.value)
  await dramaAPI.saveProgress(dramaId.value, {
    current_step: normalized.current_step || 'pipeline',
    step_data: {
      ...(drama.value?.metadata?.step_data || {}),
      aiax_pipeline: normalized,
    },
  })
  state.value = normalized
}

loadDrama()
</script>

<style scoped>
.pipeline-page {
  min-height: 100vh;
  background: #f6f7fb;
  color: #172033;
}

.pipeline-header,
.pipeline-main {
  max-width: 1220px;
  margin: 0 auto;
}

.pipeline-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 28px 20px 18px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #dce2ec;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.eyebrow {
  margin: 0 0 4px;
  color: #7c3aed;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.pipeline-header h1 {
  margin: 0;
  font-size: 30px;
}

.pipeline-header p {
  margin: 6px 0 0;
  color: #667085;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pipeline-main {
  display: grid;
  gap: 18px;
  padding: 0 20px 36px;
}

.signal-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.signal-card,
.pipeline-board,
.pipeline-actions {
  border: 1px solid #e2e7f0;
  border-radius: 8px;
  background: #fff;
}

.signal-card {
  padding: 14px;
}

.signal-card span {
  color: #667085;
  font-size: 13px;
}

.signal-card strong {
  display: block;
  margin-top: 8px;
  color: #b42318;
}

.signal-card.done strong {
  color: #16803c;
}

.signal-card p {
  margin: 8px 0 0;
  color: #667085;
  font-size: 12px;
  line-height: 1.45;
}

.pipeline-board {
  padding: 18px;
}

.board-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #edf0f5;
}

.board-heading h2 {
  margin: 0;
}

.board-heading p {
  margin: 6px 0 0;
  color: #667085;
  line-height: 1.5;
}

.gate-row {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid #edf0f5;
}

.gate-row:last-child {
  border-bottom: 0;
}

.gate-status {
  padding-top: 3px;
}

.status-pending {
  display: block;
  width: 20px;
  height: 20px;
  border: 2px solid #d0d5dd;
  border-radius: 50%;
}

.status-done {
  color: #16a34a;
  font-size: 22px;
}

.status-waived {
  color: #f59e0b;
  font-size: 22px;
}

.gate-top {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.gate-top h3 {
  margin: 0;
}

.gate-top p,
.gate-rule {
  margin: 5px 0 0;
  color: #667085;
  line-height: 1.5;
}

.gate-rule {
  margin: 10px 0;
}

.pipeline-actions {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.pipeline-actions > div {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 900px) {
  .pipeline-header,
  .signal-grid,
  .gate-top {
    grid-template-columns: 1fr;
  }

  .pipeline-header {
    display: grid;
  }

  .signal-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .signal-grid {
    grid-template-columns: 1fr;
  }

  .pipeline-header {
    padding-top: 18px;
  }
}
</style>
