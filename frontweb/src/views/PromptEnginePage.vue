<template>
  <div class="prompt-engine-page">
    <header class="pe-header">
      <button class="back-btn" type="button" @click="router.push(dramaId ? `/film/${dramaId}` : '/')">
        <el-icon><ArrowLeft /></el-icon>
      </button>
      <div>
        <p class="eyebrow">AIAX Prompt Engine</p>
        <h1>Xưởng phát triển kịch bản</h1>
        <p>{{ drama?.title || 'Dự án chưa tải' }}</p>
      </div>
      <div class="header-actions">
        <el-button @click="router.push('/workflow')">
          <el-icon><Guide /></el-icon>
          Xem quy trình
        </el-button>
        <el-button :disabled="!dramaId" @click="router.push(`/pipeline/${dramaId}`)">
          Pipeline
        </el-button>
        <el-button type="primary" :disabled="!dramaId" @click="router.push(`/film/${dramaId}`)">
          Vào phòng LAB
        </el-button>
      </div>
    </header>

    <main v-loading="loading" class="pe-main">
      <section class="pe-context">
        <div>
          <h2>Input dự án</h2>
          <p>Prompt Engine dùng dữ liệu này để chạy đúng 3 bước từ tài liệu AIAX.</p>
        </div>
        <div class="context-grid">
          <label>
            <span>Ý tưởng thô</span>
            <el-input v-model="engine.raw_idea" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" />
          </label>
          <label>
            <span>Tập áp dụng screenplay</span>
            <el-select v-model="selectedEpisodeId" style="width: 100%">
              <el-option
                v-for="ep in episodes"
                :key="ep.id"
                :label="ep.title || `Tập ${ep.episode_number || ep.id}`"
                :value="ep.id"
              />
            </el-select>
          </label>
          <label>
            <span>Thời lượng mục tiêu</span>
            <el-input v-model="engine.target_duration" placeholder="Ví dụ: 3 phút" />
          </label>
        </div>
      </section>

      <section class="pe-steps">
        <article v-for="step in steps" :key="step.id" class="pe-step">
          <div class="step-head">
            <div>
              <p class="step-index">{{ step.index }}</p>
              <h2>{{ step.title }}</h2>
              <span>{{ step.desc }}</span>
            </div>
            <el-button type="primary" :loading="runningStep === step.id" @click="runStep(step.id)">
              Chạy bước này
            </el-button>
          </div>
          <el-input
            v-model="engine[step.field]"
            type="textarea"
            :autosize="{ minRows: step.minRows, maxRows: 18 }"
            :placeholder="step.placeholder"
            @blur="saveEngine({ silent: true, reload: false })"
          />
          <div class="step-actions">
            <el-tag v-if="step.id === 'qaqc' && engine.qaqc_score != null" :type="engine.qaqc_score >= 40 ? 'success' : 'danger'">
              QAQC {{ engine.qaqc_score }}/50
            </el-tag>
            <el-button v-if="step.id === 'screenplay'" plain type="success" :disabled="!engine.screenplay_output?.trim() || !selectedEpisodeId" @click="applyScreenplay">
              Áp dụng vào script tập
            </el-button>
            <el-button v-if="step.id === 'qaqc'" plain type="warning" :disabled="!canSuggestScriptLock" @click="suggestScriptLock">
              Đề xuất Script Lock
            </el-button>
          </div>
        </article>
      </section>

      <section class="save-bar">
        <p>Dữ liệu được lưu vào metadata của project, không ghi đè script cho tới khi anh bấm “Áp dụng vào script tập”.</p>
        <div>
          <el-button @click="loadDrama">Tải lại</el-button>
          <el-button type="primary" :loading="saving" @click="saveEngine()">Lưu Prompt Engine</el-button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Guide } from '@element-plus/icons-vue'
import { dramaAPI } from '@/api/drama'
import { generationAPI } from '@/api/generation'
import { scriptDocumentsAPI } from '@/api/scriptDocuments'
import { pipelineAPI } from '@/api/pipeline'
import { getPipelineStateFromDrama, normalizePipelineState } from '@/utils/aiaxPipeline'

const route = useRoute()
const router = useRouter()
const dramaId = computed(() => route.params.id ? Number(route.params.id) : null)
const drama = ref(null)
const loading = ref(false)
const saving = ref(false)
const runningStep = ref('')
const selectedEpisodeId = ref(null)
const engine = ref(defaultEngine())
const documentIds = ref({})

const steps = [
  { id: 'synopsis', index: 'Prompt 01', title: 'Generate Synopsis', desc: 'Ý tưởng thô -> Pitch Deck', field: 'synopsis_output', minRows: 8, placeholder: 'Output: Title, Tagline, Logline, Vision, Synopsis, Hook Check' },
  { id: 'screenplay', index: 'Prompt 02', title: 'Generate Screenplay', desc: 'Pitch Deck -> Screenplay theo The Set', field: 'screenplay_output', minRows: 12, placeholder: 'Output screenplay theo AIAX SOP' },
  { id: 'qaqc', index: 'Prompt 03', title: 'QAQC Screenplay', desc: 'Chấm điểm /50 và tìm lỗi đỏ/vàng', field: 'qaqc_report', minRows: 8, placeholder: 'Output QAQC Report' },
]

const episodes = computed(() => drama.value?.episodes || [])
const selectedEpisode = computed(() => episodes.value.find((ep) => Number(ep.id) === Number(selectedEpisodeId.value)) || episodes.value[0] || null)
const canSuggestScriptLock = computed(() => Number(engine.value.qaqc_score) >= 40 && !/lỗi đỏ|mục đỏ|đỏ/i.test(engine.value.qaqc_report || ''))

function defaultEngine() {
  return {
    version: 1,
    raw_idea: '',
    target_duration: '3 phút',
    synopsis_output: '',
    screenplay_output: '',
    qaqc_report: '',
    qaqc_score: null,
    last_run_at: null,
  }
}

function getSavedEngine(d) {
  return {
    ...defaultEngine(),
    ...(d?.metadata?.step_data?.prompt_engine || d?.metadata?.prompt_engine || {}),
  }
}

async function loadDrama() {
  if (!dramaId.value) return
  loading.value = true
  try {
    const d = await dramaAPI.get(dramaId.value)
    drama.value = d
    const saved = getSavedEngine(d)
    engine.value = {
      ...saved,
      raw_idea: saved.raw_idea || d.description || '',
    }
    selectedEpisodeId.value = selectedEpisodeId.value || d.episodes?.[0]?.id || null
    await loadScriptDocuments()
  } catch (e) {
    ElMessage.error(e.message || 'Không tải được Prompt Engine')
  } finally {
    loading.value = false
  }
}

async function loadScriptDocuments() {
  if (!dramaId.value) return
  const res = await scriptDocumentsAPI.latest(dramaId.value, { episode_id: selectedEpisodeId.value || 0 })
  const docs = res?.items || {}
  documentIds.value = {}
  if (docs.raw_idea?.content) {
    engine.value.raw_idea = docs.raw_idea.content
    documentIds.value.raw_idea = docs.raw_idea.id
  }
  if (docs.synopsis?.content) {
    engine.value.synopsis_output = docs.synopsis.content
    documentIds.value.synopsis = docs.synopsis.id
  }
  if (docs.screenplay?.content) {
    engine.value.screenplay_output = docs.screenplay.content
    documentIds.value.screenplay = docs.screenplay.id
  }
  if (docs.qaqc?.content) {
    engine.value.qaqc_report = docs.qaqc.content
    engine.value.qaqc_score = docs.qaqc.score ?? engine.value.qaqc_score
    documentIds.value.qaqc = docs.qaqc.id
  }
}

async function runStep(step) {
  runningStep.value = step
  try {
    const res = await generationAPI.runPromptEngine({
      step,
      input: {
        raw_idea: engine.value.raw_idea,
        synopsis: engine.value.synopsis_output,
        screenplay: engine.value.screenplay_output,
        target_duration: engine.value.target_duration,
      },
    })
    if (step === 'synopsis') engine.value.synopsis_output = res.output || ''
    if (step === 'screenplay') engine.value.screenplay_output = res.output || ''
    if (step === 'qaqc') {
      engine.value.qaqc_report = res.output || ''
      engine.value.qaqc_score = res.score ?? null
    }
    engine.value.last_run_at = new Date().toISOString()
    await createScriptDocumentForStep(step, res)
    await saveEngine({ silent: true, reload: false })
    ElMessage.success('Prompt Engine đã chạy xong')
  } catch (e) {
    ElMessage.error(e.message || 'Prompt Engine lỗi')
  } finally {
    runningStep.value = ''
  }
}

async function createScriptDocumentForStep(step, res = {}) {
  const docType = step === 'synopsis' ? 'synopsis' : step === 'screenplay' ? 'screenplay' : 'qaqc'
  const content = docType === 'synopsis'
    ? engine.value.synopsis_output
    : docType === 'screenplay'
      ? engine.value.screenplay_output
      : engine.value.qaqc_report
  const doc = await scriptDocumentsAPI.create(dramaId.value, {
    episode_id: selectedEpisodeId.value || 0,
    doc_type: docType,
    title: docType === 'synopsis' ? 'Pitch Deck / Synopsis' : docType === 'screenplay' ? 'Screenplay' : 'QAQC Report',
    content,
    status: docType === 'qaqc' && Number(res.score) >= 40 ? 'passed' : 'draft',
    score: docType === 'qaqc' ? res.score : null,
    source: 'prompt_engine',
    metadata: {
      target_duration: engine.value.target_duration,
      created_from_step: step,
    },
  })
  documentIds.value[docType] = doc.id
}

async function saveEngine(options = {}) {
  if (!dramaId.value) return
  const silent = !!options.silent
  const reload = options.reload !== false
  saving.value = true
  try {
    await upsertEditableDocuments()
    await dramaAPI.saveProgress(dramaId.value, {
      current_step: 'prompt_engine',
      step_data: {
        ...(drama.value?.metadata?.step_data || {}),
        prompt_engine: engine.value,
      },
    })
    if (!silent) ElMessage.success('Đã lưu Prompt Engine')
    if (reload) await loadDrama()
  } catch (e) {
    if (!silent) ElMessage.error(e.message || 'Không lưu được Prompt Engine')
  } finally {
    saving.value = false
  }
}

async function upsertEditableDocuments() {
  const docs = [
    { key: 'raw_idea', title: 'Raw Idea', content: engine.value.raw_idea },
  ]
  for (const doc of docs) {
    if (!String(doc.content || '').trim()) continue
    if (documentIds.value[doc.key]) {
      await scriptDocumentsAPI.update(documentIds.value[doc.key], {
        title: doc.title,
        content: doc.content,
        status: 'draft',
        source: 'prompt_engine',
      })
    } else {
      const created = await scriptDocumentsAPI.create(dramaId.value, {
        episode_id: selectedEpisodeId.value || 0,
        doc_type: doc.key,
        title: doc.title,
        content: doc.content,
        status: 'draft',
        source: 'prompt_engine',
      })
      documentIds.value[doc.key] = created.id
    }
  }
}

async function applyScreenplay() {
  const ep = selectedEpisode.value
  const text = (engine.value.screenplay_output || '').trim()
  if (!ep || !text) return
  const payload = episodes.value.map((item) => ({
    episode_number: item.episode_number,
    title: item.id === ep.id ? (item.title || 'Tập 1') : item.title,
    script_content: item.id === ep.id ? text : (item.script_content || ''),
    description: item.description,
    duration: item.duration,
  }))
  await dramaAPI.saveEpisodes(dramaId.value, payload)
  await saveEngine({ silent: true, reload: false })
  ElMessage.success('Đã áp dụng screenplay vào script tập')
  await loadDrama()
}

async function suggestScriptLock() {
  if (!drama.value) return
  const pipeline = getPipelineStateFromDrama(drama.value)
  const next = normalizePipelineState(pipeline)
  next.gates.script_lock.status = 'done'
  next.gates.script_lock.note = `QAQC đạt ${engine.value.qaqc_score}/50 từ Prompt Engine.`
  next.gates.script_lock.updated_at = new Date().toISOString()
  await pipelineAPI.saveStep(dramaId.value, 'script_lock', {
    title: 'Script Lock',
    status: 'done',
    note: next.gates.script_lock.note,
    metadata: {
      source: 'prompt_engine',
      qaqc_score: engine.value.qaqc_score,
    },
  })
  await dramaAPI.saveProgress(dramaId.value, {
    current_step: 'script_lock',
    step_data: {
      ...(drama.value?.metadata?.step_data || {}),
      prompt_engine: engine.value,
      aiax_pipeline: next,
    },
  })
  ElMessage.success('Đã đề xuất Script Lock trong Pipeline')
  await loadDrama()
}

loadDrama()

watch(selectedEpisodeId, async (next, prev) => {
  if (next && prev && next !== prev) {
    await loadScriptDocuments()
  }
})
</script>

<style scoped>
.prompt-engine-page {
  min-height: 100vh;
  background: #f6f7fb;
  color: #172033;
}

.pe-header,
.pe-main {
  max-width: 1220px;
  margin: 0 auto;
}

.pe-header {
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

.pe-header h1 {
  margin: 0;
  font-size: 30px;
}

.pe-header p {
  margin: 6px 0 0;
  color: #667085;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pe-main {
  display: grid;
  gap: 16px;
  padding: 0 20px 36px;
}

.pe-context,
.pe-step,
.save-bar {
  border: 1px solid #e2e7f0;
  border-radius: 8px;
  background: #fff;
  padding: 18px;
}

.pe-context h2,
.step-head h2 {
  margin: 0;
}

.pe-context p,
.step-head span,
.save-bar p {
  margin: 6px 0 0;
  color: #667085;
  line-height: 1.5;
}

.context-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px 180px;
  gap: 14px;
  margin-top: 16px;
}

.context-grid label,
.pe-step {
  display: grid;
  gap: 8px;
}

.context-grid span {
  color: #344054;
  font-size: 13px;
  font-weight: 700;
}

.pe-steps {
  display: grid;
  gap: 14px;
}

.step-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.step-index {
  margin: 0 0 4px;
  color: #7c3aed;
  font-size: 12px;
  font-weight: 800;
}

.step-actions,
.save-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.save-bar > div {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .pe-header,
  .context-grid {
    grid-template-columns: 1fr;
  }

  .step-head,
  .save-bar {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
