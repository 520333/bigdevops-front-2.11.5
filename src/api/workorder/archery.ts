import { defHttp } from '@/utils/http/axios';

enum Api {
  Config = '/api/archery/config',
  Instances = '/api/archery/instances',
  Groups = '/api/archery/groups',
  Databases = '/api/archery/databases',
  SqlCheck = '/api/archery/sqlCheck',
  Workflows = '/api/archery/workflows',
  CreateWorkflow = '/api/archery/createWorkflow',
  Audit = '/api/archery/audit',
  Execute = '/api/archery/execute',
  Logs = '/api/archery/logs',
}

export interface ArcheryGroupItem {
  id: number;
  name: string;
}

export interface ArcheryConfig {
  enable: boolean;
  baseUrl: string;
}

export interface ArcheryInstance {
  id: number;
  instance_name: string;
  type: string;
  db_type: string;
  host: string;
  port: number;
  user: string;
  charset: string;
  resource_group: number[];
}

export interface ArcherySqlCheckRow {
  id: number;
  stage: string;
  errlevel: number; // 0: 正常通过, 1: 警告, 2: 错误
  stagestatus: string;
  errormessage: string;
  sql: string;
  affected_rows: number;
}

export interface ArcherySqlCheckResult {
  is_execute: boolean;
  checked: string;
  warning_count: number;
  error_count: number;
  is_critical: boolean;
  rows: ArcherySqlCheckRow[];
}

export interface ArcheryWorkflowDetail {
  id: number;
  workflow_name: string;
  demand_url: string;
  group_id: number;
  group_name: string;
  instance: number;
  db_name: string;
  syntax_type: number;
  is_backup: boolean;
  engineer: string;
  engineer_display: string;
  status: string;
  audit_auth_groups: string;
  create_time: string;
  finish_time: string;
}

export interface ArcheryWorkflowItem {
  id: number;
  workflow_id: number;
  workflow: ArcheryWorkflowDetail;
  sql_content: string;
  review_content: string;
  execute_result: string;
}

export interface ArcheryWorkflowListResult {
  total: number;
  items: ArcheryWorkflowItem[];
}

export interface CreateArcheryWorkflowParams {
  workflowName: string;
  instanceId: number;
  dbName: string;
  groupId?: number;
  isBackup: boolean;
  demandUrl?: string;
  sqlContent: string;
}

export const getArcheryConfigApi = () => {
  return defHttp.get<ArcheryConfig>({ url: Api.Config });
};

export const getArcheryInstancesApi = () => {
  return defHttp.get<ArcheryInstance[]>({ url: Api.Instances });
};

export const getArcheryDatabasesApi = (params: { instanceId: number }) => {
  return defHttp.get<string[]>({ url: Api.Databases, params });
};

export const checkArcherySqlApi = (data: { instanceId: number; dbName: string; fullSql: string }) => {
  return defHttp.post<ArcherySqlCheckResult>({ url: Api.SqlCheck, data });
};

export const getArcheryGroupsApi = () => {
  return defHttp.get<ArcheryGroupItem[]>({ url: Api.Groups });
};

export interface GetWorkflowsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  instanceId?: number;
  groupId?: number;
  startTime?: string;
  endTime?: string;
}

export const getArcheryWorkflowsApi = (params: GetWorkflowsParams) => {
  return defHttp.get<ArcheryWorkflowListResult>({ url: Api.Workflows, params });
};

export const createArcheryWorkflowApi = (data: CreateArcheryWorkflowParams) => {
  return defHttp.post<{ workflowId: number; message: string }>({ url: Api.CreateWorkflow, data });
};

export interface AuditWorkflowParams {
  workflowId: number;
  auditType: 'pass' | 'cancel';
  auditRemark?: string;
  engineer?: string;
}

export const auditArcheryWorkflowApi = (data: AuditWorkflowParams) => {
  return defHttp.post<{ message: string }>({ url: Api.Audit, data });
};

export interface ExecuteWorkflowParams {
  workflowId: number;
  mode?: string;
  engineer?: string;
}

export const executeArcheryWorkflowApi = (data: ExecuteWorkflowParams) => {
  return defHttp.post<{ message: string }>({ url: Api.Execute, data });
};

export interface ArcheryWorkflowLogItem {
  operation_type_desc: string;
  operation_info: string;
  operator_display: string;
  operation_time: string;
}

export const getArcheryWorkflowLogsApi = (workflowId: number) => {
  return defHttp.get<ArcheryWorkflowLogItem[]>({
    url: Api.Logs,
    params: { workflowId },
  });
};

