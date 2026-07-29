<template>
  <BasicModal
    v-bind="$attrs"
    @register="registerModal"
    title="触发 Jenkins 构建与部署配置"
    width="650px"
    @ok="handleSubmit"
    okText="发起构建部署"
  >
    <div class="px-2 py-1">
      <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
        <strong>提示：</strong>您可在本次构建中覆写本次编译要拉取的<strong>目标分支、部署的CMDB环境集群</strong>等临时变量参数。
      </div>
      <BasicForm @register="registerForm" />
    </div>
  </BasicModal>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { BasicForm, useForm, FormSchema } from '@/components/Form';
  import { getRepoBranches } from '@/api/code/repo';
  import { getResourceEcsList } from '@/api/demo/system';

  const emit = defineEmits(['confirm', 'register']);
  const instanceId = ref<number | null>(null);
  const currentRecord = ref<any>(null);

  function extractGitFullName(url: string) {
    if (!url) return '';
    const clean = url.trim().replace(/\.git$/, '');
    const parts = clean.split(/[\/:=]/).filter(Boolean);
    if (parts.length >= 2) {
      return parts.slice(-2).join('/');
    }
    return clean;
  }

  const schemas: FormSchema[] = [
    {
      field: 'jobName',
      label: '服务名',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      field: 'deployEnv',
      label: '部署环境',
      component: 'Select',
      required: true,
      colProps: { span: 12 },
      componentProps: {
        placeholder: '发版环境',
        options: [
          { label: 'dev | 开发环境', value: 'dev' },
          { label: 'test | 测试环境', value: 'test' },
          { label: 'stage | 预发布环境', value: 'stage' },
          { label: 'uat | UAT验收', value: 'uat' },
          { label: 'pre | 灰度集群', value: 'pre' },
          { label: 'prod | 生产干流', value: 'prod' },
        ],
      },
    },
    {
      field: 'deployType',
      label: '部署类型(CMDB)',
      component: 'ApiSelect',
      required: true,
      colProps: { span: 12 },
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
            // Ignore error and fall back
          }
          return [
            { label: 'K8S - 容器微服务集群 (Kube-Cluster-Prod-01)', value: 'Kube-Cluster-Prod-01' },
            { label: 'K8S - 弹性容器测试集群 (Kube-Cluster-Test-02)', value: 'Kube-Cluster-Test-02' },
            { label: 'Host - 生产直结物理节点 (192.168.50.10)', value: '192.168.50.10' },
          ];
        },
        placeholder: '从 CMDB 获取目标 IP / 容器集群',
      },
    },
    {
      field: 'gitRepo',
      label: 'Git仓库地址',
      component: 'Input',
      required: true,
      componentProps: {
        placeholder: '请输入克隆的 Git 仓库 URL',
      },
    },
    {
      field: 'gitBranch',
      label: '构建分支',
      component: 'ApiSelect',
      required: true,
      componentProps: () => {
        return {
          showSearch: true,
          optionFilterProp: 'name',
          api: async () => {
            const gitRepo = currentRecord.value?.gitRepo || '';
            const gitFullName = extractGitFullName(gitRepo);
            if (!gitFullName) {
              return [{ name: currentRecord.value?.gitBranch || 'main' }];
            }
            try {
              const res: any = await getRepoBranches({ fullName: gitFullName }, { errorMessageMode: 'none' });
              const list = res?.items || res || [];
              if (Array.isArray(list) && list.length > 0) {
                return list;
              }
              return [{ name: currentRecord.value?.gitBranch || 'main' }, { name: 'develop' }, { name: 'master' }];
            } catch (err) {
              return [{ name: currentRecord.value?.gitBranch || 'main' }, { name: 'develop' }, { name: 'master' }];
            }
          },
          labelField: 'name',
          valueField: 'name',
          placeholder: '拉取并选择发布分支',
        };
      },
    },
  ];

  const [registerForm, { validate, setFieldsValue, resetFields }] = useForm({
    labelWidth: 120,
    schemas,
    showActionButtonGroup: false,
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner((data) => {
    resetFields();
    setModalProps({ confirmLoading: false });
    instanceId.value = data?.instanceId || null;
    currentRecord.value = data?.record || null;

    setFieldsValue({
      jobName: data?.record?.name || '',
      deployEnv: data?.record?.deployEnv || 'dev',
      deployType: data?.record?.deployType || 'Kube-Cluster-Prod-01',
      gitRepo: data?.record?.gitRepo || '',
      gitBranch: data?.record?.gitBranch || 'main',
    });
  });

  async function handleSubmit() {
    try {
      const values = await validate();
      closeModal();
      const rawName = currentRecord.value?.name || currentRecord.value?.jobName || '';
      const shortJobName = rawName.includes('/') ? rawName.split('/').pop()! : rawName;
      const folder = currentRecord.value?.folder || currentRecord.value?.projectName || (rawName.includes('/') ? rawName.split('/')[0] : '');
      emit('confirm', {
        instanceId: instanceId.value,
        jobName: shortJobName,
        fullName: rawName,
        folder: folder,
        projectName: folder,
        branch: values.gitBranch,
        deployEnv: values.deployEnv,
        deployType: values.deployType,
        gitRepo: values.gitRepo,
        record: currentRecord.value,
      });
    } catch (e) {}
  }
</script>
