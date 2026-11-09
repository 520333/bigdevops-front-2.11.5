export type ReleaseStatus = 'draft' | 'pending_review' | 'pending_release' | 'releasing' | 'success' | 'failed';

export interface ReleasePlan {
  title: string;
  releaseNo?: string;
  planDate: string;
  releaseType: string;
  env: string;
  createTime: string;
  creator: string;
  status: string;
  overview?: string;
  scope?: string;
  rollbackPlan?: string;
  emergencyContact?: string;
  checklist?: Array<{ id: string; content: string; checked: boolean; owner: string }>;
}

export interface DemandBugItem {
  id: string;
  code: string;
  title: string;
  type: 'demand' | 'bug' | 'refactor';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  owner: string;
  tester: string;
  status: 'passed' | 'testing' | 'rejected';
  url?: string;
}

export interface AppInstanceItem {
  id: string;
  deployType: string; // 主机 / k8s
  envType: string;    // pre / prod / test
  profile: string;    // cu-pre
  ip: string;         // 172.21.0.68
  status: 'SUCCESS' | 'DEPLOYING' | 'WAITING' | 'FAILED';
  currentStepIndex: number; // 0: 下线, 1: 部署中, 2: 上线, 3: 健康检查, 4: 全部完成
  steps: Array<{
    title: string;
    status: 'finish' | 'process' | 'wait' | 'error';
  }>;
}

export interface ReleaseAppItem {
  id: string | number;
  order: number;
  serviceName: string;
  appType: string;    // java后端 / 前端Vue / Go微服务
  baselineTag: string;
  latestTag: string;
  iterationApp: string;
  status: 'SUCCESS' | 'WAITING' | 'BUILDING' | 'FAILURE';
  expanded?: boolean;
  instances: AppInstanceItem[];
}

export interface NacosConfigItem {
  id: string;
  instanceName: string;
  namespace: string;
  group: string;
  dataId: string;
  changeType: 'modify' | 'add' | 'delete';
  oldContent: string;
  newContent: string;
  status: 'pending' | 'synced';
}

export interface SqlWorkflowItem {
  id: number;
  workflowId: number;
  workflowName: string;
  dbName: string;
  groupName: string;
  syntaxType: number; // 1: DDL, 2: DML
  status: string;
  engineer: string;
  isBackup: boolean;
  createTime?: string;
}
