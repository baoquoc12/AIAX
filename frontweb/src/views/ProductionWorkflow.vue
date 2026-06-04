<template>
  <div class="workflow-page">
    <header class="workflow-header">
      <div>
        <button class="back-btn" type="button" @click="router.push('/')">
          <el-icon><ArrowLeft /></el-icon>
        </button>
      </div>
      <div class="workflow-title-block">
        <p class="eyebrow">AIAX Studio SOP</p>
        <h1>Quy trình sản xuất</h1>
        <p class="subtitle">
          Phòng LAB dựng phim theo quy trình, Prompt Engine và rule sản xuất từ bộ tài liệu AIAX.
        </p>
      </div>
      <div class="workflow-actions">
        <el-button @click="copyPromptBundle">
          <el-icon><DocumentCopy /></el-icon>
          Sao chép bộ prompt
        </el-button>
        <el-button type="primary" @click="router.push('/film/new')">
          <el-icon><VideoPlay /></el-icon>
          Mở phòng LAB
        </el-button>
      </div>
    </header>

    <main class="workflow-main">
      <section class="source-strip">
        <article v-for="doc in workflowDocuments" :key="doc.id" class="source-item">
          <div class="source-role">{{ doc.role }}</div>
          <h2>{{ doc.title }}</h2>
          <p>{{ doc.summary }}</p>
          <span>{{ doc.source }}</span>
        </article>
      </section>

      <section class="metric-row">
        <div class="metric">
          <span>{{ totalSteps }}</span>
          <p>bước kiểm soát</p>
        </div>
        <div class="metric">
          <span>{{ lockPoints.length }}</span>
          <p>điểm lock</p>
        </div>
        <div class="metric">
          <span>3</span>
          <p>lượt prompt</p>
        </div>
        <div class="metric">
          <span>50</span>
          <p>điểm QAQC</p>
        </div>
      </section>

      <el-tabs v-model="activeTab" class="workflow-tabs">
        <el-tab-pane label="Pipeline" name="pipeline">
          <section class="pipeline-layout">
            <aside class="stage-nav">
              <button
                v-for="stage in pipelineStages"
                :key="stage.id"
                class="stage-nav-btn"
                :class="{ active: selectedStageId === stage.id }"
                type="button"
                @click="selectedStageId = stage.id"
              >
                <strong>{{ stage.title }}</strong>
                <span>{{ stage.estimate }}</span>
              </button>
            </aside>

            <div class="stage-panel">
              <div class="stage-heading">
                <div>
                  <p class="eyebrow">{{ selectedStage.estimate }}</p>
                  <h2>{{ selectedStage.title }}</h2>
                </div>
                <el-tag effect="plain">{{ selectedStageStepCount }} bước</el-tag>
              </div>

              <section v-for="section in selectedStage.sections" :key="section.id" class="workflow-section">
                <h3>{{ section.title }}</h3>
                <div class="step-list">
                  <article v-for="step in section.steps" :key="`${section.id}-${step.no}`" class="step-card">
                    <div class="step-index">
                      <span>{{ step.no }}</span>
                      <el-tag v-if="step.gate" :type="tagType(step.gate)" size="small" effect="light">{{ step.gate }}</el-tag>
                    </div>
                    <div class="step-body">
                      <h4>{{ step.name }}</h4>
                      <p class="step-action">{{ step.action }}</p>
                      <div class="io-grid">
                        <div>
                          <span>Input</span>
                          <p>{{ step.input }}</p>
                        </div>
                        <div>
                          <span>Output</span>
                          <p>{{ step.output }}</p>
                        </div>
                        <div>
                          <span>Nhân sự</span>
                          <p>{{ step.owner }}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              </section>
            </div>
          </section>
        </el-tab-pane>

        <el-tab-pane label="Prompt Engine" name="prompt-engine">
          <section class="prompt-engine-grid">
            <article v-for="prompt in promptEngineSteps" :key="prompt.id" class="prompt-card">
              <div class="prompt-header">
                <h2>{{ prompt.title }}</h2>
                <el-button circle :icon="DocumentCopy" @click="copyText(prompt.template)" />
              </div>
              <p class="prompt-purpose">{{ prompt.purpose }}</p>
              <div class="prompt-meta">
                <div>
                  <span>Input</span>
                  <p>{{ prompt.input }}</p>
                </div>
                <div>
                  <span>Output</span>
                  <p>{{ prompt.output }}</p>
                </div>
              </div>
              <pre>{{ prompt.template }}</pre>
            </article>
          </section>
        </el-tab-pane>

        <el-tab-pane label="SOP Rules" name="rules">
          <section class="rules-layout">
            <article v-for="rule in sopRules" :key="rule.id" class="rule-card">
              <div>
                <el-tag type="danger" effect="light">{{ rule.severity }}</el-tag>
              </div>
              <h2>{{ rule.title }}</h2>
              <p>{{ rule.detail }}</p>
            </article>
          </section>
        </el-tab-pane>

        <el-tab-pane label="QAQC & Lock" name="qaqc">
          <section class="qaqc-layout">
            <div class="qaqc-card">
              <h2>Thang điểm QAQC Screenplay</h2>
              <p class="qaqc-note">Kịch bản chỉ đạt khi từ 40/50 điểm trở lên và không còn mục đỏ.</p>
              <div v-for="item in qaqcRubric" :key="item.title" class="rubric-row">
                <strong>{{ item.points }} điểm</strong>
                <div>
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.check }}</p>
                </div>
              </div>
            </div>

            <div class="qaqc-card">
              <h2>Các điểm Lock</h2>
              <p class="qaqc-note">Lock gate giúp team tránh sửa ngược quy trình và làm vỡ timeline sản xuất.</p>
              <div v-for="lock in lockPoints" :key="lock.title" class="lock-row">
                <el-icon><Lock /></el-icon>
                <div>
                  <h3>{{ lock.title }}</h3>
                  <span>Sau bước: {{ lock.after }}</span>
                  <p>{{ lock.rule }}</p>
                </div>
              </div>
            </div>
          </section>
        </el-tab-pane>
      </el-tabs>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, DocumentCopy, Lock, VideoPlay } from '@element-plus/icons-vue'
import {
  lockPoints,
  pipelineStages,
  promptEngineSteps,
  qaqcRubric,
  sopRules,
  workflowDocuments,
} from '@/constants/aiaxProductionWorkflow'

const router = useRouter()
const activeTab = ref('pipeline')
const selectedStageId = ref(pipelineStages[0]?.id || '')

const selectedStage = computed(() => pipelineStages.find((stage) => stage.id === selectedStageId.value) || pipelineStages[0])
const totalSteps = computed(() => pipelineStages.reduce((sum, stage) => {
  return sum + stage.sections.reduce((sectionSum, section) => sectionSum + section.steps.length, 0)
}, 0))
const selectedStageStepCount = computed(() => selectedStage.value.sections.reduce((sum, section) => sum + section.steps.length, 0))

function tagType(gate) {
  if (gate === 'LOCK') return 'danger'
  if (gate === 'QC' || gate === 'Review') return 'warning'
  return 'success'
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('Đã copy')
  } catch {
    ElMessage.error('Không copy được')
  }
}

function copyPromptBundle() {
  const bundle = promptEngineSteps.map((step) => `# ${step.title}\n${step.template}`).join('\n\n---\n\n')
  copyText(bundle)
}
</script>

<style scoped>
.workflow-page {
  min-height: 100vh;
  background: #f6f7fb;
  color: #171717;
}

.workflow-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 20px;
  align-items: start;
  padding: 26px 32px 22px;
  border-bottom: 1px solid #e4e7ee;
  background: #ffffff;
}

.back-btn {
  width: 38px;
  height: 38px;
  border: 1px solid #d9deea;
  border-radius: 8px;
  background: #ffffff;
  color: #323746;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.workflow-title-block h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.15;
  font-weight: 760;
}

.eyebrow {
  margin: 0 0 6px;
  color: #5d3fd3;
  font-size: 12px;
  font-weight: 760;
  text-transform: uppercase;
}

.subtitle {
  max-width: 820px;
  margin: 8px 0 0;
  color: #667085;
  line-height: 1.55;
}

.workflow-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.workflow-main {
  padding: 24px 32px 48px;
}

.source-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.source-item {
  padding: 14px;
  border: 1px solid #e3e7ef;
  border-radius: 8px;
  background: #ffffff;
}

.source-role {
  color: #5d3fd3;
  font-size: 12px;
  font-weight: 760;
}

.source-item h2 {
  margin: 6px 0;
  font-size: 15px;
  line-height: 1.3;
}

.source-item p {
  min-height: 58px;
  margin: 0;
  color: #586174;
  font-size: 13px;
  line-height: 1.45;
}

.source-item span {
  display: block;
  margin-top: 10px;
  color: #8a93a6;
  font-size: 11px;
  word-break: break-word;
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.metric {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid #e4e7ee;
  border-radius: 8px;
  background: #ffffff;
}

.metric span {
  font-size: 26px;
  font-weight: 800;
  color: #1f2937;
}

.metric p {
  margin: 0;
  color: #667085;
  font-size: 13px;
}

.workflow-tabs {
  border: 1px solid #e3e7ef;
  border-radius: 8px;
  background: #ffffff;
  padding: 8px 18px 20px;
}

.pipeline-layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 18px;
  padding-top: 10px;
}

.stage-nav {
  display: grid;
  gap: 8px;
  align-content: start;
}

.stage-nav-btn {
  border: 1px solid #e0e5ef;
  border-radius: 8px;
  background: #fbfcff;
  color: #252b37;
  padding: 14px;
  text-align: left;
  cursor: pointer;
}

.stage-nav-btn strong,
.stage-nav-btn span {
  display: block;
}

.stage-nav-btn span {
  margin-top: 4px;
  color: #697386;
  font-size: 12px;
}

.stage-nav-btn.active {
  border-color: #7c3aed;
  background: #f4efff;
}

.stage-heading {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #edf0f5;
}

.stage-heading h2,
.workflow-section h3,
.prompt-card h2,
.rule-card h2,
.qaqc-card h2 {
  margin: 0;
}

.workflow-section {
  margin-top: 18px;
}

.workflow-section h3 {
  font-size: 17px;
  margin-bottom: 10px;
}

.step-list {
  display: grid;
  gap: 10px;
}

.step-card {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 18px;
  padding: 16px;
  border: 1px solid #e6e9f0;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
}

.step-index {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.step-index > span {
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
  color: #111827;
}

.step-index :deep(.el-tag) {
  max-width: 100%;
  height: auto;
  min-height: 24px;
  padding: 3px 8px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.2;
  text-align: left;
  justify-content: flex-start;
}

.step-body {
  min-width: 0;
}

.step-body h4 {
  margin: 0 0 6px;
  font-size: 16px;
  line-height: 1.3;
}

.step-action {
  margin: 0 0 12px;
  color: #4f5a6d;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.io-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.io-grid div,
.prompt-meta div {
  padding: 10px;
  border-radius: 8px;
  background: #f7f8fc;
}

.io-grid span,
.prompt-meta span {
  color: #7c8496;
  font-size: 12px;
  font-weight: 700;
}

.io-grid p,
.prompt-meta p {
  margin: 4px 0 0;
  color: #30394a;
  font-size: 13px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.prompt-engine-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding-top: 10px;
}

.prompt-card,
.rule-card,
.qaqc-card {
  border: 1px solid #e4e8f0;
  border-radius: 8px;
  background: #ffffff;
  padding: 16px;
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}

.prompt-card h2,
.rule-card h2 {
  font-size: 17px;
}

.prompt-purpose {
  min-height: 44px;
  color: #566174;
  line-height: 1.5;
}

.prompt-meta {
  display: grid;
  gap: 8px;
}

.prompt-card pre {
  white-space: pre-wrap;
  margin: 12px 0 0;
  padding: 12px;
  border-radius: 8px;
  background: #141821;
  color: #e8eef8;
  font-size: 12px;
  line-height: 1.5;
}

.rules-layout {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding-top: 10px;
}

.rule-card {
  display: grid;
  gap: 10px;
  align-content: start;
}

.rule-card p {
  margin: 0;
  color: #4f5a6d;
  line-height: 1.55;
}

.qaqc-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding-top: 10px;
}

.qaqc-note {
  margin: 6px 0 14px;
  color: #667085;
}

.rubric-row,
.lock-row {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid #edf0f5;
}

.rubric-row strong {
  color: #5d3fd3;
}

.rubric-row h3,
.lock-row h3 {
  margin: 0 0 4px;
  font-size: 15px;
}

.rubric-row p,
.lock-row p {
  margin: 0;
  color: #566174;
  line-height: 1.45;
}

.lock-row {
  grid-template-columns: 28px minmax(0, 1fr);
}

.lock-row .el-icon {
  color: #dc2626;
  margin-top: 2px;
}

.lock-row span {
  display: block;
  margin-bottom: 4px;
  color: #7c8496;
  font-size: 12px;
}

@media (max-width: 1100px) {
  .workflow-header {
    grid-template-columns: auto 1fr;
  }

  .workflow-actions {
    grid-column: 2;
    justify-content: flex-start;
  }

  .source-strip,
  .metric-row,
  .prompt-engine-grid,
  .rules-layout,
  .qaqc-layout {
    grid-template-columns: 1fr 1fr;
  }

  .pipeline-layout {
    grid-template-columns: 1fr;
  }

  .stage-nav {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .workflow-header,
  .workflow-main {
    padding-left: 16px;
    padding-right: 16px;
  }

  .workflow-header,
  .source-strip,
  .metric-row,
  .prompt-engine-grid,
  .rules-layout,
  .qaqc-layout,
  .io-grid,
  .stage-nav {
    grid-template-columns: 1fr;
  }

  .workflow-actions {
    grid-column: auto;
    flex-wrap: wrap;
  }

  .step-card {
    grid-template-columns: 1fr;
  }

  .step-index {
    flex-direction: row;
    align-items: center;
  }
}
</style>
