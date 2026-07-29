<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter
    :title="isUpdate ? '在线编辑与审验 Jenkins 任务 (仅交互远端，数据库不落库)' : '新建 Jenkins 服务基线作业'" width="950px" @ok="handleSubmit"
    :okText="isUpdate ? '提交并同步至远端' : '验证语法并创建Job'">
    <div class="flex flex-col gap-4 py-2 px-3">
      <div
        class="p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-indigo-800/80 rounded-lg">
        <div class="flex items-center gap-2 text-xs text-blue-700 dark:text-cyan-300">
          <Icon icon="ant-design:security-scan-outlined" class="text-lg text-blue-500 animate-pulse" />
          <span><strong>架构规范提示：</strong>Jenkinsfile 代码由远程 Linter 进行官方语法强校验，错误格式会被阻断。在编辑模式下直接提取和推送到远端，保证无数据库残留。</span>
        </div>
      </div>

      <BasicForm @register="registerForm">
        <template #pipelineScriptSlot>
          <div class="flex flex-col gap-2 mt-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span>Jenkinsfile</span>
                <Tag v-if="selectedPipelineName" color="processing" class="scale-95 font-semibold">
                  模板: {{ selectedPipelineName }}
                </Tag>

              </span>
              <Space align="center">
                <Tag v-if="syntaxStatus === 'success'" color="success"
                  class="font-bold text-xs py-0.5 px-2 flex items-center gap-1 border border-green-500/40">
                  <Icon icon="ant-design:check-circle-filled" class="text-green-500 text-sm" />
                  <span>校验通过 ✔</span>
                </Tag>
                <Tag v-else-if="syntaxStatus === 'error'" color="error"
                  class="font-bold text-xs py-0.5 px-2 flex items-center gap-1 border border-red-500/40">
                  <Icon icon="ant-design:close-circle-filled" class="text-red-500 text-sm" />
                  <span>校验失败 ✖</span>
                </Tag>
                <Button size="small" type="dashed" class="border-cyan-500 text-cyan-600 font-medium"
                  @click="handleSyncGitUrl">
                  <template #icon>
                    <Icon icon="ant-design:swap-outlined" />
                  </template>
                  同步替换 Git 仓库与分支配置
                </Button>
                <Button size="small" type="primary" class="bg-indigo-600 border-0 font-medium" :loading="validating"
                  @click="handlePreCheckSyntax">
                  <template #icon>
                    <Icon icon="ant-design:check-circle-outlined" />
                  </template>
                  手动语法检测 (Linter)
                </Button>
              </Space>
            </div>
            <div
              class="border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-xs hover:border-cyan-500/70 transition-all">
              <Codemirror v-model="pipelineScript" placeholder="直接在此输入 Groovy 流水线脚本，或从上方选择现成模板载入..."
                :style="{ height: '450px', fontSize: '13px' }" :extensions="extensions" />
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
import { BasicForm, useForm, FormSchema } from '@/components/Form';
import { createJenkinsJob, updateJenkinsJob, getJenkinsJobRemotePipeline, validateJenkinsPipeline } from '@/api/cicd';
import { getJenkinsPipelineList } from '@/api/cicd/pipeline';
import { getCodeGitServerList } from '@/api/code/server';
import { getCodeGitRepoList, getRepoBranches } from '@/api/code/repo';
import { getResourceEcsList } from '@/api/demo/system';

import { useMessage } from '@/hooks/web/useMessage';

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
const isFormInitializing = ref(false);
const recordId = ref<number | null>(null);
const instanceId = ref<number | null>(null);
const currentGitRepo = ref<string>('');
const pipelineScript = ref<string>('');
const selectedPipelineName = ref<string>('');
const validating = ref(false);
const selectedRepoName = ref<string>('');
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

function handleSyncGitUrl() {
  const gitRepo = currentGitRepo.value || getFieldsValue()?.gitRepo;
  const branch = getFieldsValue()?.gitBranch || 'main';
  if (!gitRepo && !branch) {
    createMessage.warning('请确保已选妥 Git 仓库与发布分支参数');
    return;
  }
  if (!pipelineScript.value) {
    createMessage.warning('当前脚本内容为空，无法替换');
    return;
  }
  let script = pipelineScript.value;
  let replaced = false;

  if (gitRepo && /git ls-remote -t -h [^\s"'\\]+/.test(script)) {
    script = script.replace(/git ls-remote -t -h [^\s"'\\]+/g, `git ls-remote -t -h ${gitRepo}`);
    replaced = true;
  }
  if (gitRepo && /string defaultValue: ['"][^'"]*['"], name: 'GIT仓库'/.test(script)) {
    script = script.replace(/string defaultValue: ['"][^'"]*['"], name: 'GIT仓库'/g, `string defaultValue: '${gitRepo}', name: 'GIT仓库'`);
    replaced = true;
  }
  if (gitRepo && /url: ['"][^'"]*['"]/.test(script)) {
    script = script.replace(/url: ['"][^'"]*['"]/g, `url: '${gitRepo}'`);
    replaced = true;
  }
  if (branch && /string defaultValue: ['"][^'"]*['"], name: 'GIT分支'/.test(script)) {
    script = script.replace(/string defaultValue: ['"][^'"]*['"], name: 'GIT分支'/g, `string defaultValue: '${branch}', name: 'GIT分支'`);
    replaced = true;
  }
  if (branch && /branch: ['"][^'"]*['"]/.test(script)) {
    script = script.replace(/branch: ['"][^'"]*['"]/g, `branch: '${branch}'`);
    replaced = true;
  }

  pipelineScript.value = script;
  createMessage.success(`🎯 脚本中的 Git 仓库与分支变量已更新替换！`);
}

async function handlePreCheckSyntax() {
  if (!instanceId.value) {
    createMessage.error('缺少 Jenkins 实例 ID');
    return;
  }
  if (!pipelineScript.value) {
    createMessage.warning('流水线内容为空，无法进行校验');
    return;
  }
  try {
    validating.value = true;
    const res: any = await validateJenkinsPipeline({
      instanceId: instanceId.value,
      pipelineScript: pipelineScript.value,
    });
    if (res && res.valid) {
      syntaxStatus.value = 'success';
      Modal.success({
        title: '语法检测通过 ✔',
        content: '当前 Pipeline 语法格式完全合规，您可以安全创建或修改。',
      });
    } else {
      syntaxStatus.value = 'error';
      const errors = Array.isArray(res?.errors) ? res.errors.join('\n') : res?.errors || '未知语法异常';
      Modal.error({
        title: 'Pipeline 语法有误 ✖',
        width: 580,
        content: `官方 Linter 校验失败，请核实以下报错信息并修正：\n\n${errors}`,
      });
    }
  } catch (e) {
    syntaxStatus.value = 'error';
  } finally {
    validating.value = false;
  }
}

const schemas: FormSchema[] = [
  {
    field: 'pipelineId',
    label: '流水线模版',
    component: 'ApiSelect',
    colProps: { span: 24 },
    componentProps: ({ formModel }) => {
      return {
        api: getJenkinsPipelineList,
        resultField: 'items',
        labelField: 'name',
        valueField: 'id',
        showSearch: true,
        allowClear: true,
        optionFilterProp: 'label',
        placeholder: '选择已装配的流水线模版',
        onChange: (_val: any, option: any) => {
          if (isFormInitializing.value) return;
          if (_val && option) {
            selectedPipelineName.value = option.name || option.label || '';
            if (option.pipelineScript) {
              pipelineScript.value = option.pipelineScript;
              if (currentGitRepo.value) {
                handleSyncGitUrl();
              }
            }
            if (option.lang) {
              formModel.lang = option.lang;
            }
          } else {
            selectedPipelineName.value = '';
            if (!isUpdate.value) pipelineScript.value = '';
          }
        },
      };
    },
  },
  {
    field: 'gitServerId',
    label: 'Git 实例',
    component: 'ApiSelect',
    required: true,
    colProps: { span: 8 },
    componentProps: ({ formModel }) => {
      return {
        api: getCodeGitServerList,
        resultField: 'items',
        labelField: 'name',
        valueField: 'id',
        showSearch: true,
        allowClear: true,
        optionFilterProp: 'label',
        placeholder: '选择代码源',
        onChange: () => {
          if (isFormInitializing.value) return;
          formModel.gitRepoId = undefined;
          formModel.gitRepo = undefined;
          formModel.gitBranch = undefined;
        },
      };
    },
  },
  {
    field: 'gitRepoId',
    label: '代码仓库',
    component: 'ApiSelect',
    required: true,
    colProps: { span: 9 },
    componentProps: ({ formModel }) => {
      return {
        api: getCodeGitRepoList,
        params: { serverId: formModel.gitServerId },
        resultField: 'items',
        labelField: 'fullName',
        valueField: 'id',
        showSearch: true,
        allowClear: true,
        optionFilterProp: 'label',
        placeholder: '定位项目仓库',
        disabled: !formModel.gitServerId && !isUpdate.value,
        onChange: (_val: any, option: any) => {
          if (isFormInitializing.value) return;
          if (_val && option) {
            const fullName = option.fullName || option.name || '';
            selectedRepoName.value = fullName;
            if (fullName.includes('/')) {
              const parts = fullName.split('/');
              const groupName = parts.slice(0, -1).join('/');
              const repoName = parts[parts.length - 1];
              if (!formModel.projectName && !formModel.folder) {
                formModel.projectName = groupName;
                formModel.folder = groupName;
              }
              if (!formModel.jobName) {
                formModel.jobName = repoName;
              }
            } else {
              if (!formModel.jobName) {
                formModel.jobName = fullName;
              }
            }
            const url = option.cloneUrlSsh || option.cloneUrlHttp || option.webUrl || '';
            if (url) {
              formModel.gitRepo = url;
              currentGitRepo.value = url;
            }
            if (pipelineScript.value) {
              handleSyncGitUrl();
            }
          }
        },
      };
    },
  },
  {
    field: 'gitBranch',
    label: 'Git 分支',
    component: 'ApiSelect',
    required: true,
    colProps: () => ({ span: isUpdate.value ? 10 : 7 }),
    defaultValue: 'main',
    componentProps: ({ formModel }) => {
      const repoUrl = formModel.gitRepo || '';
      const gitFullName = selectedRepoName.value || (repoUrl ? repoUrl.trim().replace(/\.git$/, '').split(/[\/:=]/).filter(Boolean).slice(-2).join('/') : '');
      return {
        api: async (params: any) => {
          const curBranch = formModel.gitBranch || 'main';
          if (!params?.serverId && !params?.fullName && !params?.repoId) {
            return [{ name: curBranch }, { name: 'main' }, { name: 'develop' }, { name: 'master' }];
          }
          try {
            const res: any = await getRepoBranches(params, { errorMessageMode: 'none' });
            const list = res?.items || res || [];
            if (Array.isArray(list) && list.length > 0) {
              if (curBranch && !list.some((b: any) => (b?.name || b) === curBranch)) {
                list.unshift({ name: curBranch });
              }
              return list;
            }
            return [{ name: curBranch }, { name: 'main' }, { name: 'develop' }, { name: 'master' }];
          } catch (_) {
            return [{ name: curBranch }, { name: 'main' }, { name: 'develop' }, { name: 'master' }];
          }
        },
        params: {
          serverId: formModel.gitServerId,
          repoId: formModel.gitRepoId,
          fullName: gitFullName,
        },
        immediate: false,
        alwaysLoad: true,
        resultField: '',
        labelField: 'name',
        valueField: 'name',
        showSearch: true,
        optionFilterProp: 'name',
        placeholder: '发布默认分支',
      };
    },
  },
  {
    field: 'gitRepo',
    label: 'GIT 地址',
    component: 'Input',
    required: true,
    colProps: { span: 14 },
    componentProps: {
      placeholder: '例如：git@192.168.50.100:group/repo.git',
    },
  },
  {
    field: 'lang',
    label: '语言类型',
    component: 'Select',
    defaultValue: 'Java',
    colProps: { span: 10 },
    componentProps: {
      options: [
        { label: 'Java', value: 'Java' },
        { label: 'Vue/TS', value: 'Vue/TS' },
        { label: 'Go', value: 'Go' },
        { label: 'Python', value: 'Python' },
        { label: 'Shell', value: 'Shell' },
      ],
    },
  },
  {
    field: 'projectName',
    label: '项目名称',
    component: 'Input',
    helpMessage: 'jenkins下会基于该名称创建文件夹',
    colProps: { span: 8 },
    componentProps: {
      placeholder: 'Git Group 名',
    },
  },
  {
    field: 'jobName',
    label: '服务名称',
    component: 'Input',
    required: true,
    colProps: { span: 8 },
    componentProps: {
      placeholder: '服务名称',
    },
  },
  {
    field: 'deployEnv',
    label: '部署环境',
    component: 'Select',
    required: true,
    defaultValue: 'dev',
    colProps: { span: 8 },
    componentProps: {
      options: [
        { label: 'dev | 开发', value: 'dev' },
        { label: 'test | 测试', value: 'test' },
        { label: 'stage | 预发布', value: 'stage' },
        { label: 'uat | UAT', value: 'uat' },
        { label: 'pre | 灰度', value: 'pre' },
        { label: 'prod | 生产', value: 'prod' },
      ],
    },
  },
  {
    field: 'deployType',
    label: '部署类型',
    component: 'ApiSelect',
    required: true,
    defaultValue: 'Kube-Cluster-Prod-01',
    colProps: { span: 16 },
    componentProps: {
      showSearch: true,
      optionFilterProp: 'label',
      api: async (params: any) => {
        try {
          const res = await getResourceEcsList(params);
          const items = res?.items || [];
          if (items.length > 0) {
            return items.map((item: any) => {
              const ip = item.PrivateIpAddress?.[0] || '无私有IP';
              return {
                label: `${item.title} (${ip})`,
                value: ip,
              };
            });
          }
        } catch (e) {
        }
        return [
          { label: 'K8S - Kubernetes CloudNative Core Cluster [ Prod-01 ]', value: 'Kube-Cluster-Prod-01' },
          { label: 'K8S - Dev/Test Elastic Container Pool [ K8S-Test-Cluster-02 ]', value: 'Kube-Cluster-Test-02' },
          { label: 'Host IP - 物理机群生产实态群组 (192.168.50.10)', value: 'Host-Group-192.168.50.x' },
        ];
      },
      placeholder: '请选择CMDB真实IP主机、容器集群',
    },
  },
  {
    field: 'enableDelete',
    label: '安全防护锁',
    component: 'Switch',
    defaultValue: false,
    colProps: { span: 8 },
    componentProps: {
      checkedChildren: '已解开 (允许删除)',
      unCheckedChildren: '锁定 (防误删)',
    },
    helpMessage: ['开启后解锁防强删机制，允许删除该 Job；关闭时系统禁止删除'],
  },
  {
    field: 'pipelineScript',
    label: '',
    component: 'Input',
    colProps: { span: 24 },
    slot: 'pipelineScriptSlot',
  },
];

const [registerForm, { validate, resetFields, setFieldsValue, getFieldsValue }] = useForm({
  labelWidth: 125,
  schemas,
  showActionButtonGroup: false,
});

const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  resetFields();
  setDrawerProps({ confirmLoading: false });
  isUpdate.value = !!data?.isUpdate;
  recordId.value = data?.record?.id || null;
  instanceId.value = data?.instanceId || null;
  currentGitRepo.value = '';
  pipelineScript.value = '';
  selectedPipelineName.value = '';

  if (isUpdate.value && data?.record) {
    isFormInitializing.value = true;
    const record = data.record;
    currentGitRepo.value = record.gitRepo || '';
    const repoUrl = record.gitRepo || '';
    const gitFullName = repoUrl ? repoUrl.trim().replace(/\.git$/, '').split(/[\/:=]/).filter(Boolean).slice(-2).join('/') : '';
    selectedRepoName.value = gitFullName || record.name || '';

    let realJobName = record.name || '';
    let realFolder = record.folder || record.projectName || '';
    if (realJobName.includes('/')) {
      const parts = realJobName.split('/');
      realJobName = parts.pop() || realJobName;
      if (!realFolder && parts.length > 0) {
        realFolder = parts.join('/');
      }
    }

    await setFieldsValue({
      jobName: realJobName,
      projectName: realFolder,
      folder: realFolder,
      gitRepo: record.gitRepo || '',
      gitBranch: record.gitBranch || 'main',
      lang: record.lang || 'Java',
      deployEnv: record.deployEnv || 'dev',
      deployType: record.deployType || 'Kube-Cluster-Prod-01',
      enableDelete: !record.enableDelete,
    });

    // 编辑模式下自动反查关联的 Git 实例 ID 与仓库 ID 完成回填
    if (record.gitRepo) {
      try {
        const serverRes: any = await getCodeGitServerList({}, { errorMessageMode: 'none' });
        const servers = serverRes?.items || serverRes || [];
        let matchedRepo: any = null;

        for (const s of servers) {
          if (!s?.id) continue;
          try {
            const repoRes: any = await getCodeGitRepoList({ serverId: s.id }, { errorMessageMode: 'none' });
            const repoList = repoRes?.items || repoRes || [];
            if (Array.isArray(repoList) && repoList.length > 0) {
              const found = repoList.find(
                (r: any) =>
                  r.fullName === gitFullName ||
                  r.cloneUrlSsh === record.gitRepo ||
                  r.cloneUrlHttp === record.gitRepo ||
                  (r.fullName && record.gitRepo.includes(r.fullName)),
              );
              if (found) {
                matchedRepo = found;
                matchedRepo.serverId = matchedRepo.serverId || s.id;
                break;
              }
            }
          } catch (_) { }
        }

        if (matchedRepo) {
          selectedRepoName.value = matchedRepo.fullName || gitFullName;
          await setFieldsValue({ gitServerId: matchedRepo.serverId });
          await nextTick();
          await setFieldsValue({
            gitRepoId: matchedRepo.id,
            gitRepo: record.gitRepo || '',
            gitBranch: record.gitBranch || 'main',
          });
        }
      } catch (_) { }
    }

    // 再次强制赋回 Git 地址和分支，防止 UI 下拉渲染异步事件清理表单
    await nextTick();
    await setFieldsValue({
      jobName: realJobName,
      projectName: realFolder,
      folder: realFolder,
      gitRepo: record.gitRepo || '',
      gitBranch: record.gitBranch || 'main',
    });
    currentGitRepo.value = record.gitRepo || '';
    setTimeout(() => {
      isFormInitializing.value = false;
    }, 800);

    // 编辑Job：获取远端的PiPeline不存数据库 修改完同步至远端
    if (instanceId.value && record.name) {
      try {
        setDrawerProps({ loading: true });
        const remoteRes: any = await getJenkinsJobRemotePipeline({
          instanceId: instanceId.value,
          jobName: realJobName,
          folder: realFolder,
          projectName: realFolder,
        });
        if (remoteRes && remoteRes.pipelineScript) {
          pipelineScript.value = remoteRes.pipelineScript;
        } else {
          pipelineScript.value = `pipeline {\n    agent any\n    stages {\n        stage('Build & Deploy') {\n            steps {\n                echo 'Running pipeline for ${realJobName}'\n            }\n        }\n    }\n}`;
        }
      } catch (e) {
        createMessage.error('拉取远端 Pipeline 失败');
      } finally {
        setDrawerProps({ loading: false });
      }
    }
  } else {
    isFormInitializing.value = false;
    setFieldsValue({
      lang: 'Vue/TS',
      gitBranch: 'main',
      deployEnv: 'dev',
      deployType: 'Kube-Cluster-Prod-01',
      enableDelete: false,
    });
  }
});

async function handleSubmit() {
  try {
    const values = await validate();
    if (!instanceId.value) {
      createMessage.error('未绑定有效的实例 ID');
      return;
    }

    if (!pipelineScript.value || pipelineScript.value.trim() === '') {
      createMessage.warning('流水线 Groovy 脚本内容为空，无法提交');
      return;
    }

    setDrawerProps({ confirmLoading: true });

    // 提交的时候必须先调用validateJenkinsPipeline语法检测 检测失败不允许远端创建
    try {
      const checkRes: any = await validateJenkinsPipeline({
        instanceId: instanceId.value,
        pipelineScript: pipelineScript.value,
      });
      if (!checkRes || !checkRes.valid) {
        setDrawerProps({ confirmLoading: false });
        const errors = Array.isArray(checkRes?.errors) ? checkRes.errors.join('\n') : checkRes?.errors || '语法错误';
        Modal.error({
          title: 'Pipeline 语法检测失败，已阻止远端创建',
          width: 600,
          content: `Jenkins Linter 报错信息如下：\n\n${errors}\n\n请修改后再试！`,
        });
        return;
      }
    } catch (err) {
      setDrawerProps({ confirmLoading: false });
      createMessage.error('语法检测接口连线失败，请核实系统连接');
      return;
    }

    const payload = {
      id: recordId.value || undefined,
      instanceId: instanceId.value,
      deployType: values.deployType,
      deployEnv: values.deployEnv,
      jobName: values.jobName,
      projectName: values.projectName || values.folder || '',
      folder: values.folder || values.projectName || '',
      gitRepo: values.gitRepo || '',
      gitBranch: values.gitBranch || 'main',
      lang: values.lang || 'Java',
      enableDelete: !!values.enableDelete,
      pipelineScript: pipelineScript.value,
    };

    if (isUpdate.value) {
      await updateJenkinsJob(payload);
      createMessage.success(`Job [${values.jobName}] 远程配置及参数同步修改成功！`);
    } else {
      await createJenkinsJob(payload);
      createMessage.success(`Job [${values.jobName}] 成功创建并校验！`);
    }

    closeDrawer();
    emit('success');
  } catch (e) {
  } finally {
    setDrawerProps({ confirmLoading: false });
  }
}
</script>
