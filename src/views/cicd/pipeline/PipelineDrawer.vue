<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter
    :title="isUpdate ? '编辑 Jenkins 流水线模版 (Pipeline Template)' : '新建 Jenkins 流水线模版'" width="70%" @ok="handleSubmit"
    :okText="isUpdate ? '保存模版修改' : '创建流水线模版'">
    <div class="flex flex-col gap-4 py-2 px-3">
      <div
        class="p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-indigo-800/80 rounded-lg">
        <div class="flex items-center gap-2 text-xs text-blue-700 dark:text-cyan-300">
          <Icon icon="ant-design:info-circle-outlined" class="text-lg text-blue-500" />
          <span><strong>模版定义规范：</strong>在下方直接编写原生 Groovy DSL 脚本代码。保存后可供服务作业 (Job)
            即选即用，并可通过 Jenkins 官方 Linter 进行语法严审。</span>
        </div>
      </div>

      <BasicForm @register="registerForm">
        <template #pipelineScriptSlot>
          <div class="flex flex-col gap-2 w-full">
            <div
              class="flex items-center justify-between bg-slate-100 dark:bg-slate-900 px-3 py-2 rounded-t-lg border-b border-gray-200 dark:border-gray-800">
              <span class="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                <Icon icon="ant-design:code-outlined" class="text-cyan-500 text-sm" />
                <span>Jenkinsfile (Groovy DSL 流水线定义)</span>
                <Tag color="processing" class="ml-2 font-mono text-xs font-semibold">Groovy Syntax</Tag>
              </span>
              <Space align="center">
                <Tag v-if="syntaxStatus === 'success'" color="success"
                  class="font-bold text-xs py-0.5 px-2 flex items-center gap-1 border border-green-500/40">
                  <Icon icon="ant-design:check-circle-filled" class="text-green-500 text-sm" />
                  <span>校验通过</span>
                </Tag>
                <Tag v-else-if="syntaxStatus === 'error'" color="error"
                  class="font-bold text-xs py-0.5 px-2 flex items-center gap-1 border border-red-500/40">
                  <Icon icon="ant-design:close-circle-filled" class="text-red-500 text-sm" />
                  <span>校验失败</span>
                </Tag>
                <Button size="small" type="primary" class="bg-indigo-600 border-0 font-medium" :loading="validating"
                  @click="handlePreCheckSyntax">
                  <template #icon>
                    <Icon icon="ant-design:check-circle-outlined" />
                  </template>
                  官方 Linter 语法校验
                </Button>
              </Space>
            </div>
            <div
              class="border-2 border-gray-300 dark:border-gray-700 rounded-b-lg overflow-hidden shadow-xs hover:border-cyan-500/70 transition-all">
              <Codemirror v-model="pipelineScript" placeholder="在此输入 Groovy 流水线定义代码 (pipeline { agent any ... })"
                :style="{ height: '460px', fontSize: '13px' }" :extensions="extensions" />
            </div>
          </div>
        </template>
      </BasicForm>
    </div>
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Tag, Space, Modal } from 'ant-design-vue';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon/Icon.vue';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { BasicForm, useForm } from '@/components/Form';
import { createJenkinsPipeline, updateJenkinsPipeline, validateJenkinsPipeline } from '@/api/cicd/pipeline';
import { useMessage } from '@/hooks/web/useMessage';
import { formSchema } from './pipeline.data';

// Codemirror imports & Groovy Syntax Setup
import { Codemirror } from 'vue-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { Decoration, ViewPlugin, EditorView } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { foldService } from '@codemirror/language';

const emit = defineEmits(['success', 'register']);
const { createMessage } = useMessage();
const isUpdate = ref(false);
const recordId = ref<number | null>(null);
const pipelineScript = ref<string>('');
const validating = ref(false);
const syntaxStatus = ref<'success' | 'error' | null>(null);

watch(pipelineScript, () => {
  syntaxStatus.value = null;
});

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
        const regex =
          /(\/\/.*)|(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')|(\b(?:pipeline|agent|stages|stage|steps|environment|parameters|options|post|always|success|failure|any|none|when|expression|withCredentials|cleanWs|checkout|scmGit|groovyScript|booleanParam|string|choice)\b)|(\b(?:sh|echo|git|docker|curl|ansible|wrap|returnStdout|trim)\b)/g;
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

const defaultTemplateScript = `pipeline {
    agent any

    options {
        timeout(time: 1, unit: 'HOURS')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('拉取代码 (Checkout)') {
            steps {
                echo "1. 正在从 Git 仓库拉取最新发布分支..."
            }
        }

        stage('编译构建 (Build & Compile)') {
            steps {
                echo "2. 执行依赖安装与编译构建打包..."
            }
        }

        stage('镜像打包与推送 (Docker Push)') {
            steps {
                echo "3. 构建 Container 镜像并推送到云端镜像仓库..."
            }
        }

        stage('云端发布部署 (Cloud Deploy)') {
            steps {
                echo "4. 执行 Kubernetes 零停机滚动更新集群应用..."
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}`;

async function handlePreCheckSyntax() {
  if (!pipelineScript.value) {
    createMessage.warning('流水线脚本内容为空，无法进行校验');
    return;
  }
  try {
    validating.value = true;
    const res: any = await validateJenkinsPipeline({
      pipelineScript: pipelineScript.value,
    });
    if (res && res.valid) {
      syntaxStatus.value = 'success';
      Modal.success({
        title: 'Linter 语法检测通过 ✔',
        content: '当前 Jenkinsfile 语法完全符合 Groovy DSL 规范，可安全发布及使用。',
      });
    } else {
      syntaxStatus.value = 'error';
      const errors = Array.isArray(res?.errors) ? res.errors.join('\n') : res?.errors || '语法错误';
      Modal.error({
        title: 'Pipeline 语法校验未通过 ✖',
        width: 580,
        content: `官方 Linter 返回如下异常：\n\n${errors}`,
      });
    }
  } catch (e) {
  } finally {
    validating.value = false;
  }
}

const [registerForm, { validate, resetFields, setFieldsValue }] = useForm({
  labelWidth: 125,
  schemas: formSchema,
  showActionButtonGroup: false,
});

const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  resetFields();
  setDrawerProps({ confirmLoading: false });
  isUpdate.value = !!data?.isUpdate;
  recordId.value = data?.record?.id || null;

  if (isUpdate.value && data?.record) {
    const record = data.record;
    setFieldsValue({
      name: record.name || '',
      lang: record.lang || 'Vue/TS',
      agentNode: record.agentNode || 'master',
      description: record.description || '',
    });
    pipelineScript.value = record.pipelineScript || defaultTemplateScript;
  } else {
    setFieldsValue({
      lang: 'Vue/TS',
      agentNode: 'master',
    });
    pipelineScript.value = defaultTemplateScript;
  }
});

async function handleSubmit() {
  try {
    const values = await validate();
    if (!pipelineScript.value || pipelineScript.value.trim() === '') {
      createMessage.warning('流水线 Groovy 脚本内容不能为空');
      return;
    }

    setDrawerProps({ confirmLoading: true });

    const payload = {
      id: recordId.value || undefined,
      name: values.name,
      lang: values.lang,
      agentNode: values.agentNode,
      description: values.description,
      pipelineScript: pipelineScript.value,
    };

    if (isUpdate.value) {
      await updateJenkinsPipeline(payload);
      createMessage.success(`流水线模版 [${values.name}] 保存成功！`);
    } else {
      await createJenkinsPipeline(payload);
      createMessage.success(`流水线模版 [${values.name}] 成功创建！`);
    }

    closeDrawer();
    emit('success');
  } catch (e) {
  } finally {
    setDrawerProps({ confirmLoading: false });
  }
}
</script>
