import { BasicColumn, FormSchema } from '@/components/Table';
import { h } from 'vue';
import { Tag } from 'ant-design-vue';
import { getJenkinsPipelineList } from '@/api/cicd';
import { getCodeGitServerList } from '@/api/code/server';
import { getCodeGitRepoList, getRepoBranches } from '@/api/code/repo';
import { getResourceEcsList, getK8sClusterList } from '@/api/demo/system';
import dayjs from 'dayjs';

export const columns: BasicColumn[] = [
  {
    title: '项目名称',
    dataIndex: 'projectName',
    key: 'projectName',
    width: 140,
    align: 'left',
    customRender: ({ record }) => {
      const val = record.projectName || record.folder;
      if (!val) return h('span', { class: 'text-gray-400 text-xs italic' }, '/');
      return h(
        Tag,
        { color: 'cyan', class: 'font-mono text-xs px-2 py-0.5 rounded shadow-xs' },
        () => `${val}`,
      );
    },
  },
  {
    title: '服务名',
    dataIndex: 'name',
    key: 'name',
    width: 180,
    align: 'left',
    customRender: ({ record }) => {
      let name = record?.name || '';
      const proj = record?.projectName || record?.folder || '';
      if (proj && name.startsWith(proj + '/')) {
        name = name.substring(proj.length + 1);
      } else if (name.includes('/')) {
        name = name.substring(name.lastIndexOf('/') + 1);
      }
      return h(
        'span',
        { class: 'font-bold font-mono text-gray-800 dark:text-gray-100' },
        name || '-',
      );
    },
  },
  {
    title: '语言',
    dataIndex: 'lang',
    key: 'lang',
    width: 80,
    align: 'center',
    customRender: ({ text }) => {
      const lang = text || 'Java';
      const colorMap: Record<string, string> = {
        Java: 'orange',
        'Vue/TS': 'green',
        Go: 'blue',
        Python: 'purple',
        Shell: 'cyan',
      };
      return h(
        Tag,
        { color: colorMap[lang] || 'default', class: 'font-semibold rounded px-2' },
        () => lang,
      );
    },
  },
  {
    title: 'git地址',
    dataIndex: 'gitRepo',
    key: 'gitRepo',
    width: 300,
    align: 'left',
    ellipsis: true,
  },
  {
    title: '最后构建分支',
    dataIndex: 'gitBranch',
    key: 'gitBranch',
    width: 130,
    align: 'center',
    customRender: ({ text }) => {
      const branch = text || 'main';
      return h(
        Tag,
        { color: 'processing', class: 'font-mono rounded px-2 font-semibold' },
        () => `${branch}`,
      );
    },
  },
  {
    title: '最后构建号',
    dataIndex: 'count',
    key: 'count',
    width: 60,
    align: 'center',
    customRender: ({ text }) => {
      if (!text) return h('span', { class: 'text-gray-400 text-xs italic' }, '暂无构建');
      return h(
        'span',
        {
          class:
            'font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800',
        },
        `#${text}`,
      );
    },
  },
  {
    title: '构建状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
    align: 'center',
    customRender: ({ text }) => {
      const status = text || 'NOT_BUILT';
      const colorMap: Record<string, string> = {
        SUCCESS: 'success',
        FAILURE: 'error',
        BUILDING: 'processing',
        ABORTED: 'warning',
        NOT_BUILT: 'default',
      };
      return h(
        Tag,
        {
          color: colorMap[status] || 'default',
          class: status === 'BUILDING' ? 'animate-pulse font-semibold' : 'font-semibold',
        },
        () => status,
      );
    },
  },
  {
    title: '最后构建时间',
    dataIndex: 'lastBuildTime',
    format: (text) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '';
    },
    width: 100,
  },
  {
    title: '构建人',
    dataIndex: 'createUserName',
    key: 'createUserName',
    width: 50,
    align: 'center',
  },
];

export const searchFormSchema: FormSchema[] = [
  {
    field: 'instanceId',
    label: 'Jenkins 实例',
    component: 'Select',
    required: true,
    colProps: { span: 6 },
    componentProps: {
      placeholder: '请选择 Jenkins 实例',
    },
  },
  {
    field: 'name',
    label: '服务名',
    component: 'Input',
    colProps: { span: 5 },
    componentProps: {
      placeholder: '模糊搜索服务名称',
      allowClear: true,
    },
  },
  {
    field: 'projectName',
    label: '项目名称',
    component: 'Input',
    colProps: { span: 5 },
    componentProps: {
      placeholder: '搜索项目空间名称',
      allowClear: true,
    },
  },
  {
    field: 'status',
    label: '构建状态',
    component: 'Select',
    colProps: { span: 4 },
    componentProps: {
      placeholder: '状态筛选',
      allowClear: true,
      options: [
        { label: '全部', value: '' },
        { label: 'SUCCESS (成功)', value: 'SUCCESS' },
        { label: 'FAILURE (失败)', value: 'FAILURE' },
        { label: 'BUILDING (构建中)', value: 'BUILDING' },
        { label: 'ABORTED (中断)', value: 'ABORTED' },
        { label: 'NOT_BUILT (未构建)', value: 'NOT_BUILT' },
      ],
    },
  },
  {
    field: 'deployEnv',
    label: '部署环境',
    component: 'Select',
    colProps: { span: 4 },
    componentProps: {
      placeholder: '选择部署环境',
      allowClear: true,
      options: [
        { label: 'dev | 开发环境', value: 'dev' },
        { label: 'test | 测试环境', value: 'test' },
        { label: 'stage | 预发布环境', value: 'stage' },
        { label: 'uat | UAT环境', value: 'uat' },
        { label: 'pre | 灰度环境', value: 'pre' },
        { label: 'prod | 生产环境', value: 'prod' },
      ],
    },
  },
  {
    field: 'gitRepo',
    label: 'git地址',
    component: 'Input',
    colProps: { span: 6 },
    componentProps: {
      placeholder: 'git 仓库模糊搜索',
      allowClear: true,
    },
  },
  {
    field: 'lang',
    label: '语言',
    component: 'Select',
    colProps: { span: 5 },
    componentProps: {
      placeholder: '技术语言栈',
      allowClear: true,
      options: [
        { label: 'Java', value: 'Java' },
        { label: 'Vue/TS', value: 'Vue/TS' },
        { label: 'Go', value: 'Go' },
        { label: 'Python', value: 'Python' },
        { label: 'Shell', value: 'Shell' },
      ],
    },
  },
];

export interface JobFormCallbacks {
  isUpdate: () => boolean;
  isInitializing: () => boolean;
  onPipelineChange?: (option: any) => void;
  onRepoChange?: (option: any) => void;
  onBranchChange?: (branch: string) => void;
  onTargetHostsChange?: (hosts: string[], formModel: any) => void;
  onClusterChange?: (clusters: string[], formModel: any) => void;
  onDeployEnvChange?: (env: string) => void;
  onDeployTypeChange?: (type: string) => void;
  getSelectedRepoName?: () => string;
}

/**
 * 获取服务基线表单 Schema（严格遵循 Vben 联动规范）
 */
export function getJobFormSchema(callbacks?: JobFormCallbacks): FormSchema[] {
  return [
    {
      field: 'pipelineId',
      label: '流水线模版',
      component: 'ApiSelect',
      ifShow: () => !callbacks?.isUpdate?.(),
      colProps: { span: 24 },
      componentProps: ({ formModel }) => ({
        api: getJenkinsPipelineList,
        resultField: 'items',
        labelField: 'name',
        valueField: 'id',
        showSearch: true,
        allowClear: true,
        optionFilterProp: 'label',
        placeholder: '选择已装配的流水线模版',
        onChange: (_val: any, option: any) => {
          if (callbacks?.isInitializing?.()) return;
          if (_val && option) {
            callbacks?.onPipelineChange?.(option);
            if (option.lang) {
              formModel.lang = option.lang;
            }
          } else {
            callbacks?.onPipelineChange?.(null);
          }
        },
      }),
    },
    {
      field: 'gitServerId',
      label: 'Git 实例',
      component: 'ApiSelect',
      // required: true,
      colProps: { span: 8 },
      componentProps: ({ formModel }) => ({
        api: getCodeGitServerList,
        resultField: 'items',
        labelField: 'name',
        valueField: 'id',
        showSearch: true,
        allowClear: true,
        optionFilterProp: 'label',
        placeholder: '选择代码源',
        onChange: () => {
          if (callbacks?.isInitializing?.()) return;
          formModel.gitRepoId = undefined;
          formModel.gitRepo = undefined;
          formModel.gitBranch = undefined;
        },
      }),
    },
    {
      field: 'gitRepoId',
      label: '代码仓库',
      component: 'ApiSelect',
      // required: true,
      colProps: { span: 16 },
      componentProps: ({ formModel }) => ({
        api: getCodeGitRepoList,
        params: { serverId: formModel.gitServerId },
        resultField: 'items',
        labelField: 'fullName',
        valueField: 'id',
        showSearch: true,
        allowClear: true,
        dropdownMatchSelectWidth: false,
        dropdownStyle: { minWidth: '450px' },
        optionFilterProp: 'label',
        placeholder: '定位项目仓库',
        disabled: !formModel.gitServerId && !callbacks?.isUpdate?.(),
        onChange: (_val: any, option: any) => {
          if (callbacks?.isInitializing?.()) return;
          if (_val && option) {
            const fullName = option.fullName || option.name || '';
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
            }
            callbacks?.onRepoChange?.(option);
          }
        },
      }),
    },
    {
      field: 'gitRepo',
      label: 'GIT 地址',
      component: 'Input',
      required: true,
      colProps: { span: 16 },
      componentProps: {
        placeholder: '例如：git@192.168.50.100:group/repo.git',
      },
    },
    {
      field: 'gitBranch',
      label: 'Git 分支',
      component: 'ApiSelect',
      required: true,
      colProps: { span: 8 },
      defaultValue: 'main',
      componentProps: ({ formModel }) => {
        const repoUrl = formModel.gitRepo || '';
        const gitFullName =
          callbacks?.getSelectedRepoName?.() ||
          (repoUrl
            ? repoUrl
              .trim()
              .replace(/\.git$/, '')
              .split(/[/:=]/)
              .filter(Boolean)
              .slice(-2)
              .join('/')
            : '');
        return {
          api: async (params: any) => {
            if (!params?.serverId && !params?.fullName && !params?.repoId) {
              return [];
            }
            try {
              const res: any = await getRepoBranches(params, { errorMessageMode: 'none' });
              const list = res?.items || res || [];
              return Array.isArray(list) ? list : [];
            } catch (_) {
              return [];
            }
          },
          params: {
            serverId: formModel.gitServerId,
            repoId: formModel.gitRepoId,
            fullName: gitFullName,
          },
          defaultOptions: formModel.gitBranch ? [{ name: formModel.gitBranch }] : [],
          alwaysLoad: true,
          resultField: '',
          labelField: 'name',
          valueField: 'name',
          showSearch: true,
          dropdownMatchSelectWidth: false,
          dropdownStyle: { minWidth: '300px' },
          optionFilterProp: 'name',
          placeholder: '发布默认分支',
          onChange: (val: any) => {
            if (callbacks?.isInitializing?.()) return;
            callbacks?.onBranchChange?.(val);
          },
        };
      },
    },
    {
      field: 'projectName',
      label: '项目名称',
      component: 'Input',
      helpMessage: 'Jenkins 下会基于该名称创建目录/Folder（若不填写则在根目录创建）',
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
        placeholder: '服务唯一标识名称',
      },
    },
    {
      field: 'lang',
      label: '语言类型',
      component: 'Select',
      defaultValue: 'Java',
      colProps: { span: 8 },
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
        onChange: (val: any) => {
          if (callbacks?.isInitializing?.()) return;
          callbacks?.onDeployEnvChange?.(val);
        },
      },
    },
    {
      field: 'deployType',
      label: '部署类型',
      component: 'Select',
      required: true,
      defaultValue: 'bin',
      colProps: { span: 8 },
      componentProps: {
        options: [
          { label: '主机', value: 'bin' },
          { label: 'docker', value: 'docker' },
          { label: 'k8s', value: 'k8s' },
        ],
        onChange: (val: any) => {
          if (callbacks?.isInitializing?.()) return;
          callbacks?.onDeployTypeChange?.(val);
        },
      },
    },
    {
      field: 'enableDelete',
      label: '安全防护锁',
      component: 'Switch',
      defaultValue: 2,
      colProps: { span: 8 },
      componentProps: {
        checkedValue: 1,
        unCheckedValue: 2,
        checkedChildren: '允许删除',
        unCheckedChildren: '禁止删除 (默认)',
      },
      helpMessage: ['开启后允许删除操作，禁用时阻止删除'],
    },
    {
      field: 'targetHosts',
      label: '目标主机',
      component: 'ApiSelect',
      ifShow: ({ values }) => values.deployType === 'bin' || values.deployType === 'docker',
      colProps: { span: 24 },
      componentProps: ({ formModel }) => ({
        api: async (params: any) => {
          const res: any = await getResourceEcsList({ pageSize: 100, ...params });
          if (res && res.items) {
            res.items.forEach((item: any) => {
              const ip = item.PrivateIpAddress?.[0] || item.ip || item.value || '无私网IP';
              item.titleWithIp = `${item.title || item.InstanceName || item.label || '主机'} (${ip})`;
              item.submitIpValue = ip;
            });
          }
          return res;
        },
        mode: 'multiple',
        labelField: 'titleWithIp',
        valueField: 'submitIpValue',
        resultField: 'items',
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: '请选择目标主机 (支持按名称或IP搜索，可多选)',
        onChange: (val: any) => {
          if (callbacks?.isInitializing?.()) return;
          callbacks?.onTargetHostsChange?.(val, formModel);
        },
      }),
    },
    {
      field: 'k8sCluster',
      label: '目标集群',
      component: 'ApiSelect',
      ifShow: ({ values }) => values.deployType === 'k8s',
      colProps: { span: 24 },
      componentProps: ({ formModel }) => ({
        api: async (params: any) => {
          const res: any = await getK8sClusterList({ pageSize: 100, ...params });
          if (res && res.items) {
            res.items.forEach((item: any) => {
              item.labelWithZh = `${item.nameZh || item.name} (${item.name})`;
            });
          }
          return res;
        },
        mode: 'multiple',
        labelField: 'labelWithZh',
        valueField: 'name',
        resultField: 'items',
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: '请选择 K8s 目标集群 (支持搜索，可多选)',
        onChange: (val: any) => {
          if (callbacks?.isInitializing?.()) return;
          callbacks?.onClusterChange?.(val, formModel);
        },
      }),
    },
    {
      field: 'pipelineScript',
      label: '',
      component: 'Input',
      colProps: { span: 24 },
      slot: 'pipelineScriptSlot',
    },
  ];
}

export const formSchema: FormSchema[] = getJobFormSchema();
