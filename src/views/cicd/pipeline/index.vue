<template>
  <PageWrapper title="流水线配置" content="可视化管理 Jenkins Pipeline Stage，双向同步到 Jenkinsfile 脚本">
    <div class="flex flex-col gap-4">
      <!-- 顶部 Job 基本配置 -->
      <Card title="Jenkins Job 配置" size="small" :bordered="false">
        <BasicForm @register="registerForm" />
        <div class="flex gap-3 mt-2">
          <Button @click="handleReset">重置</Button>
          <Button type="primary" :loading="submitLoading" @click="handleSubmit">保存并应用</Button>
        </div>
      </Card>

      <div class="flex flex-col md:flex-row gap-4">
        <!-- 左侧：Stage 可视化管理 -->
        <div class="w-full md:w-5/12">
          <Card size="small" :bordered="false">
            <template #title>
              <span>流水线阶段（Stage）</span>
            </template>
            <template #extra>
              <Space>
                <Button size="small" type="primary" @click="addCustomStage">
                  <PlusOutlined /> 新建 Stage
                </Button>
                <Dropdown>
                  <Button size="small">
                    选择模板 <DownOutlined />
                  </Button>
                  <template #overlay>
                    <Menu>
                      <MenuItem v-for="tpl in stageTemplates" :key="tpl.type" @click="addStage(tpl)">
                        <span class="flex items-center gap-2">
                          <span :class="tpl.iconClass">●</span>
                          {{ tpl.label }}
                        </span>
                      </MenuItem>
                    </Menu>
                  </template>
                </Dropdown>
              </Space>
            </template>

            <!-- Stage 列表 -->
            <div v-if="stages.length === 0" class="text-center text-gray-400 py-8 text-sm">
              暂无 Stage，请点击"添加 Stage"
            </div>

            <draggable v-model="stages" item-key="id" handle=".drag-handle" animation="200" @end="syncToCode">
              <template #item="{ element: stage, index }">
                <div :class="[
                  'group flex items-start gap-2 p-3 mb-2 rounded-lg border-2 transition-all cursor-pointer',
                  selectedStageId === stage.id
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-200'
                ]" @click="selectStage(stage)">
                  <!-- 拖拽手柄 -->
                  <div class="drag-handle cursor-grab active:cursor-grabbing text-gray-300 mt-1 select-none">
                    ⠷
                  </div>

                  <!-- Stage 序号 + 图标 -->
                  <div class="flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-0.5"
                    :style="{ background: stage.color + '22' }">
                    <span :style="{ color: stage.color }" class="text-xs font-bold">{{ index + 1 }}</span>
                  </div>

                  <!-- 内容 -->
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm text-gray-800 dark:text-gray-200">{{ stage.name }}</div>
                    <div class="text-xs text-gray-400 mt-0.5 truncate">{{ stage.steps.join(' → ') }}</div>
                  </div>

                  <!-- 状态/操作 -->
                  <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip title="删除">
                      <Button size="small" type="text" danger @click.stop="removeStage(stage.id)">
                        <DeleteOutlined />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </template>
            </draggable>

            <!-- Stage 编辑面板 -->
            <Divider v-if="selectedStage" />
            <div v-if="selectedStage" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div class="text-xs font-semibold text-gray-500 mb-2">编辑 Stage：{{ selectedStage.name }}</div>
              <Form layout="vertical" size="small">
                <FormItem label="Stage 名称">
                  <Input v-model:value="selectedStage.name" @input="syncToCode" placeholder="例如：Build" />
                </FormItem>
                <FormItem label="执行步骤">
                  <div class="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                    <Codemirror v-model="selectedStageSteps" placeholder="echo 'Building...'&#10;mvn clean package -DskipTests" :style="{ height: '150px' }" :extensions="extensions" />
                  </div>
                </FormItem>
                <FormItem label="执行条件（when，可选）">
                  <Input v-model:value="selectedStage.when" @input="syncToCode" placeholder="例如：branch 'main'" />
                </FormItem>
              </Form>
            </div>
          </Card>
        </div>

        <!-- 右侧：代码编辑器 -->
        <div class="w-full md:w-7/12">
          <Card size="small" :bordered="false">
            <template #title>Jenkinsfile 脚本（Groovy）</template>
            <template #extra>
              <Space>
                <span class="text-gray-400 text-xs">快速模板：</span>
                <Button size="small" type="dashed" @click="loadTemplate('go')">Go后端</Button>
                <Button size="small" type="dashed" @click="loadTemplate('vue')">Vue前端</Button>
                <Button size="small" type="dashed" @click="loadTemplate('docker')">Docker</Button>
                <Button size="small" @click="parseFromCode">← 从代码解析</Button>
              </Space>
            </template>
            <div class="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
              <Codemirror v-model="pipelineCode" placeholder="正在编辑 Jenkinsfile..." :style="{ height: '540px' }"
                :extensions="extensions" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineComponent, h } from 'vue';
import { message, Modal, Card, Button, Space, Divider, Tooltip, Dropdown, Menu, Form, Input } from 'ant-design-vue';
import { PlusOutlined, DeleteOutlined, DownOutlined } from '@ant-design/icons-vue';
import { PageWrapper } from '@/components/Page';
import { BasicForm, useForm } from '@/components/Form';
import { Codemirror } from 'vue-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { Decoration, ViewPlugin, EditorView } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// 自定义 Groovy / Jenkinsfile 语法高亮规则（针对 OneDark 进行了色彩配对设计）
const keywordTheme = EditorView.baseTheme({
  '.cm-jenkins-keyword': { color: '#c678dd', fontWeight: 'bold' },
  '.cm-jenkins-string': { color: '#98c379' },
  '.cm-jenkins-comment': { color: '#5c6370', fontStyle: 'italic' },
  '.cm-jenkins-step': { color: '#61afef' },
});

const jC = Decoration.mark({ class: 'cm-jenkins-comment' });
const jS = Decoration.mark({ class: 'cm-jenkins-string' });
const jK = Decoration.mark({ class: 'cm-jenkins-keyword' });
const jT = Decoration.mark({ class: 'cm-jenkins-step' });

const jenkinsHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = this.getDeco(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.getDeco(update.view);
      }
    }
    getDeco(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();
      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);
        const regex = /(\/\/.*)|(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')|(\b(?:pipeline|agent|stages|stage|steps|environment|post|always|success|failure|any|none|when|withCredentials)\b)|(\b(?:sh|echo|git|checkout|mvn|docker|curl)\b)/g;
        let match;
        while ((match = regex.exec(text))) {
          const start = from + match.index;
          const end = start + match[0].length;
          if (match[1] || match[2]) {
            builder.add(start, end, jC);
          } else if (match[3] || match[4]) {
            builder.add(start, end, jS);
          } else if (match[5]) {
            builder.add(start, end, jK);
          } else if (match[6]) {
            builder.add(start, end, jT);
          }
        }
      }
      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

import { foldGutter, foldService } from '@codemirror/language';

// 自定义大括号/括号代码段折叠服务
const braceFolder = foldService.of((state, lineStart) => {
  const line = state.doc.lineAt(lineStart);
  const text = line.text;
  const openBrace = text.indexOf('{');
  if (openBrace === -1) return null;

  let braceCount = 0;
  const pos = lineStart + openBrace;
  const docLength = state.doc.length;

  for (let i = pos; i < docLength; i++) {
    const char = state.doc.sliceString(i, i + 1);
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        return { from: pos + 1, to: i };
      }
    }
  }
  return null;
});

const extensions = [oneDark, keywordTheme, jenkinsHighlighter, braceFolder];

const MenuItem = Menu.Item;
const FormItem = Form.Item;
const Textarea = Input.TextArea;

// 简单拖拽容器 fallback（不依赖 vuedraggable）
const draggable = defineComponent({
  name: 'SimpleDraggable',
  props: { modelValue: Array, itemKey: String },
  emits: ['update:modelValue', 'end'],
  setup(props, { slots }) {
    return () => h('div', {}, (props.modelValue || []).map((el: any, index: number) =>
      slots.item?.({ element: el, index }) ?? null
    ));
  },
});

// ---- Stage 类型模板 ----
const stageTemplates = [
  { type: 'checkout', label: 'Checkout（拉取代码）', color: '#722ed1', iconClass: 'text-purple-500', steps: ["git branch: '${branch}', url: '${repoUrl}', credentialsId: '${credentialId}'"] },
  { type: 'build', label: 'Build（构建）', color: '#1890ff', iconClass: 'text-blue-500', steps: ["echo 'Building...'", "sh 'mvn clean package -DskipTests'"] },
  { type: 'test', label: 'Test（测试）', color: '#52c41a', iconClass: 'text-green-500', steps: ["echo 'Running tests...'", "sh 'mvn test'"] },
  { type: 'package', label: 'Package（打包镜像）', color: '#fa8c16', iconClass: 'text-orange-500', steps: ["sh 'docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} .'", "sh 'docker push ${IMAGE_NAME}:${BUILD_NUMBER}'"] },
  { type: 'deploy', label: 'Deploy（部署）', color: '#f5222d', iconClass: 'text-red-500', steps: ["echo 'Deploying...'", "sh './deploy.sh ${IMAGE_NAME}:${BUILD_NUMBER}'"] },
  { type: 'notify', label: 'Notify（通知）', color: '#13c2c2', iconClass: 'text-teal-500', steps: ["echo 'Sending notification...'", "sh 'curl -X POST $WEBHOOK_URL -d \\'message=Build Done\\''"] },
];

let stageIdCounter = 1;
const stages = ref<any[]>([]);
const selectedStageId = ref<number | null>(null);

const selectedStage = computed(() => stages.value.find((s) => s.id === selectedStageId.value) || null);
const selectedStageSteps = ref('');

watch(selectedStage, (s) => {
  selectedStageSteps.value = s ? s.steps.join('\n') : '';
});

watch(selectedStageSteps, (newVal) => {
  if (selectedStage.value) {
    const currentStepsStr = selectedStage.value.steps.join('\n');
    if (newVal !== currentStepsStr) {
      selectedStage.value.steps = newVal.split('\n').filter(Boolean);
      syncToCode();
    }
  }
});

function onStepsChange() {
  if (selectedStage.value) {
    selectedStage.value.steps = selectedStageSteps.value.split('\n').filter(Boolean);
    syncToCode();
  }
}

function selectStage(stage: any) {
  selectedStageId.value = stage.id;
}

function addCustomStage() {
  const stage = {
    id: stageIdCounter++,
    name: '新建阶段',
    type: 'custom',
    color: '#1890ff',
    steps: ["echo 'Hello'"],
    when: '',
  };
  stages.value.push(stage);
  selectedStageId.value = stage.id;
  syncToCode();
}

function addStage(tpl: any) {
  const stage = {
    id: stageIdCounter++,
    name: tpl.label.split('（')[0],
    type: tpl.type,
    color: tpl.color,
    steps: [...tpl.steps],
    when: '',
  };
  stages.value.push(stage);
  selectedStageId.value = stage.id;
  syncToCode();
}

function removeStage(id: number) {
  stages.value = stages.value.filter((s) => s.id !== id);
  if (selectedStageId.value === id) selectedStageId.value = null;
  syncToCode();
}

// ---- 代码同步 ----
const pipelineCode = ref(`pipeline {
    agent any
    environment {
        WORK_SPACES="\${WORKSPACE}"
        HARBOR_URL="harbor.rushbi.me"                          //harbor仓库HARBOR_URL
        PROJECT_DIR="app"                                      //镜像存储目录
        IMAGE_NAME="\${HARBOR_URL}/\${PROJECT_DIR}/springboot"   //镜像完整名称
    }
    // 在此添加 stages...
    stages {
    }
}`);

function syncToCode() {
  if (stages.value.length === 0) {
    pipelineCode.value = `pipeline {\n    agent any\n\n    stages {\n        // 点击左侧"添加 Stage"按钮开始构建流水线\n    }\n}`;
    return;
  }
  const stagesCode = stages.value
    .map((s) => {
      const stepsCode = s.steps.map((step: string) => `                ${step}`).join('\n');
      const whenCode = s.when ? `\n            when { ${s.when} }` : '';
      return `        stage('${s.name}') {${whenCode}\n            steps {\n${stepsCode}\n            }\n        }`;
    })
    .join('\n\n');
  pipelineCode.value = `pipeline {\n    agent any\n\n    stages {\n${stagesCode}\n    }\n}`;
}

function parseFromCode() {
  // 简单解析 stage('xxx') 块
  const matches = [...pipelineCode.value.matchAll(/stage\('([^']+)'\)\s*\{[\s\S]*?steps\s*\{([\s\S]*?)\}/g)];
  if (!matches.length) {
    message.warning('未找到 stage 定义，请确认 Jenkinsfile 格式正确');
    return;
  }
  stages.value = matches.map((m, i) => {
    const tpl = stageTemplates[i % stageTemplates.length];
    return {
      id: stageIdCounter++,
      name: m[1],
      type: 'custom',
      color: tpl.color,
      steps: m[2].trim().split('\n').map((l: string) => l.trim()).filter(Boolean),
      when: '',
    };
  });
  selectedStageId.value = null;
  message.success(`已从代码解析出 ${stages.value.length} 个 Stage`);
}

// ---- 模板 ----
const templates: Record<string, { stages: any[]; code: string }> = {
  go: {
    stages: [
      { id: stageIdCounter++, name: 'Checkout', type: 'checkout', color: '#722ed1', steps: ["git branch: 'main', url: 'git@gitlab.com:your-org/your-go-app.git'"], when: '' },
      { id: stageIdCounter++, name: 'Build', type: 'build', color: '#1890ff', steps: ["sh 'go build -o bin/app main.go'"], when: '' },
      { id: stageIdCounter++, name: 'Test', type: 'test', color: '#52c41a', steps: ["sh 'go test ./...'"], when: '' },
      { id: stageIdCounter++, name: 'Deploy', type: 'deploy', color: '#f5222d', steps: ["sh './deploy.sh'"], when: '' },
    ],
    code: '',
  },
  vue: {
    stages: [
      { id: stageIdCounter++, name: 'Checkout', type: 'checkout', color: '#722ed1', steps: ["git branch: 'main', url: 'git@gitlab.com:your-org/your-vue-app.git'"], when: '' },
      { id: stageIdCounter++, name: 'Install', type: 'build', color: '#1890ff', steps: ["sh 'npm install -g pnpm'", "sh 'pnpm install'"], when: '' },
      { id: stageIdCounter++, name: 'Build', type: 'package', color: '#fa8c16', steps: ["sh 'pnpm run build'"], when: '' },
      { id: stageIdCounter++, name: 'Deploy', type: 'deploy', color: '#f5222d', steps: ["sh 'scp -r dist/* user@server:/usr/share/nginx/html/'"], when: '' },
    ],
    code: '',
  },
  docker: {
    stages: [
      { id: stageIdCounter++, name: 'Checkout', type: 'checkout', color: '#722ed1', steps: ["checkout scm"], when: '' },
      { id: stageIdCounter++, name: 'Build Image', type: 'package', color: '#fa8c16', steps: ["sh 'docker build -t ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} .'"], when: '' },
      { id: stageIdCounter++, name: 'Push Image', type: 'deploy', color: '#f5222d', steps: ["sh 'docker push ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}'"], when: '' },
      { id: stageIdCounter++, name: 'Notify', type: 'notify', color: '#13c2c2', steps: ["echo 'Deployment finished: ${BUILD_NUMBER}'"], when: '' },
    ],
    code: '',
  },
};

function loadTemplate(type: 'go' | 'vue' | 'docker') {
  if (stages.value.length > 0) {
    Modal.confirm({
      title: '覆盖确认',
      content: '当前已有 Stage 配置，加载模板将覆盖，是否继续？',
      onOk() { applyTemplate(type); },
    });
  } else {
    applyTemplate(type);
  }
}

function applyTemplate(type: string) {
  stages.value = templates[type].stages.map((s) => ({ ...s, id: stageIdCounter++ }));
  selectedStageId.value = null;
  syncToCode();
  message.success(`已加载 ${type.toUpperCase()} 模板`);
}

// ---- 表单 ----
const submitLoading = ref(false);
const [registerForm, { validate, resetFields }] = useForm({
  labelWidth: 100,
  schemas: [
    { field: 'jobName', label: 'Job 名称', component: 'Input', required: true, defaultValue: 'my-jenkins-job', colProps: { span: 8 } },
    { field: 'repoUrl', label: 'Git 仓库地址', component: 'Input', required: true, defaultValue: 'git@gitlab.com:demo/project.git', colProps: { span: 8 } },
    { field: 'branch', label: '触发分支', component: 'Input', defaultValue: 'main', required: true, colProps: { span: 8 } },
    { field: 'credentialId', label: 'Git 凭证 ID', component: 'Input', defaultValue: 'gitlab-ssh-key', colProps: { span: 8 }, helpMessage: 'Jenkins Credentials ID' },
    { field: 'desc', label: '描述', component: 'InputTextArea', colProps: { span: 16 } },
  ],
  showActionButtonGroup: false,
});

async function handleSubmit() {
  try {
    const values = await validate();
    if (!pipelineCode.value) return message.warning('Jenkinsfile 不能为空');
    submitLoading.value = true;
    await new Promise((r) => setTimeout(r, 1000));
    message.success('流水线配置已保存！');
  } finally {
    submitLoading.value = false;
  }
}

function handleReset() {
  resetFields();
  stages.value = [];
  pipelineCode.value = `pipeline {\n    agent any\n\n    stages {\n    }\n}`;
  selectedStageId.value = null;
}
</script>