import { BasicColumn, FormSchema } from '@/components/Table';
import { h } from 'vue';
import { Tag } from 'ant-design-vue';
import { getJenkinsPipelineList } from '@/api/cicd/pipeline';
import { getCodeGitServerList } from '@/api/code/server';
import { getCodeGitRepoList } from '@/api/code/repo';

export const columns: BasicColumn[] = [
  {
    title: '项目名称',
    dataIndex: 'projectName',
    key: 'projectName',
    width: 160,
    align: 'left',
    customRender: ({ record }) => {
      const val = record.projectName || record.folder;
      if (!val) return h('span', { class: 'text-gray-400 text-xs italic' }, '/');
      return h(Tag, { color: 'cyan', class: 'font-mono text-xs px-2 py-0.5 rounded shadow-sm' }, () => `${val}`);
    },
  },
  {
    title: '服务名',
    dataIndex: 'name',
    key: 'name',
    width: 180,
    align: 'left',
  },
  {
    title: '语言',
    dataIndex: 'lang',
    key: 'lang',
    width: 120,
    align: 'center',
    customRender: ({ text }) => {
      const lang = text || 'Java';
      return h(Tag, { color: lang === 'Java' ? 'orange' : lang === 'Vue/TS' ? 'green' : lang === 'Go' ? 'blue' : 'purple' }, () => lang);
    },
  },
  {
    title: 'git地址',
    dataIndex: 'gitRepo',
    key: 'gitRepo',
    width: 220,
    align: 'left',
    ellipsis: true,
  },
  {
    title: '分支',
    dataIndex: 'gitBranch',
    key: 'gitBranch',
    width: 120,
    align: 'center',
    customRender: ({ text }) => {
      const branch = text || 'main';
      return h(Tag, { color: 'processing', class: 'font-mono rounded px-2 font-semibold' }, () => `${branch}`);
    },
  },
  {
    title: '构建状态',
    dataIndex: 'status',
    key: 'status',
    width: 140,
    align: 'center',
  },
  {
    title: '最新构建号',
    dataIndex: 'count',
    key: 'count',
    width: 120,
    align: 'center',
  },
  {
    title: '构建人',
    dataIndex: 'createUserName',
    key: 'createUserName',
    width: 120,
    align: 'center',
    customRender: ({ text }) => {
      return text ? h('span', { class: 'font-medium text-gray-700 dark:text-gray-300' }, `${text}`) : h('span', { class: 'text-gray-400 text-xs' }, '-');
    },
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
    label: '语言栈',
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
  {
    field: 'keyword',
    label: '仓库地址',
    component: 'Input',
    colProps: { span: 5 },
    componentProps: {
      placeholder: '按仓库/关键字串查',
      allowClear: true,
    },
  },
];

export const formSchema: FormSchema[] = [
  {
    field: 'pipelineId',
    label: '流水线模版',
    component: 'ApiSelect',
    colProps: { span: 24 },
    componentProps: {
      api: getJenkinsPipelineList,
      resultField: 'items',
      labelField: 'name',
      valueField: 'id',
      showSearch: true,
      allowClear: true,
      placeholder: '选择已装配的流水线模版',
    },
  },
  {
    field: 'gitServerId',
    label: 'Git 实例',
    component: 'ApiSelect',
    colProps: { span: 8 },
    componentProps: {
      api: getCodeGitServerList,
      resultField: 'items',
      labelField: 'name',
      valueField: 'id',
      showSearch: true,
      allowClear: true,
      placeholder: '选择代码源',
    },
  },
  {
    field: 'gitRepoId',
    label: '代码仓库',
    component: 'ApiSelect',
    colProps: { span: 9 },
    componentProps: ({ formModel }) => {
      return {
        api: getCodeGitRepoList,
        params: {
          serverId: formModel.gitServerId,
        },
        resultField: 'items',
        labelField: 'fullName',
        valueField: 'id',
        showSearch: true,
        allowClear: true,
        placeholder: '定位项目仓库',
      };
    },
  },
  {
    field: 'gitBranch',
    label: 'Git 分支',
    component: 'Input',
    required: true,
    colProps: { span: 7 },
    defaultValue: 'main',
    componentProps: {
      placeholder: '发布默认分支',
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
    helpMessage: "jenkins下会基于该名称创建文件夹,不输入则不创建文件夹",
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
    component: 'Input',
    required: true,
    defaultValue: '主机IP/容器集群',
    colProps: { span: 16 },
    componentProps: {
      placeholder: '请输入主机IP或容器集群',
    },
  },
  {
    field: 'enableDelete',
    label: '安全防护锁',
    component: 'Switch',
    defaultValue: false,
    colProps: { span: 8 },
    componentProps: {
      checkedChildren: '已解开',
      unCheckedChildren: '锁定',
    },
  },
  {
    field: 'pipelineScript',
    label: '',
    component: 'Input',
    colProps: { span: 24 },
    slot: 'pipelineScriptSlot',
  },
];
