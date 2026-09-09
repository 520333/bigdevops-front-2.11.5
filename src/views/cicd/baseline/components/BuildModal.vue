<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="触发生产 Jenkins 构建与部署配置" width="760px" @ok="handleSubmit"
    okText="发起构建部署">
    <div class="px-2 py-1 max-h-[75vh] overflow-y-auto pr-3">
      <div
        class="mb-3 p-3 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
        <strong>生产构建提示：</strong>已对齐生产项目全量构建参数。如后续有新扩展参数，可在下方动态添加。
      </div>

      <BasicForm @register="registerForm" />

      <!-- 动态扩展参数区域 (保证后期新增参数零代码修改) -->
      <div class="mt-4 border-t pt-3 border-gray-200 dark:border-gray-800">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Icon icon="ant-design:plus-circle-outlined" class="text-blue-500" />
            自定义动态扩展参数 (支持后期自由扩充未知/新构建变量)
          </span>
          <Button size="small" type="dashed" @click="handleAddCustomParam">
            + 添加构建参数
          </Button>
        </div>

        <div v-if="customParamList.length === 0" class="text-xs text-gray-400 py-1 italic">
          暂无动态扩展参数，如需额外变量可点击上方按钮自由添加。
        </div>

        <div v-for="(item, index) in customParamList" :key="index" class="flex items-center gap-2 mb-2">
          <Input v-model:value="item.key" placeholder="参数名 (如 MAVEN_OPTS)" size="small" class="w-5/12" />
          <Input v-model:value="item.value" placeholder="参数值 (如 -Xmx512m)" size="small" class="w-5/12" />
          <Button size="small" type="link" danger @click="handleRemoveCustomParam(index)">
            删除
          </Button>
        </div>
      </div>
    </div>
  </BasicModal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Input } from 'ant-design-vue';
import { BasicModal, useModalInner } from '@/components/Modal';
import { BasicForm, useForm, FormSchema } from '@/components/Form';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon/Icon.vue';
import { getRepoBranches } from '@/api/code/repo';

const emit = defineEmits(['confirm', 'register']);
const instanceId = ref<number | null>(null);
const currentRecord = ref<any>(null);
const customParamList = ref<Array<{ key: string; value: string }>>([]);

function handleAddCustomParam() {
  customParamList.value.push({ key: '', value: '' });
}

function handleRemoveCustomParam(index: number) {
  customParamList.value.splice(index, 1);
}

function extractGitFullName(url: string) {
  if (!url) return '';
  let clean = url.trim().replace(/\.git$/, '');
  if (clean.includes('://')) {
    const idx = clean.indexOf('://');
    clean = clean.substring(idx + 3);
  }
  if (clean.includes('@')) {
    clean = clean.substring(clean.indexOf('@') + 1);
  }
  if (clean.includes(':')) {
    const parts = clean.split(':');
    clean = parts[parts.length - 1];
  }
  if (clean.includes('/')) {
    const parts = clean.split('/').filter(Boolean);
    if (parts.length > 1 && /^\d+$/.test(parts[0])) {
      parts.shift();
    }
    return parts.join('/');
  }
  return clean;
}

const schemas: FormSchema[] = [
  {
    field: 'scanCode',
    label: '扫描代码',
    component: 'Checkbox',
    helpMessage: '是否对分支代码质量扫描、安全性静态分析',
    colProps: { span: 24 },
    componentProps: {
      placeholder: '是否对分支代码质量扫描、安全性静态分析',
    },
  },
  {
    field: 'gitBranch',
    label: '分支名',
    component: 'ApiSelect',
    required: true,
    colProps: { span: 12 },
    componentProps: ({ formModel }) => {
      return {
        showSearch: true,
        optionFilterProp: 'name',
        api: async () => {
          const gitRepo = formModel?.gitRepo || currentRecord.value?.gitRepo || '';
          const gitFullName = extractGitFullName(gitRepo);
          if (!gitRepo) {
            return [{ name: currentRecord.value?.gitBranch || 'dev' }, { name: 'main' }, { name: 'master' }];
          }
          try {
            const res: any = await getRepoBranches({ fullName: gitFullName || gitRepo }, { errorMessageMode: 'none' });
            const list = res?.items || res || [];
            if (Array.isArray(list) && list.length > 0) {
              return list;
            }
            return [{ name: currentRecord.value?.gitBranch || 'dev' }, { name: 'main' }, { name: 'master' }];
          } catch (err) {
            return [{ name: currentRecord.value?.gitBranch || 'dev' }, { name: 'main' }, { name: 'master' }];
          }
        },
        labelField: 'name',
        valueField: 'name',
        placeholder: '实时拉取 Git 仓库真实分支...',
      };
    },
  },
  {
    field: 'buildNode',
    label: '构建节点',
    component: 'Select',
    required: true,
    colProps: { span: 12 },
    componentProps: {
      placeholder: '选择 Jenkins 执行节点',
      options: [
        { label: 'master', value: 'master' },
        { label: 'slave-01', value: 'slave-01' },
        { label: 'slave-02', value: 'slave-02' },
      ],
    },
  },
  {
    field: 'gitRepo',
    label: 'GIT仓库',
    component: 'Input',
    required: true,
    colProps: { span: 24 },
    componentProps: {
      placeholder: '请输入克隆的 Git 仓库 URL',
    },
  },
  {
    field: 'jdkVersion',
    label: 'JDK版本',
    component: 'Select',
    required: true,
    colProps: { span: 12 },
    componentProps: {
      placeholder: '选择 JDK 版本',
      options: [
        { label: 'jdk17 (Jdk17--default)', value: 'jdk17' },
        { label: 'jdk8 (Jdk8--legacy)', value: 'jdk8' },
        { label: 'jdk11 (Jdk11--lts)', value: 'jdk11' },
        { label: 'jdk21 (Jdk21--latest)', value: 'jdk21' },
      ],
    },
  },
  {
    field: 'configFile',
    label: '配置文件',
    component: 'Select',
    required: true,
    colProps: { span: 12 },
    componentProps: {
      placeholder: '选择配置文件/环境',
      options: [
        { label: 'test (test ---测试)', value: 'test' },
        { label: 'dev (dev ---开发)', value: 'dev' },
        { label: 'stage (stage ---预发)', value: 'stage' },
        { label: 'prod (prod ---生产)', value: 'prod' },
      ],
    },
  },
  {
    field: 'buildCommand',
    label: '构建命令',
    component: 'Input',
    required: true,
    colProps: { span: 24 },
    componentProps: {
      placeholder: 'mvn clean package -Dmaven.test.skip=true -T 1C -q',
    },
  },
  {
    field: 'module',
    label: '模块',
    component: 'Input',
    required: true,
    colProps: { span: 12 },
    componentProps: {
      placeholder: '.',
    },
  },
  {
    field: 'port',
    label: '监听端口',
    component: 'Select',
    required: true,
    colProps: { span: 12 },
    componentProps: {
      placeholder: '选择监听端口',
      options: [
        { label: '8080', value: '8080' },
        { label: '8081', value: '8081' },
        { label: '8082', value: '8082' },
        { label: '9090', value: '9090' },
        { label: '3000', value: '3000' },
      ],
    },
  },
  {
    field: 'targetHost',
    label: '目标主机',
    component: 'Select',
    required: true,
    colProps: { span: 24 },
    componentProps: {
      placeholder: '选择部署目标主机 IP',
      options: [
        { label: '172.30.7.127 (172.30.7.127 ---测试环境)', value: '172.30.7.127' },
        { label: '172.31.0.188 (172.31.0.188 ---管理后台)', value: '172.31.0.188' },
        { label: '172.31.5.175 (172.31.5.175 ---监控节点)', value: '172.31.5.175' },
        { label: '192.168.10.240 (192.168.10.240 ---本地集群)', value: '192.168.10.240' },
      ],
    },
  },
];

const [registerForm, { validate, setFieldsValue, resetFields }] = useForm({
  labelWidth: 100,
  schemas,
  showActionButtonGroup: false,
});

const [registerModal, { setModalProps, closeModal }] = useModalInner((data) => {
  resetFields();
  customParamList.value = [];
  setModalProps({ confirmLoading: false });
  instanceId.value = data?.instanceId || null;
  currentRecord.value = data?.record || null;

  setFieldsValue({
    scanCode: false,
    gitBranch: data?.record?.gitBranch || 'dev',
    gitRepo: data?.record?.gitRepo || 'ssh://git@gitlab.cathayquantum.net:222/assetGroug/umipay/umipay-service.git',
    buildNode: 'master',
    jdkVersion: 'jdk17',
    buildCommand: 'mvn clean package -Dmaven.test.skip=true -T 1C -q',
    module: '.',
    configFile: 'test',
    port: '8080',
    targetHost: '172.30.7.127',
  });
});

async function handleSubmit() {
  try {
    const values = await validate();
    closeModal();
    const rawName = currentRecord.value?.name || currentRecord.value?.jobName || '';
    const shortJobName = rawName.includes('/') ? rawName.split('/').pop()! : rawName;
    const folder = currentRecord.value?.folder || currentRecord.value?.projectName || (rawName.includes('/') ? rawName.split('/')[0] : '');

    const customParamsMap: Record<string, string> = {};
    customParamList.value.forEach((item) => {
      if (item.key && item.key.trim() !== '') {
        customParamsMap[item.key.trim()] = item.value || '';
      }
    });

    emit('confirm', {
      instanceId: instanceId.value,
      jobName: shortJobName,
      fullName: rawName,
      folder: folder,
      projectName: folder,
      branch: values.gitBranch,
      deployEnv: values.configFile || values.deployEnv,
      deployType: values.targetHost || values.deployType,
      gitRepo: values.gitRepo,
      scanCode: values.scanCode || false,
      buildNode: values.buildNode || 'master',
      jdkVersion: values.jdkVersion || 'jdk17',
      buildCommand: values.buildCommand || '',
      module: values.module || '.',
      configFile: values.configFile || 'test',
      port: values.port || '8080',
      targetHost: values.targetHost || '172.30.7.127',
      customParams: customParamsMap,
      record: currentRecord.value,
    });
  } catch (e) { }
}
</script>
