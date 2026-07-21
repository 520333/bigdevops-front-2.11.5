import {
  AccountParams,
  DeptListItem,
  MenuParams,
  RoleParams,
  RolePageParams,
  MenuListGetResultModel,
  DeptListGetResultModel,
  AccountListGetResultModel,
  RolePageListGetResultModel,
  RoleListGetResultModel,
} from './model/systemModel';
import { defHttp } from '@/utils/http/axios';

enum Api {
  AccountList = '/api/system/getAccountList',
  IsAccountExist = '/api/system/accountExist',
  createAccount = "/api/system/createAccount",
  updateAccount = "/api/system/updateAccount",
  deleteAccount = "/api/system/deleteAccount",
  setAccountStatus= "/api/system/setAccountStatus",
  changePassword = "/api/system/changePassword",
  getAllUserAndRoles = "/api/system/getAllUserAndRoles",

  DeptList = '/api/system/getDeptList',
  setRoleStatus = '/api/system/setRoleStatus',
  createRole = "/api/system/createRole",
  updateRole = "/api/system/updateRole",
  deleteRole = '/api/system/deleteRole',
  MenuList = '/api/system/getMenuList',
  MenuListAll = "/api/system/getMenuListAll",


  createMenu = '/api/system/createMenu',
  updateMenu = '/api/system/updateMenu',
  deleteMenu = '/api/system/deleteMenu',

  // RolePageList = '/api/system/getRoleListByPage',
  RolePageList = '/api/system/getRoleListAll',
  GetAllRoleList = '/api/system/getRoleListAll',

  
  getApiList = "/api/system/getApiList",
  getApiListAll = "/api/system/getApiListAll",
  createApi = "/api/system/createApi",
  updateApi = "/api/system/updateApi",
  deleteApi = "/api/system/deleteApi",
  
  StreeNodeList = '/api/stree/getStreeNodeList',
  getTopStreeNodes = '/api/stree/getTopStreeNodes',
  createStreeNode = '/api/stree/createStreeNode',
  updateStreeNode = '/api/stree/updateStreeNode',
  deleteStreeNode = '/api/stree/deleteStreeNode',
  getChildrenStreeNodes = '/api/stree/getChildrenStreeNodes',
  getLeafStreeNodes = "/api/stree/getLeafStreeNodes",


  getResourceEcsUnbindList = "/api/stree/getResourceEcsUnbindList",
  bindEcsToStreeNode = "/api/stree/bindEcsToStreeNode",
  unBindEcsToStreeNode = "/api/stree/unBindEcsToStreeNode",
  getResourceEcsList= "/api/stree/getResourceEcsList",

  getResourceElbUnbindList = "/api/stree/getResourceElbUnbindList",
  bindElbToStreeNode = "/api/stree/bindElbToStreeNode",
  unBindElbToStreeNode = "/api/stree/unBindElbToStreeNode",

  getResourceRdsUnbindList = "/api/stree/getResourceRdsUnbindList",
  bindRdsToStreeNode = "/api/stree/bindRdsToStreeNode",
  unBindRdsToStreeNode = "/api/stree/unBindRdsToStreeNode",
  
  fetchResourceByNode = "/api/stree/fetchResourceByNode",

  getProcessList = "/api/workorder/getProcessList",
  createProcess = "/api/workorder/createProcess",
  updateProcess = "/api/workorder/updateProcess",
  deleteProcess = "/api/workorder/deleteProcess",


  getFormDesignList = "/api/workorder/getFormDesignList",
  createFormDesign = "/api/workorder/createFormDesign",
  updateFormDesign = "/api/workorder/updateFormDesign",
  deleteFormDesign = "/api/workorder/deleteFormDesign",


  getWorkOrderTemplateList = "/api/workorder/getWorkOrderTemplateList",
  getWorkOrderTemplateDetail = "/api/workorder/getWorkOrderTemplateDetail",
  createWorkOrderTemplate = "/api/workorder/createWorkOrderTemplate",
  updateWorkOrderTemplate = "/api/workorder/updateWorkOrderTemplate",
  deleteWorkOrderTemplate = "/api/workorder/deleteWorkOrderTemplate",
  
  getWorkOrderInstanceList = "/api/workorder/getWorkOrderInstanceList",
  createWorkOrderInstance = "/api/workorder/createWorkOrderInstance",
  updateWorkOrderInstance = "/api/workorder/updateWorkOrderInstance",
  deleteWorkOrderInstance = "/api/workorder/deleteWorkOrderInstance",
  approvalWorkOrderInstance ="/api/workorder/approvalWorkOrderInstance",
  actionWorkOrderInstance = "/api/workorder/actionWorkOrderInstance",
  getWorkOrderInstanceDetail = "/api/workorder/getWorkOrderInstanceDetail",
  commentWorkOrderInstance ="/api/workorder/commentWorkOrderInstance",


  getJobExecScriptList = "/api/jobexec/getJobExecScriptList",
  getJobExecScriptSelect = "/api/jobexec/getJobExecScriptSelect",
  getJobExecScriptOne= "/api/jobexec/getJobExecScriptOne",
  createJobExecScript = "/api/jobexec/createJobExecScript",
  updateJobExecScript = "/api/jobexec/updateJobExecScript",
  deleteJobExecScript = "/api/jobexec/deleteJobExecScript",

  
  getJobExecTaskList = "/api/jobexec/getJobExecTaskList",
  createJobExecTask = "/api/jobexec/createJobExecTask",
  updateJobExecTask = "/api/jobexec/updateJobExecTask",
  deleteJobExecTask = "/api/jobexec/deleteJobExecTask",

  getStreeNodeSelect = "/api/stree/getStreeNodeSelect",
  getStreeNodeEcsList = "/api/stree/getStreeNodeEcsList",
  getJobExecTaskOne = "/api/jobexec/getJobExecTaskOne",
  actionJobExecTaskOne = "/api/jobexec/actionJobExecTaskOne",
  getJobExecResultByJobId = "/api/jobexec/getJobExecResultByJobId",

  // prom集群
  getMonitorPromScrapePoolList = "/api/monitor/getMonitorPromScrapePoolList",
  createMonitorPromScrapePool = "/api/monitor/createMonitorPromScrapePool",
  updateMonitorPromScrapePool = "/api/monitor/updateMonitorPromScrapePool",
  deleteMonitorPromScrapePool = "/api/monitor/deleteMonitorPromScrapePool",
  getMonitorScrapePoolDetail = "/api/monitor/getMonitorScrapePoolDetail",
  getMonitorPrometheusYamlOne = "/api/monitor/getMonitorPrometheusYamlOne",
  getMonitorPrometheusAlertRuleYamlOne = "/api/monitor/getMonitorPrometheusAlertRuleYamlOne",
  getMonitorPrometheusRecordRuleYamlOne = "/api/monitor/getMonitorPrometheusRecordRuleYamlOne",

  // prom采集任务
  getMonitorPromScrapeJobList = "/api/monitor/getMonitorPromScrapeJobList",
  createMonitorPromScrapeJob = "/api/monitor/createMonitorPromScrapeJob",
  updateMonitorPromScrapeJob = "/api/monitor/updateMonitorPromScrapeJob",
  deleteMonitorPromScrapeJob = "/api/monitor/deleteMonitorPromScrapeJob",
  setMonitorPromScrapeJobStatus = "/api/monitor/setMonitorPromScrapeJobStatus",
  // 值班组
  getMonitorOndutyGroupList = "/api/monitor/getMonitorOndutyGroupList",
  createMonitorOndutyGroup = "/api/monitor/createMonitorOndutyGroup",
  updateMonitorOndutyGroup = "/api/monitor/updateMonitorOndutyGroup",
  deleteMonitorOndutyGroup = "/api/monitor/deleteMonitorOndutyGroup",
  // 排版表
  getMonitorOndutyGroupFuturePlan = "/api/monitor/getMonitorOndutyGroupFuturePlan",
  getMonitorOndutyGroupOne = "/api/monitor/getMonitorOndutyGroupOne",
  createMonitorOndutyChange = "/api/monitor/createMonitorOndutyChange",
  setMonitorOndutyStatus = "/api/monitor/setMonitorOndutyStatus",
  // alertm集群
  getMonitorAlertManagerPoolList = "/api/monitor/getMonitorAlertManagerPoolList",
  createMonitorAlertManagerPool = "/api/monitor/createMonitorAlertManagerPool",
  updateMonitorAlertManagerPool = "/api/monitor/updateMonitorAlertManagerPool",
  deleteMonitorAlertManagerPool = "/api/monitor/deleteMonitorAlertManagerPool",
  getMonitorAlertManagerYamlOne = "/api/monitor/getMonitorAlertManagerYamlOne",
  // alertm发送组
  getMonitorAlertManagerSendGroupList = "/api/monitor/getMonitorAlertManagerSendGroupList",
  createMonitorAlertManagerSendGroup ="/api/monitor/createMonitorAlertManagerSendGroup",
  updateMonitorAlertManagerSendGroup = "/api/monitor/updateMonitorAlertManagerSendGroup",
  deleteMonitorAlertManagerSendGroup = "/api/monitor/deleteMonitorAlertManagerSendGroup",
  setAlertManagerSendGroupStatus = "/api/monitor/setAlertManagerSendGroupStatus",
  // prom告警规则
  getMonitorPromAlertRuleList= "/api/monitor/getMonitorPromAlertRuleList",
  createMonitorPromAlertRule= "/api/monitor/createMonitorPromAlertRule",
  updateMonitorPromAlertRule= "/api/monitor/updateMonitorPromAlertRule",
  deleteMonitorPromAlertRule= "/api/monitor/deleteMonitorPromAlertRule",
  deleteMonitorPromAlertRuleBatch= "/api/monitor/deleteMonitorPromAlertRuleBatch",
  setMonitorPromAlertRuleStatus= "/api/monitor/setMonitorPromAlertRuleStatus",
  setMonitorPromAlertRuleStatusBatch = "/api/monitor/setMonitorPromAlertRuleStatusBatch",
  promqlExprCheck= "/api/monitor/promqlExprCheck",
  // prom聚合规则
  getMonitorPromRecordRuleList= "/api/monitor/getMonitorPromRecordRuleList",
  createMonitorPromRecordRule= "/api/monitor/createMonitorPromRecordRule",
  updateMonitorPromRecordRule= "/api/monitor/updateMonitorPromRecordRule",
  deleteMonitorPromRecordRule= "/api/monitor/deleteMonitorPromRecordRule",
  deleteMonitorPromRecordRuleBatch= "/api/monitor/deleteMonitorPromRecordRuleBatch",
  setMonitorPromRecordRuleStatus= "/api/monitor/setMonitorPromRecordRuleStatus",
  setMonitorPromRecordRuleStatusBatch = "/api/monitor/setMonitorPromRecordRuleStatusBatch",
  recordRulePromqlExprCheck= "/api/monitor/recordRulePromqlExprCheck",

  // alerm告警事件
  getMonitorAlertManagerEventList= "/api/monitor/getMonitorAlertManagerEventList",
  alertManagerEventSilence= "/api/monitor/alertManagerEventSilence",
  alertManagerEventUnSilence= "/api/monitor/alertManagerEventUnSilence",
  alertManagerEventBatchSilence = '/api/monitor/alertManagerEventBatchSilence',
  alertManagerEventBatchUnSilence = '/api/monitor/alertManagerEventBatchUnSilence',
  alertManagerEventReLing= "/api/monitor/alertManagerEventReLing",

  // k8s集群
  getK8sClusterList = "/api/k8s/getK8sClusterList",
  createK8sCluster = "/api/k8s/createK8sCluster",
  updateK8sCluster = "/api/k8s/updateK8sCluster",
  deleteK8sCluster = "/api/k8s/deleteK8sCluster",
  deleteK8sClusterBatch = "/api/k8s/deleteK8sClusterBatch",
  getK8sNodeList = "/api/k8s/getK8sNodeList",
  getClusterForSelect = "/api/k8s/getClusterForSelect",
  scheduleEnableSwitchK8sNodesOne = "/api/k8s/scheduleEnableSwitchK8sNodesOne",
  labelK8sNodes = "/api/k8s/labelK8sNodes",
  taintK8sNodes = "/api/k8s/taintK8sNodes",
  drainK8sNodes = "/api/k8s/drainK8sNodes",
  getPodListByNodeName = "/api/k8s/getPodListByNodeName",
}

export const getAccountList = (params: AccountParams) =>
  defHttp.get<AccountListGetResultModel>({ url: Api.AccountList, params });

export const createAccount = (data) => 
  defHttp.post({ url: Api.createAccount, data });

export const updateAccount = (data) => 
  defHttp.post({ url: Api.updateAccount, data });

export const deleteAccount = (id: number) =>
  defHttp.delete({ url: Api.deleteAccount+"/"+id});

export const setAccountStatus = (id: number, enable: number) =>
  defHttp.post({ url: Api.setAccountStatus, params: { id, enable } });

export const changePassword = (data) =>
  defHttp.post({ url: Api.changePassword, data });

export const getAllUserAndRoles = () =>
  defHttp.get({ url: Api.getAllUserAndRoles });

export const getDeptList = (params?: DeptListItem) =>
  defHttp.get<DeptListGetResultModel>({ url: Api.DeptList, params });

export const getMenuList = (params?: MenuParams) =>
  defHttp.get<MenuListGetResultModel>({ url: Api.MenuList, params });

export const getMenuListAll = (params?: MenuParams) =>
  defHttp.get<MenuListGetResultModel>({ url: Api.MenuListAll, params });

export const createMenu = (data) => 
  defHttp.post({ url: Api.createMenu, data });

export const updateMenu = (data) => 
  defHttp.post({ url: Api.updateMenu, data });

export const deleteMenu = (id: number) => 
  defHttp.delete({ url: Api.deleteMenu+"/"+id });

export const getRoleListByPage = (params?: RolePageParams) =>
  defHttp.get<RolePageListGetResultModel>({ url: Api.RolePageList, params });

export const getAllRoleList = (params?: RoleParams) =>
  defHttp.get<RoleListGetResultModel>({ url: Api.GetAllRoleList, params });

export const setRoleStatus = (id: number, status: string) =>
  defHttp.post({ url: Api.setRoleStatus, params: { id, status } });

export const createRole = (data) => 
  defHttp.post({ url: Api.createRole, data });

export const updateRole = (data) => 
  defHttp.post({ url: Api.updateRole, data });

export const deleteRole = (id: number) =>
  defHttp.delete({ url: Api.deleteRole+"/"+id });

export const isAccountExist = (account?: string) =>
  defHttp.post({ url: Api.IsAccountExist, params: { account } }, { errorMessageMode: 'none' });



export const getApiList = (params?: MenuParams) =>
  defHttp.get({ url: Api.getApiList, params });

export const getApiListAll = (params?: MenuParams) =>
  defHttp.get({ url: Api.getApiListAll, params });

export const createApi = (data) => 
  defHttp.post({ url: Api.createApi, data });

export const updateApi = (data) => 
  defHttp.post({ url: Api.updateApi, data });

export const deleteApi = (id: number) => 
  defHttp.delete({ url: Api.deleteApi+"/"+id });



export const getStreeNodeList = (params?: MenuParams) =>
  defHttp.get({ url: Api.StreeNodeList, params });

export const getTopStreeNodes = (params?: MenuParams) =>
  defHttp.get({ url: Api.getTopStreeNodes, params });

export const createStreeNode = (data) =>
  defHttp.post({ url: Api.createStreeNode, data });

export const updateStreeNode = (data) =>
  defHttp.post({ url: Api.updateStreeNode, data });

export const deleteStreeNode = (id) => 
  defHttp.delete({ url: Api.deleteStreeNode+"/"+id });

export const getChildrenStreeNodes = (id) => 
  defHttp.get({ url: Api.getChildrenStreeNodes+"/"+id });

export const getLeafStreeNodes = (params?: any) =>
  defHttp.get({ url: Api.getLeafStreeNodes, params });



export const getResourceEcsUnbindList = () =>
  defHttp.get({ url: Api.getResourceEcsUnbindList });

export const bindEcsToStreeNode = (data) =>
  defHttp.post({ url: Api.bindEcsToStreeNode, data });

export const unBindEcsToStreeNode = (data) =>
  defHttp.post({ url: Api.unBindEcsToStreeNode, data });

export const getResourceEcsList = (params) =>
  defHttp.get({ url: Api.getResourceEcsList, params: params });

export const getResourceElbUnbindList = () =>
  defHttp.get({ url: Api.getResourceElbUnbindList });

export const bindElbToStreeNode = (data) =>
  defHttp.post({ url: Api.bindElbToStreeNode, data });

export const unBindElbToStreeNode = (data) =>
  defHttp.post({ url: Api.unBindElbToStreeNode, data });

export const getResourceRdsUnbindList = () =>
  defHttp.get({ url: Api.getResourceRdsUnbindList });

export const bindRdsToStreeNode = (data) =>
  defHttp.post({ url: Api.bindRdsToStreeNode, data });

export const unBindRdsToStreeNode = (data) =>
  defHttp.post({ url: Api.unBindRdsToStreeNode, data });

export const fetchResourceByNode = (params) =>
  defHttp.get({ url: Api.fetchResourceByNode, params: params });




export const getProcessList = (params?: any) =>
  defHttp.get({ url: Api.getProcessList, params });

export const createProcess = (data) =>
  defHttp.post({ url: Api.createProcess, data });

export const updateProcess = (data) =>
  defHttp.post({ url: Api.updateProcess, data });

export const deleteProcess = (id) =>
  defHttp.delete({ url: Api.deleteProcess+"/"+id });


export const getFormDesignList = (params?: any) =>
  defHttp.get({ url: Api.getFormDesignList, params });

export const createFormDesign = (data: any) =>
  defHttp.post({ url: Api.createFormDesign, data });

export const updateFormDesign = (data: any) =>
  defHttp.post({ url: Api.updateFormDesign, data });

export const deleteFormDesign = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteFormDesign}/${id}` });

export const getWorkOrderTemplateList = (params?: any) =>
  defHttp.get({ url: Api.getWorkOrderTemplateList, params });

export const createWorkOrderTemplate = (data: any) =>
  defHttp.post({ url: Api.createWorkOrderTemplate, data });

export const updateWorkOrderTemplate = (data: any) =>
  defHttp.post({ url: Api.updateWorkOrderTemplate, data });

export const deleteWorkOrderTemplate = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteWorkOrderTemplate}/${id}` });

export const getWorkOrderTemplateDetail = (id: number | string) =>
    defHttp.get({ url: `${Api.getWorkOrderTemplateDetail}/${id}` });



export const getWorkOrderInstanceList = (params?: any) =>
  defHttp.get({ url: Api.getWorkOrderInstanceList, params });

export const createWorkOrderInstance = (data: any) =>
  defHttp.post({ url: Api.createWorkOrderInstance, data });

export const updateWorkOrderInstance = (data: any) =>
  defHttp.post({ url: Api.updateWorkOrderInstance, data });

export const deleteWorkOrderInstance = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteWorkOrderInstance}/${id}` });

export const approvalWorkOrderInstance = (id: number, approvalAction: string, message?: string) =>
  defHttp.post({ url: `${Api.approvalWorkOrderInstance}/${id}?approvalAction=${approvalAction}&message=${message || ''}` });

export const actionWorkOrderInstance = (id: number | string, params: { isSuccess: boolean; output: string }) =>
  defHttp.post({ url: `${Api.actionWorkOrderInstance}/${id}`, params });

export const getWorkOrderInstanceDetail = (id: number | string) =>
  defHttp.get({ url: `${Api.getWorkOrderInstanceDetail}/${id}` });

export const commentWorkOrderInstance = (id: number | string, comment: string) =>
  defHttp.post({ url: `${Api.commentWorkOrderInstance}/${id}`, data: { comment } });





export const getJobExecScriptList = (params?: any) =>
  defHttp.get({ url: Api.getJobExecScriptList, params });

export const getJobExecScriptSelect = (params?: any) =>
  defHttp.get({ url: Api.getJobExecScriptSelect, params });

export const getJobExecScriptOne = (id: number | string) =>
  defHttp.get({ url: `${Api.getJobExecScriptOne}/${id}` });

export const createJobExecScript = (data: any) =>
  defHttp.post({ url: Api.createJobExecScript, data });

export const updateJobExecScript = (data: any) =>
  defHttp.post({ url: Api.updateJobExecScript, data });

export const deleteJobExecScript = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteJobExecScript}/${id}` });



export const getJobExecTaskList = (params?: any) =>
  defHttp.get({ url: Api.getJobExecTaskList, params });

export const createJobExecTask = (data: any) =>
  defHttp.post({ url: Api.createJobExecTask, data });

export const updateJobExecTask = (data: any) =>
  defHttp.post({ url: Api.updateJobExecTask, data });

export const deleteJobExecTask = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteJobExecTask}/${id}` });

export const getStreeNodeSelect = (params?: MenuParams) =>
  defHttp.get({ url: Api.getStreeNodeSelect, params });

export const getStreeNodeEcsList = (id: number | string) =>
  defHttp.get({ url: `${Api.getStreeNodeEcsList}/${id}` });

export const getJobExecTaskOne = (id: number | string) =>
  defHttp.get({ url: `${Api.getJobExecTaskOne}/${id}` });

export const actionJobExecTaskOne = (id: number | string, action?: string) =>
  defHttp.post({ url: `${Api.actionJobExecTaskOne}/${id}?action=${action}`});

export const getJobExecResultByJobId = (params?: any) =>
  defHttp.get({ url: Api.getJobExecResultByJobId, params });


export const getMonitorPromScrapePoolList = (params?: any) =>
  defHttp.get({ url: Api.getMonitorPromScrapePoolList, params });

export const createMonitorPromScrapePool = (data: any) =>
  defHttp.post({ url: Api.createMonitorPromScrapePool, data });

export const updateMonitorPromScrapePool = (data: any) =>
  defHttp.post({ url: Api.updateMonitorPromScrapePool, data });

export const deleteMonitorPromScrapePool = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteMonitorPromScrapePool}/${id}` });

export const getMonitorScrapePoolDetail = (id: number | string) =>
    defHttp.get({ url: `${Api.getMonitorScrapePoolDetail}/${id}` });

export const getMonitorPrometheusYamlOne = (ip: string) =>
    defHttp.get({ url: Api.getMonitorPrometheusYamlOne+ "?ip=" + ip });

export const getMonitorPrometheusAlertRuleYamlOne = (ip: string) =>
    defHttp.get({ url: Api.getMonitorPrometheusAlertRuleYamlOne+ "?ip=" + ip });

export const getMonitorPrometheusRecordRuleYamlOne = (ip: string) =>
    defHttp.get({ url: Api.getMonitorPrometheusRecordRuleYamlOne+ "?ip=" + ip });

export const getMonitorPromScrapeJobList = (params?: any) =>
  defHttp.get({ url: Api.getMonitorPromScrapeJobList, params });

export const createMonitorPromScrapeJob = (data: any) =>
  defHttp.post({ url: Api.createMonitorPromScrapeJob, data });

export const updateMonitorPromScrapeJob = (data: any) =>
  defHttp.post({ url: Api.updateMonitorPromScrapeJob, data });

export const deleteMonitorPromScrapeJob = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteMonitorPromScrapeJob}/${id}` });


export const setMonitorPromScrapeJobStatus = (id: number, enable: number) =>
  defHttp.post({ url: Api.setMonitorPromScrapeJobStatus, params: { id, enable } });


// export const getMonitorPrometheusYamlOne = (ip: string) =>
//     defHttp.get({ url: Api.GetMonitorPrometheusYamlOne+ "?ip=" + ip });


export const getMonitorOndutyGroupList = (params?: any) =>
  defHttp.get({ url: Api.getMonitorOndutyGroupList, params });

export const createMonitorOndutyGroup = (data: any) =>
  defHttp.post({ url: Api.createMonitorOndutyGroup, data });

export const updateMonitorOndutyGroup = (data: any) =>
  defHttp.post({ url: Api.updateMonitorOndutyGroup, data });

export const deleteMonitorOndutyGroup = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteMonitorOndutyGroup}/${id}` });

export const getMonitorOndutyGroupFuturePlan = (params: { id: string | number; startDay: string; endDay: string }) => {
  return defHttp.get({
    // 1. 使用模板字符串拼接 URL。注意这里没有双引号，使用的是反引号( ` )
    url: `${Api.getMonitorOndutyGroupFuturePlan}/${params.id}`,
    
    // 2. 将 startDay 和 endDay 作为查询参数传递（Vben/Axios 会自动把它们拼接到 ? 后面）
    params: {
      startDay: params.startDay,
      endDay: params.endDay
    }
  });
};


export const getMonitorOndutyGroupOne = (id: string | number) =>
  defHttp.get({ url: `${Api.getMonitorOndutyGroupOne}/${id}` });


export const createMonitorOndutyChange = (params: any) => {
  defHttp.post({ url: Api.createMonitorOndutyChange, params });
};

export const setMonitorOndutyStatus = (id: number, enable: number) =>
  defHttp.post({ url: Api.setMonitorOndutyStatus, params: { id, enable } });


export const getMonitorAlertManagerPoolList = (params?: any) =>
  defHttp.get({ url: Api.getMonitorAlertManagerPoolList, params });

export const createMonitorAlertManagerPool = (data: any) =>
  defHttp.post({ url: Api.createMonitorAlertManagerPool, data });

export const updateMonitorAlertManagerPool = (data: any) =>
  defHttp.post({ url: Api.updateMonitorAlertManagerPool, data });

export const deleteMonitorAlertManagerPool = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteMonitorAlertManagerPool}/${id}` });

export const getMonitorAlertManagerYamlOne = (ip: string) =>
    defHttp.get({ url: Api.getMonitorAlertManagerYamlOne+ "?ip=" + ip });


export const getMonitorAlertManagerSendGroupList = (params?: any) =>
  defHttp.get({ url: Api.getMonitorAlertManagerSendGroupList, params });

export const createMonitorAlertManagerSendGroup = (data: any) =>
  defHttp.post({ url: Api.createMonitorAlertManagerSendGroup, data });

export const updateMonitorAlertManagerSendGroup = (data: any) =>
  defHttp.post({ url: Api.updateMonitorAlertManagerSendGroup, data });

export const deleteMonitorAlertManagerSendGroup = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteMonitorAlertManagerSendGroup}/${id}` });

export const setAlertManagerSendGroupStatus = (id: number, enable: number) =>
  defHttp.post({ url: Api.setAlertManagerSendGroupStatus, params: { id, enable } });



export const getMonitorPromAlertRuleList = (params?: any) =>
  defHttp.get({ url: Api.getMonitorPromAlertRuleList, params });

export const createMonitorPromAlertRule = (data: any) =>
  defHttp.post({ url: Api.createMonitorPromAlertRule, data });

export const updateMonitorPromAlertRule = (data: any) =>
  defHttp.post({ url: Api.updateMonitorPromAlertRule, data });

export const deleteMonitorPromAlertRule = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteMonitorPromAlertRule}/${id}` });

export const setMonitorPromAlertRuleStatus = (id: number, enable: number) =>
  defHttp.post({ url: Api.setMonitorPromAlertRuleStatus, params: { id, enable } });

export const setMonitorPromAlertRuleStatusBatch = (params: { ids: number[]; enable: number }) =>
  defHttp.post({ url: Api.setMonitorPromAlertRuleStatusBatch, params });

export const promqlExprCheck = (params?: any) =>
  defHttp.get({ url: Api.promqlExprCheck, params });
export const deleteMonitorPromAlertRuleBatch = (data?: any) =>
  defHttp.delete({ url: Api.deleteMonitorPromAlertRuleBatch, data });


export const getMonitorPromRecordRuleList = (params?: any) =>
  defHttp.get({ url: Api.getMonitorPromRecordRuleList, params });

export const createMonitorPromRecordRule = (data: any) =>
  defHttp.post({ url: Api.createMonitorPromRecordRule, data });

export const updateMonitorPromRecordRule = (data: any) =>
  defHttp.post({ url: Api.updateMonitorPromRecordRule, data });

export const deleteMonitorPromRecordRule = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteMonitorPromRecordRule}/${id}` });

export const setMonitorPromRecordRuleStatus = (id: number, enable: number) =>
  defHttp.post({ url: Api.setMonitorPromRecordRuleStatus, params: { id, enable } });

export const setMonitorPromRecordRuleStatusBatch = (params: { ids: number[]; enable: number }) =>
  defHttp.post({ url: Api.setMonitorPromRecordRuleStatusBatch, params });

export const recordRulePromqlExprCheck = (params?: any) =>
  defHttp.get({ url: Api.recordRulePromqlExprCheck, params });
export const deleteMonitorPromRecordRuleBatch = (data?: any) =>
  defHttp.delete({ url: Api.deleteMonitorPromRecordRuleBatch, data });




export const getMonitorAlertManagerEventList = (params?: any) =>
  defHttp.get({ url: Api.getMonitorAlertManagerEventList, params });

export const alertManagerEventSilence = (id: number | string, params?: any) =>
  defHttp.post({ url: `${Api.alertManagerEventSilence}/${id}`, params });

export const alertManagerEventUnSilence = (id: number | string) =>
  defHttp.post({ url: `${Api.alertManagerEventUnSilence}/${id}` });

export const alertManagerEventReLing = (id: number | string) =>
  defHttp.post({ url: `${Api.alertManagerEventReLing}/${id}` });

export const alertManagerEventBatchSilence = (params: any) =>
  defHttp.post({ url: Api.alertManagerEventBatchSilence, params });

export const alertManagerEventBatchUnSilence = (params: any) =>
  defHttp.post({ url: Api.alertManagerEventBatchUnSilence, params });

// k8s集群
export const getK8sClusterList = (params?: any) =>
  defHttp.get({ url: Api.getK8sClusterList, params });

export const createK8sCluster = (data?: any) =>
  defHttp.post({ url: Api.createK8sCluster, data });

export const updateK8sCluster = (data?: any) =>
  defHttp.post({ url: Api.updateK8sCluster, data });

export const deleteK8sCluster = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteK8sCluster}/${id}` });

export const deleteK8sClusterBatch = (data?: any) =>
  defHttp.delete({ url: Api.deleteK8sClusterBatch, data });

export const getK8sNodeList = (params: any) =>
  defHttp.get({ url: Api.getK8sNodeList, params }, { joinTime: true });

export const getClusterForSelect = () =>
  defHttp.get({ url: Api.getClusterForSelect });

export const scheduleEnableSwitchK8sNodesOne = (data: { clusterName: string; nodeNames: string[]; targetEnable?: boolean }) =>
  defHttp.post({ url: Api.scheduleEnableSwitchK8sNodesOne, data });

export const labelK8sNodes = (data: { clusterName: string; nodeNames: string[]; labels: string[] }) =>
  defHttp.post({ url: Api.labelK8sNodes, data });

export const taintK8sNodes = (data: {
  clusterName: string;
  nodeNames: string[];
  taints: Array<{ key: string; value?: string; effect: string }>;
  deletedKeys?: string[];
}) => defHttp.post({ url: Api.taintK8sNodes, data });

export const drainK8sNodes = (data: { clusterName: string; nodeNames: string[] }) =>
  defHttp.post({ url: Api.drainK8sNodes, data });

export const getPodListByNodeName = (params: { cluster: string; node: string }) =>
  defHttp.get({ url: Api.getPodListByNodeName, params });








