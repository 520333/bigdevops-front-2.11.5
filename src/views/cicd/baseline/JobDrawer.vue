<template>
  <BasicDrawer v-bind="$attrs" @register="registerDrawer" showFooter :title="isUpdate ? '编辑JOB' : '新建JOB'" width="70%"
    @ok="handleSubmit" :okText="isUpdate ? '保存并同步' : '立即创建'">
    <div class="flex flex-col gap-4 py-2 px-3">
      <BasicForm @register="registerForm">
        <template #pipelineScriptSlot>
          <div class="flex flex-col gap-2 mt-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span>Jenkinsfile</span>
                <Tag v-if="selectedPipelineName && !isUpdate" color="processing" class="scale-95 font-semibold">
                  模板: {{ selectedPipelineName }}
                </Tag>
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
                <Button size="small" type="dashed" class="border-cyan-500 text-cyan-600 font-medium"
                  @click="handleSyncAllParams">
                  <template #icon>
                    <Icon icon="ant-design:swap-outlined" />
                  </template>
                  同步参数至流水线脚本
                </Button>
                <Button size="small" type="primary" class="bg-indigo-600 border-0 font-medium" :loading="validating"
                  @click="handlePreCheckSyntax">
                  <template #icon>
                    <Icon icon="ant-design:check-circle-outlined" />
                  </template>
                  语法检测
                </Button>
              </Space>
            </div>
            <div
              class="border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-xs hover:border-cyan-500/70 transition-all resize-y"
              style="min-height: 450px; resize: vertical">
              <Codemirror v-model="pipelineScript" placeholder="直接在此输入 Groovy 流水线脚本，或从上方选择现成模板载入..." :style="{
                height: '700px',
                fontSize: '13px',
                fontFamily:
                  '\'JetBrains Mono\', \'Fira Code\', Consolas, \'Courier New\', monospace',
              }" :extensions="pipelineEditorExtensions" />
            </div>
          </div>
        </template>
      </BasicForm>
    </div>
  </BasicDrawer>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue';
import { Tag, Space, Modal } from 'ant-design-vue';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon/Icon.vue';
import { BasicDrawer, useDrawerInner } from '@/components/Drawer';
import { BasicForm, useForm } from '@/components/Form';
import {
  createJenkinsJob,
  updateJenkinsJob,
  getJenkinsJobRemotePipeline,
  validateJenkinsPipeline,
} from '@/api/cicd';
import { getCodeGitRepoList } from '@/api/code/repo';
import { useMessage } from '@/hooks/web/useMessage';
import { Codemirror } from 'vue-codemirror';
import { pipelineEditorExtensions } from '../pipeline/pipeline.data';
import { getJobFormSchema } from './job.data';

const emit = defineEmits(['success', 'register']);
const { createMessage } = useMessage();

const isUpdate = ref(false);
const isFormInitializing = ref(false);
const recordId = ref<number | null>(null);
const instanceId = ref<number | null>(null);
const currentGitRepo = ref('');
const pipelineScript = ref('');
const selectedPipelineName = ref('');
const validating = ref(false);
const selectedRepoName = ref('');
const syntaxStatus = ref<'success' | 'error' | null>(null);

watch(pipelineScript, () => {
  syntaxStatus.value = null;
});

const envNameMap: Record<string, string> = {
  dev: '开发环境',
  test: '测试环境',
  stage: '预发布环境',
  uat: 'UAT环境',
  pre: '灰度环境',
  prod: '生产环境',
};

/** 从脚本中解析当前配置的分支名 */
function parseBranchFromScript(script: string): string {
  if (!script) return '';
  const match = script.match(
    /string\s+defaultValue:\s*['"]([^'"]+)['"],\s*name:\s*['"](?:分支名|GIT分支|gitBranch|branch)['"]/i,
  );
  return match ? match[1].trim() : '';
}

/** 根据 Git 地址单次快速反查 Git 实例与代码仓库并回填表单 */
async function autoMatchGitRepo(repoUrl: string, targetBranch?: string) {
  if (!repoUrl) return;
  try {
    const clean = repoUrl.trim().replace(/\.git$/, '');
    const parts = clean.split(/[/:=]/).filter(Boolean);
    const fullName = parts.slice(-2).join('/');
    const shortName = parts.slice(-1)[0] || '';

    const res: any = await getCodeGitRepoList(
      { name: shortName || fullName },
      { errorMessageMode: 'none' },
    );
    const list = res?.items || (Array.isArray(res) ? res : []);
    const matched = list.find(
      (r: any) =>
        r.fullName === fullName ||
        r.cloneUrlSsh === repoUrl ||
        r.cloneUrlHttp === repoUrl ||
        (fullName && r.fullName && r.fullName.endsWith(fullName)),
    );

    if (matched) {
      selectedRepoName.value = matched.fullName || fullName;
      await setFieldsValue({
        gitServerId: matched.serverID || matched.serverId,
      });
      await nextTick();
      await setFieldsValue({
        gitRepoId: matched.id,
      });
      if (targetBranch) {
        await nextTick();
        await setFieldsValue({ gitBranch: targetBranch });
      }
    }
  } catch {
    // 容错处理
  }
}

/** 从脚本中精准提取指定参数的 choices 列表 */
function parseChoiceParam(script: string, keywords: string[]): string[] {
  if (!script) return [];
  for (const line of script.split('\n')) {
    if (line.includes('choice') && keywords.some((k) => line.includes(k))) {
      const match = line.match(/choices:\s*\[([^\]]*)\]/);
      if (match?.[1]) {
        return Array.from(match[1].matchAll(/['"]([^'"]+)['"]/g), (m) => m[1].trim()).filter(
          Boolean,
        );
      }
    }
  }
  return [];
}

function parseStringParam(script: string, keywords: string[]): string[] {
  if (!script) return [];
  for (const line of script.split('\n')) {
    if (line.includes('string') && keywords.some((k) => line.includes(k))) {
      const match = line.match(/defaultValue:\s*['"]([^'"]*)['"]/);
      if (match?.[1]) {
        return match[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
  }
  return [];
}

/** 将脚本中的参数反显到表单 */
function syncScriptToForm(script: string) {
  if (!script) return;
  let hostChoices = parseStringParam(script, ['目标主机', 'TARGET_HOST', "'host'"]);
  if (hostChoices.length === 0) {
    hostChoices = parseChoiceParam(script, ['目标主机', 'TARGET_HOST', "'host'"]);
  }
  const clusterChoices = parseChoiceParam(script, ["'CLUSTER'", '"CLUSTER"', '目标集群']);
  const updateObj: Record<string, any> = {};
  if (hostChoices.length > 0) updateObj.targetHosts = hostChoices;
  if (clusterChoices.length > 0) updateObj.k8sCluster = clusterChoices;
  if (Object.keys(updateObj).length > 0) setFieldsValue(updateObj);
}

/** 将表单参数实时同步替换进流水线 Groovy 脚本 */
function syncScriptParams(customValues?: any) {
  if (!pipelineScript.value) return;
  const formVals = customValues || getFieldsValue() || {};
  const gitRepo = currentGitRepo.value || formVals.gitRepo;
  const branch = formVals.gitBranch;
  const deployType = formVals.deployType;
  const rawTargetHosts = formVals.targetHosts;
  const targetHosts: string[] = Array.isArray(rawTargetHosts)
    ? rawTargetHosts
    : rawTargetHosts
      ? [rawTargetHosts]
      : [];
  const rawCluster = formVals.k8sCluster;
  const k8sCluster: string[] = Array.isArray(rawCluster)
    ? rawCluster
    : rawCluster
      ? [rawCluster]
      : [];
  const envText = envNameMap[formVals.deployEnv || 'test'] || '测试环境';

  let script = pipelineScript.value;

  // 1. 同步 Git 仓库
  if (gitRepo) {
    script = script.replace(
      /string\s+defaultValue:\s*['"][^'"]*['"],\s*name:\s*['"](GIT仓库|gitRepo|git_repo)['"]/gi,
      `string defaultValue: '${gitRepo}', name: '$1'`,
    );
    script = script.replace(/url:\s*['"][^'"]*['"]/g, `url: '${gitRepo}'`);
    script = script.replace(/git ls-remote -t -h [^\s"'\\]+/g, `git ls-remote -t -h ${gitRepo}`);
  }

  // 2. 同步分支
  if (branch) {
    script = script.replace(
      /string\s+defaultValue:\s*['"][^'"]*['"],\s*name:\s*['"](分支名|GIT分支|gitBranch|branch)['"]/gi,
      `string defaultValue: '${branch}', name: '$1'`,
    );
    script = script.replace(/branch:\s*['"][^'"]*['"]/g, `branch: '${branch}'`);
  }

  // 3. 同步目标主机（主机部署 / docker 部署）
  if ((deployType === 'bin' || deployType === 'docker') && targetHosts.length > 0) {
    const hostsCsv = targetHosts.join(',');
    const hostParamLine = `string defaultValue: '${hostsCsv}', description: '''${hostsCsv}   ---${envText}''', name: '目标主机'`;

    const lines = script.split('\n');
    const hostLineIndex = lines.findIndex(
      (l) =>
        (l.includes('choice') || l.includes('string')) &&
        (l.includes("'目标主机'") || l.includes('"目标主机"') || l.includes('TARGET_HOST')),
    );

    if (hostLineIndex !== -1) {
      const indentMatch = lines[hostLineIndex].match(/^(\s*)/);
      lines[hostLineIndex] = (indentMatch ? indentMatch[1] : '        ') + hostParamLine;
      script = lines.join('\n');
    } else if (/parameters\s*\{/i.test(script)) {
      script = script.replace(/parameters\s*\{/i, `parameters {\n        ${hostParamLine}`);
    }
  }

  // 4. 同步 K8s 集群（k8s 部署）
  if (deployType === 'k8s' && k8sCluster.length > 0) {
    const clusterChoicesStr = k8sCluster.map((c) => `'${c}'`).join(', ');
    const clusterParamLine = `choice choices: [${clusterChoicesStr}], name: 'CLUSTER'`;

    const lines = script.split('\n');
    const clusterLineIndex = lines.findIndex(
      (l) =>
        l.includes('choice') &&
        (l.includes("'CLUSTER'") || l.includes('"CLUSTER"') || l.includes('目标集群')),
    );

    if (clusterLineIndex !== -1) {
      const indentMatch = lines[clusterLineIndex].match(/^(\s*)/);
      lines[clusterLineIndex] = (indentMatch ? indentMatch[1] : '        ') + clusterParamLine;
      script = lines.join('\n');
    } else if (/parameters\s*\{/i.test(script)) {
      script = script.replace(/parameters\s*\{/i, `parameters {\n        ${clusterParamLine}`);
    }
  }

  pipelineScript.value = script;
}

function handleSyncAllParams() {
  const vals = getFieldsValue();
  if (!vals?.gitRepo && !vals?.gitBranch && !vals?.targetHosts && !vals?.k8sCluster) {
    createMessage.warning('请确保已选妥构建参数');
    return;
  }
  if (!pipelineScript.value) {
    createMessage.warning('当前脚本内容为空，无法替换');
    return;
  }
  syncScriptParams();
  createMessage.success('已自动同步替换脚本中的参数配置！');
}

async function validateScript(): Promise<boolean> {
  if (!instanceId.value) {
    createMessage.error('缺少 Jenkins 实例 ID');
    return false;
  }
  if (!pipelineScript.value || pipelineScript.value.trim() === '') {
    createMessage.warning('流水线 Groovy 脚本内容为空，无法提交');
    return false;
  }
  try {
    validating.value = true;
    const res: any = await validateJenkinsPipeline({
      instanceId: instanceId.value,
      pipelineScript: pipelineScript.value,
    });
    if (res?.valid) {
      syntaxStatus.value = 'success';
      return true;
    }
    syntaxStatus.value = 'error';
    const errors = Array.isArray(res?.errors)
      ? res.errors.join('\n')
      : res?.errors || '未知语法异常';
    Modal.error({
      title: 'Pipeline 语法校验未通过',
      width: 580,
      content: `Jenkins Linter 报错信息如下：\n\n${errors}`,
    });
    return false;
  } catch {
    syntaxStatus.value = 'error';
    createMessage.error('语法检测接口连线失败');
    return false;
  } finally {
    validating.value = false;
  }
}

async function handlePreCheckSyntax() {
  const ok = await validateScript();
  if (ok) {
    Modal.success({
      title: '语法检测通过 ✔',
      content: '当前 Pipeline 语法格式完全合规，您可以安全创建或修改。',
    });
  }
}

const schemas = getJobFormSchema({
  isUpdate: () => isUpdate.value,
  isInitializing: () => isFormInitializing.value,
  onPipelineChange: (option) => {
    if (option) {
      selectedPipelineName.value = option.name || option.label || '';
      if (option.pipelineScript) {
        pipelineScript.value = option.pipelineScript;
        syncScriptToForm(option.pipelineScript);
        syncScriptParams();
      }
    } else {
      selectedPipelineName.value = '';
      if (!isUpdate.value) pipelineScript.value = '';
    }
  },
  onRepoChange: (option) => {
    selectedRepoName.value = option.fullName || option.name || '';
    const url = option.cloneUrlSsh || option.cloneUrlHttp || option.webUrl || '';
    if (url) currentGitRepo.value = url;
    if (pipelineScript.value) syncScriptParams();
  },
  onBranchChange: () => {
    if (pipelineScript.value) syncScriptParams();
  },
  onTargetHostsChange: () => {
    if (pipelineScript.value) syncScriptParams();
  },
  onClusterChange: () => {
    if (pipelineScript.value) syncScriptParams();
  },
  onDeployEnvChange: () => {
    if (pipelineScript.value) syncScriptParams();
  },
  onDeployTypeChange: () => {
    if (pipelineScript.value) syncScriptParams();
  },
  getSelectedRepoName: () => selectedRepoName.value,
});

const [registerForm, { validate, resetFields, setFieldsValue, getFieldsValue }] = useForm({
  labelWidth: 120,
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

    let realJobName = record.name || '';
    let realFolder = record.folder || record.projectName || '';
    if (realJobName.includes('/')) {
      const parts = realJobName.split('/');
      realJobName = parts.pop() || realJobName;
      if (!realFolder && parts.length > 0) realFolder = parts.join('/');
    }

    const branchToSet = record.gitBranch || 'main';

    await setFieldsValue({
      gitServerId: record.gitServerId,
      gitRepoId: record.gitRepoId,
      jobName: realJobName,
      projectName: realFolder,
      folder: realFolder,
      gitRepo: record.gitRepo || '',
      gitBranch: branchToSet,
      lang: record.lang || 'Java',
      deployEnv: record.deployEnv || 'dev',
      deployType: record.deployType || 'bin',
      enableDelete: record.enableDelete === 1 ? 1 : 2,
    });

    // 自动回填 Git 实例与代码仓库
    if (record.gitServerId && record.gitRepoId) {
      await setFieldsValue({
        gitServerId: record.gitServerId,
        gitRepoId: record.gitRepoId,
        gitBranch: branchToSet,
      });
    } else if (record.gitRepo) {
      await autoMatchGitRepo(record.gitRepo, branchToSet);
    }

    isFormInitializing.value = false;

    if (instanceId.value && record.name) {
      try {
        setDrawerProps({ loading: true });
        const remoteRes: any = await getJenkinsJobRemotePipeline({
          instanceId: instanceId.value,
          jobName: realJobName,
          folder: realFolder,
          projectName: realFolder,
        });

        const resData = remoteRes?.result || remoteRes?.data || remoteRes || {};
        const script = resData.pipelineScript || '';
        const remoteGitRepo = resData.gitRepo || '';
        if (script) {
          pipelineScript.value = script;
          syncScriptToForm(script);
          const scriptBranch = parseBranchFromScript(script);
          if (scriptBranch) {
            await setFieldsValue({ gitBranch: scriptBranch });
          }
        }
        if (!record.gitRepo && remoteGitRepo) {
          currentGitRepo.value = remoteGitRepo;
          await setFieldsValue({ gitRepo: remoteGitRepo });
          await autoMatchGitRepo(remoteGitRepo, parseBranchFromScript(script) || branchToSet);
        }
      } catch {
        createMessage.error('拉取远端 Pipeline 失败');
      } finally {
        setDrawerProps({ loading: false });
      }
    }
  } else {
    isFormInitializing.value = false;
    setFieldsValue({
      lang: 'Java',
      gitBranch: 'main',
      deployEnv: 'dev',
      deployType: 'bin',
      enableDelete: 2,
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

    setDrawerProps({ confirmLoading: true });

    // 提交保存前，自动将脚本中的参数（Git、分支、目标主机/K8s集群）与表单所选项同步
    syncScriptParams(values);
    const finalScript = pipelineScript.value;

    // 提交前进行语法检测校验，未通过直接拦截
    const isValid = await validateScript();
    if (!isValid) return;

    let validId: number | undefined = undefined;
    if (recordId.value) {
      const parsed = Number(recordId.value);
      if (!isNaN(parsed) && parsed > 0) {
        validId = parsed;
      }
    }

    const payload = {
      id: validId,
      instanceId: Number(instanceId.value) || 0,
      deployType: values.deployType,
      deployEnv: values.deployEnv,
      jobName: values.jobName,
      projectName: values.projectName || values.folder || '',
      folder: values.folder || values.projectName || '',
      gitRepo: values.gitRepo || '',
      gitBranch: values.gitBranch || 'main',
      lang: values.lang || 'Java',
      enableDelete: Number(values.enableDelete) === 1 ? 1 : 2,
      pipelineScript: finalScript,
    };

    if (isUpdate.value) {
      await updateJenkinsJob(payload);
      createMessage.success(`服务基线 [${values.jobName}] 远程配置及参数同步修改成功！`);
    } else {
      await createJenkinsJob(payload);
      createMessage.success(`服务基线 [${values.jobName}] 成功创建！`);
    }

    closeDrawer();
    emit('success');
  } catch (e) {
    console.warn('提交服务基线异常:', e);
  } finally {
    setDrawerProps({ confirmLoading: false });
  }
}
</script>

<style scoped>
:deep(.cm-editor) {
  font-family:
    'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace !important;
  font-size: 13px !important;
  line-height: 1.6 !important;
}

:deep(.cm-content) {
  font-family:
    'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace !important;
  tab-size: 4 !important;
}

:deep(.cm-line) {
  font-family:
    'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace !important;
}
</style>
