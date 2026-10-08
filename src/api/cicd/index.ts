import { defHttp } from '@/utils/http/axios';

enum Api {
  getJenkinsInstanceList = '/api/cicd/getJenkinsInstanceList',
  getJenkinsInstanceDetail = '/api/cicd/getJenkinsInstanceDetail',
  createJenkinsInstance = '/api/cicd/createJenkinsInstance',
  updateJenkinsInstance = '/api/cicd/updateJenkinsInstance',
  deleteJenkinsInstance = '/api/cicd/deleteJenkinsInstance',

  getJenkinsJobList = '/api/cicd/getJenkinsJobList',
  createJenkinsJob = '/api/cicd/createJenkinsJob',
  updateJenkinsJob = '/api/cicd/updateJenkinsJob',
  deleteJenkinsJob = '/api/cicd/deleteJenkinsJob',
  triggerJenkinsBuild = '/api/cicd/triggerJenkinsBuild',
  stopJenkinsBuild = '/api/cicd/stopJenkinsBuild',
  getJenkinsBuildLogs = '/api/cicd/getJenkinsBuildLogs',

  // 完整重构补充专属高灵动能力接口
  getJenkinsJobRemotePipeline = '/api/cicd/getJenkinsJobRemotePipeline',
  toggleJenkinsJobDeleteLock = '/api/cicd/toggleJenkinsJobDeleteLock',
  validateJenkinsPipeline = '/api/cicd/validateJenkinsPipeline',
  getJenkinsJobStageView = '/api/cicd/getJenkinsJobStageView',
  getJenkinsJobParameters = '/api/cicd/getJenkinsJobParameters',
  getJenkinsJobBuildHistory = '/api/cicd/getJenkinsJobBuildHistory',

  // Pipeline 模版管理
  getJenkinsPipelineList = '/api/cicd/getJenkinsPipelineList',
  createJenkinsPipeline = '/api/cicd/createJenkinsPipeline',
  updateJenkinsPipeline = '/api/cicd/updateJenkinsPipeline',
  deleteJenkinsPipeline = '/api/cicd/deleteJenkinsPipeline',

  // 环境变量管理
  getJenkinsEnvList = '/api/cicd/getJenkinsEnvList',
  createJenkinsEnv = '/api/cicd/createJenkinsEnv',
  updateJenkinsEnv = '/api/cicd/updateJenkinsEnv',
  deleteJenkinsEnv = '/api/cicd/deleteJenkinsEnv',
}

export const getJenkinsInstanceList = (params?: any) =>
  defHttp.get({ url: Api.getJenkinsInstanceList, params });

export const getJenkinsInstanceDetail = (params: { id: number }) =>
  defHttp.get({ url: Api.getJenkinsInstanceDetail, params });

export const createJenkinsInstance = (data: any) =>
  defHttp.post({ url: Api.createJenkinsInstance, data });

export const updateJenkinsInstance = (data: any) =>
  defHttp.post({ url: Api.updateJenkinsInstance, data });

export const deleteJenkinsInstance = (id: number) =>
  defHttp.delete({ url: `${Api.deleteJenkinsInstance}?id=${id}` });

// Job 管理接口 (支持参数：服务名、项目名、状态、Git地址、部署环境、语言及模糊快查)
export const getJenkinsJobList = (params: {
  instanceId?: number;
  name?: string;
  projectName?: string;
  status?: string;
  gitRepo?: string;
  deployEnv?: string;
  lang?: string;
  keyword?: string;
  sync?: boolean;
}) => defHttp.get({ url: Api.getJenkinsJobList, params });

// 新建 Job (会严格由后端验证Pipeline语法，语法不合适会被打回)
export const createJenkinsJob = (data: {
  instanceId: number;
  deployType?: string;
  deployEnv?: string;
  name?: string;
  jobName: string;
  projectName?: string;
  folder?: string;
  gitRepo?: string;
  gitBranch?: string;
  lang?: string;
  pipelineScript?: string;
  createUserName?: string;
  enableDelete?: number;
}) => defHttp.post({ url: Api.createJenkinsJob, data });

// 更新 Job (纯写往远程 Jenkins 环境和基本参数映射；不可将复杂文本往 DB 打栈)
export const updateJenkinsJob = (data: {
  id?: number;
  instanceId: number;
  deployType?: string;
  deployEnv?: string;
  name?: string;
  jobName: string;
  projectName?: string;
  folder?: string;
  gitRepo?: string;
  gitBranch?: string;
  lang?: string;
  pipelineScript?: string;
  createUserName?: string;
  enableDelete?: number;
}) => defHttp.post({ url: Api.updateJenkinsJob, data });

// 彻底清除任务 (受服务器端开关控制联动防护拦截)
export const deleteJenkinsJob = (data: {
  instanceId: number;
  jobName: string;
  folder?: string;
  projectName?: string;
}) => defHttp.delete({ url: Api.deleteJenkinsJob, data, params: data });

// 触发部署及构建流 (支持纯净透传 CustomParams 参数字典)
export const triggerJenkinsBuild = (data: {
  instanceId: number;
  jobName: string;
  folder?: string;
  projectName?: string;
  branch?: string;
  deployType?: string;
  deployEnv?: string;
  gitRepo?: string;
  customParams?: Record<string, any>;
  createUserName?: string;
  [key: string]: any;
}) => defHttp.post({ url: Api.triggerJenkinsBuild, data });

export const stopJenkinsBuild = (data: {
  instanceId: number;
  jobName: string;
  folder?: string;
  projectName?: string;
  buildNumber?: number;
}) => defHttp.post({ url: Api.stopJenkinsBuild, data });

// 增量获取绚彩的极客编译与投运进程监控日记
export const getJenkinsBuildLogs = (params: {
  instanceId: number;
  jobName: string;
  folder?: string;
  projectName?: string;
  buildNumber: number;
  offset: number;
}) => defHttp.get({ url: Api.getJenkinsBuildLogs, params });

// 编辑专用：由在线连接直连远端拉起原生配置脚本文献
export const getJenkinsJobRemotePipeline = (params: {
  instanceId: number;
  jobName: string;
  folder?: string;
  projectName?: string;
}) => defHttp.get({ url: Api.getJenkinsJobRemotePipeline, params });

// 控制创建及存单后的锁定/开放态
export const toggleJenkinsJobDeleteLock = (data: {
  instanceId: number;
  jobName: string;
  enable: boolean;
}) => defHttp.post({ url: Api.toggleJenkinsJobDeleteLock, data });

// 在线调用官方 Linter 检测完整语法体系合格性
export const validateJenkinsPipeline = (data: { instanceId?: number; pipelineScript: string }) =>
  defHttp.post({ url: Api.validateJenkinsPipeline, data });

// 获取远端 Jenkins 真实的 Stage View 流水线阶段与运行数据
export const getJenkinsJobStageView = (params: {
  instanceId: number;
  jobName: string;
  folder?: string;
  projectName?: string;
}) => defHttp.get({ url: Api.getJenkinsJobStageView, params });

// 获取远端 Jenkins 任务定义的真实构建参数列表（实现动态渲染与参数透传）
export const getJenkinsJobParameters = (params: {
  instanceId: number;
  jobName: string;
  folder?: string;
  projectName?: string;
}) => defHttp.get({ url: Api.getJenkinsJobParameters, params });

export interface JobBuildParamKV {
  name: string;
  value: any;
}

export interface JobBuildHistoryItem {
  buildNumber: number;
  result: string;
  building: boolean;
  timestamp: number;
  duration: number;
  durationFormatted: string;
  triggerUser: string;
  parameters: Record<string, any>;
  paramList: JobBuildParamKV[];
}

// 获取远端 Jenkins 任务历史构建列表与实际运行参数快照
export const getJenkinsJobBuildHistory = (params: {
  instanceId: number;
  jobName: string;
  folder?: string;
  projectName?: string;
  limit?: number;
}) =>
  defHttp.get<{ items: JobBuildHistoryItem[]; total: number }>({
    url: Api.getJenkinsJobBuildHistory,
    params,
  });

// Pipeline 模版管理
export const getJenkinsPipelineList = (params?: { lang?: string; keyword?: string }) =>
  defHttp.get({ url: Api.getJenkinsPipelineList, params });

export const createJenkinsPipeline = (data: any) =>
  defHttp.post({ url: Api.createJenkinsPipeline, data });

export const updateJenkinsPipeline = (data: any) =>
  defHttp.post({ url: Api.updateJenkinsPipeline, data });

export const deleteJenkinsPipeline = (id: number) =>
  defHttp.delete({ url: `${Api.deleteJenkinsPipeline}?id=${id}` });

// 环境变量管理
export const getJenkinsEnvList = (params?: { group?: string; keyword?: string }) =>
  defHttp.get({ url: Api.getJenkinsEnvList, params });

export const createJenkinsEnv = (data: any) => defHttp.post({ url: Api.createJenkinsEnv, data });

export const updateJenkinsEnv = (data: any) => defHttp.post({ url: Api.updateJenkinsEnv, data });

export const deleteJenkinsEnv = (id: number) =>
  defHttp.delete({ url: `${Api.deleteJenkinsEnv}?id=${id}` });
