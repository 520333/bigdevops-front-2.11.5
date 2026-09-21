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
  updateUserInfo = '/api/system/updateUserInfo',
  uploadAvatar = '/api/system/uploadAvatar',
  AccountList = '/api/system/getAccountList',
  IsAccountExist = '/api/system/accountExist',
  createAccount = "/api/system/createAccount",
  updateAccount = "/api/system/updateAccount",
  deleteAccount = "/api/system/deleteAccount",
  setAccountStatus = "/api/system/setAccountStatus",
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
  getAuditLogList = "/api/system/getAuditLogList",
  getLoginLogList = "/api/system/getLoginLogList",
  getOnlineUserList = "/api/system/getOnlineUserList",
  kickoutUser = "/api/system/kickoutUser",

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
  getResourceEcsList = "/api/stree/getResourceEcsList",

  getResourceElbUnbindList = "/api/stree/getResourceElbUnbindList",
  bindElbToStreeNode = "/api/stree/bindElbToStreeNode",
  unBindElbToStreeNode = "/api/stree/unBindElbToStreeNode",

  getResourceRdsUnbindList = "/api/stree/getResourceRdsUnbindList",
  bindRdsToStreeNode = "/api/stree/bindRdsToStreeNode",
  unBindRdsToStreeNode = "/api/stree/unBindRdsToStreeNode",

  getResourceDnsUnbindList = "/api/stree/getResourceDnsUnbindList",
  bindDnsToStreeNode = "/api/stree/bindDnsToStreeNode",
  unBindDnsToStreeNode = "/api/stree/unBindDnsToStreeNode",

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
  approvalWorkOrderInstance = "/api/workorder/approvalWorkOrderInstance",
  actionWorkOrderInstance = "/api/workorder/actionWorkOrderInstance",
  getWorkOrderInstanceDetail = "/api/workorder/getWorkOrderInstanceDetail",
  commentWorkOrderInstance = "/api/workorder/commentWorkOrderInstance",
  getWorkOrderNotificationList = "/api/workorder/getNotificationList",


  getJobExecScriptList = "/api/jobexec/getJobExecScriptList",
  getJobExecScriptSelect = "/api/jobexec/getJobExecScriptSelect",
  getJobExecScriptOne = "/api/jobexec/getJobExecScriptOne",
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
  createMonitorAlertManagerSendGroup = "/api/monitor/createMonitorAlertManagerSendGroup",
  updateMonitorAlertManagerSendGroup = "/api/monitor/updateMonitorAlertManagerSendGroup",
  deleteMonitorAlertManagerSendGroup = "/api/monitor/deleteMonitorAlertManagerSendGroup",
  setAlertManagerSendGroupStatus = "/api/monitor/setAlertManagerSendGroupStatus",
  // prom告警规则
  getMonitorPromAlertRuleList = "/api/monitor/getMonitorPromAlertRuleList",
  createMonitorPromAlertRule = "/api/monitor/createMonitorPromAlertRule",
  updateMonitorPromAlertRule = "/api/monitor/updateMonitorPromAlertRule",
  deleteMonitorPromAlertRule = "/api/monitor/deleteMonitorPromAlertRule",
  deleteMonitorPromAlertRuleBatch = "/api/monitor/deleteMonitorPromAlertRuleBatch",
  setMonitorPromAlertRuleStatus = "/api/monitor/setMonitorPromAlertRuleStatus",
  setMonitorPromAlertRuleStatusBatch = "/api/monitor/setMonitorPromAlertRuleStatusBatch",
  promqlExprCheck = "/api/monitor/promqlExprCheck",
  // prom聚合规则
  getMonitorPromRecordRuleList = "/api/monitor/getMonitorPromRecordRuleList",
  createMonitorPromRecordRule = "/api/monitor/createMonitorPromRecordRule",
  updateMonitorPromRecordRule = "/api/monitor/updateMonitorPromRecordRule",
  deleteMonitorPromRecordRule = "/api/monitor/deleteMonitorPromRecordRule",
  deleteMonitorPromRecordRuleBatch = "/api/monitor/deleteMonitorPromRecordRuleBatch",
  setMonitorPromRecordRuleStatus = "/api/monitor/setMonitorPromRecordRuleStatus",
  setMonitorPromRecordRuleStatusBatch = "/api/monitor/setMonitorPromRecordRuleStatusBatch",
  recordRulePromqlExprCheck = "/api/monitor/recordRulePromqlExprCheck",

  // alerm告警事件
  getMonitorAlertManagerEventList = "/api/monitor/getMonitorAlertManagerEventList",
  alertManagerEventSilence = "/api/monitor/alertManagerEventSilence",
  alertManagerEventUnSilence = "/api/monitor/alertManagerEventUnSilence",
  alertManagerEventBatchSilence = '/api/monitor/alertManagerEventBatchSilence',
  alertManagerEventBatchUnSilence = '/api/monitor/alertManagerEventBatchUnSilence',
  alertManagerEventReLing = "/api/monitor/alertManagerEventReLing",

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

  // k8s yaml 模板与任务
  getK8sYamlTemplateList = "/api/k8s/getK8sYamlTemplateList",
  createK8sYamlTemplate = "/api/k8s/createK8sYamlTemplate",
  updateK8sYamlTemplate = "/api/k8s/updateK8sYamlTemplate",
  deleteK8sYamlTemplate = "/api/k8s/deleteK8sYamlTemplate",

  getK8sYamlTaskList = "/api/k8s/getK8sYamlTaskList",
  createK8sYamlTask = "/api/k8s/createK8sYamlTask",
  updateK8sYamlTask = "/api/k8s/updateK8sYamlTask",
  deleteK8sYamlTask = "/api/k8s/deleteK8sYamlTask",
  applyK8sYamlTaskOne = "/api/k8s/applyK8sYamlTaskOne",
  getK8sYamlTaskLogList = "/api/k8s/getK8sYamlTaskLogList",
  getK8sNamespaceList = "/api/k8s/getK8sNamespaceList",
  getK8sPodList = "/api/k8s/getK8sPodList",
  getK8sPodYaml = "/api/k8s/getK8sPodYaml",
  createK8sPod = "/api/k8s/createK8sPod",
  updateK8sPod = "/api/k8s/updateK8sPod",
  deleteK8sPod = "/api/k8s/deleteK8sPod",
  deleteK8sPodBatch = "/api/k8s/deleteK8sPodBatch",
  getK8sPodLogs = "/api/k8s/getK8sPodLogs",
  getK8sPodFileList = "/api/k8s/getK8sPodFileList",
  uploadK8sPodFile = "/api/k8s/uploadK8sPodFile",
  deleteK8sPodFile = "/api/k8s/deleteK8sPodFile",
  readK8sPodFileContent = "/api/k8s/readK8sPodFileContent",
  saveK8sPodFileContent = "/api/k8s/saveK8sPodFileContent",

  // k8s deployment
  getK8sDeploymentList = "/api/k8s/getK8sDeploymentList",
  getK8sDeploymentYaml = "/api/k8s/getK8sDeploymentYaml",
  createK8sDeployment = "/api/k8s/createK8sDeployment",
  updateK8sDeployment = "/api/k8s/updateK8sDeployment",
  scaleK8sDeployment = "/api/k8s/scaleK8sDeployment",
  restartK8sDeployment = "/api/k8s/restartK8sDeployment",
  deleteK8sDeployment = "/api/k8s/deleteK8sDeployment",
  deleteK8sDeploymentBatch = "/api/k8s/deleteK8sDeploymentBatch",

  // k8s statefulset
  getK8sStatefulSetList = "/api/k8s/getK8sStatefulSetList",
  getK8sStatefulSetYaml = "/api/k8s/getK8sStatefulSetYaml",
  createK8sStatefulSet = "/api/k8s/createK8sStatefulSet",
  updateK8sStatefulSet = "/api/k8s/updateK8sStatefulSet",
  scaleK8sStatefulSet = "/api/k8s/scaleK8sStatefulSet",
  restartK8sStatefulSet = "/api/k8s/restartK8sStatefulSet",
  deleteK8sStatefulSet = "/api/k8s/deleteK8sStatefulSet",
  deleteK8sStatefulSetBatch = "/api/k8s/deleteK8sStatefulSetBatch",

  // k8s daemonset
  getK8sDaemonSetList = "/api/k8s/getK8sDaemonSetList",
  getK8sDaemonSetYaml = "/api/k8s/getK8sDaemonSetYaml",
  createK8sDaemonSet = "/api/k8s/createK8sDaemonSet",
  updateK8sDaemonSet = "/api/k8s/updateK8sDaemonSet",
  restartK8sDaemonSet = "/api/k8s/restartK8sDaemonSet",
  deleteK8sDaemonSet = "/api/k8s/deleteK8sDaemonSet",
  deleteK8sDaemonSetBatch = "/api/k8s/deleteK8sDaemonSetBatch",

  // k8s configmap
  getK8sConfigMapList = "/api/k8s/getK8sConfigMapList",
  getK8sConfigMapYaml = "/api/k8s/getK8sConfigMapYaml",
  createK8sConfigMap = "/api/k8s/createK8sConfigMap",
  updateK8sConfigMap = "/api/k8s/updateK8sConfigMap",
  deleteK8sConfigMap = "/api/k8s/deleteK8sConfigMap",
  deleteK8sConfigMapBatch = "/api/k8s/deleteK8sConfigMapBatch",

  // k8s secret
  getK8sSecretList = "/api/k8s/getK8sSecretList",
  getK8sSecretYaml = "/api/k8s/getK8sSecretYaml",
  createK8sSecret = "/api/k8s/createK8sSecret",
  updateK8sSecret = "/api/k8s/updateK8sSecret",
  deleteK8sSecret = "/api/k8s/deleteK8sSecret",
  deleteK8sSecretBatch = "/api/k8s/deleteK8sSecretBatch",

  // k8s service
  getK8sServiceList = "/api/k8s/getK8sServiceList",
  getK8sServiceYaml = "/api/k8s/getK8sServiceYaml",
  createK8sService = "/api/k8s/createK8sService",
  updateK8sService = "/api/k8s/updateK8sService",
  deleteK8sService = "/api/k8s/deleteK8sService",
  deleteK8sServiceBatch = "/api/k8s/deleteK8sServiceBatch",

  // k8s ingress
  getK8sIngressList = "/api/k8s/getK8sIngressList",
  getK8sIngressYaml = "/api/k8s/getK8sIngressYaml",
  createK8sIngress = "/api/k8s/createK8sIngress",
  updateK8sIngress = "/api/k8s/updateK8sIngress",
  deleteK8sIngress = "/api/k8s/deleteK8sIngress",
  deleteK8sIngressBatch = "/api/k8s/deleteK8sIngressBatch",

  // k8s project, app, instance
  getK8sProjectList = "/api/k8s/getK8sProjectList",
  getK8sProjectOne = "/api/k8s/getK8sProjectOne",
  createK8sProject = "/api/k8s/createK8sProject",
  updateK8sProject = "/api/k8s/updateK8sProject",
  deleteK8sProject = "/api/k8s/deleteK8sProject",

  getK8sAppList = "/api/k8s/getK8sAppList",
  getK8sAppOne = "/api/k8s/getK8sAppOne",
  createK8sApp = "/api/k8s/createK8sApp",
  updateK8sApp = "/api/k8s/updateK8sApp",
  deleteK8sApp = "/api/k8s/deleteK8sApp",

  getK8sInstanceList = "/api/k8s/getK8sInstanceList",
  getK8sInstanceOne = "/api/k8s/getK8sInstanceOne",
  createK8sInstance = "/api/k8s/createK8sInstance",
  updateK8sInstance = "/api/k8s/updateK8sInstance",
  deleteK8sInstance = "/api/k8s/deleteK8sInstance",
  deployK8sInstance = "/api/k8s/deployK8sInstance",
}

export const getAccountList = (params: AccountParams) =>
  defHttp.get<AccountListGetResultModel>({ url: Api.AccountList, params });

export const createAccount = (data) =>
  defHttp.post({ url: Api.createAccount, data });

export const updateAccount = (data) =>
  defHttp.post({ url: Api.updateAccount, data });

export const deleteAccount = (id: number) =>
  defHttp.delete({ url: Api.deleteAccount + "/" + id });

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
  defHttp.delete({ url: Api.deleteMenu + "/" + id });

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
  defHttp.delete({ url: Api.deleteRole + "/" + id });

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
  defHttp.delete({ url: Api.deleteApi + "/" + id });

export const getAuditLogList = (params?: any) =>
  defHttp.get({ url: Api.getAuditLogList, params });

export const getLoginLogList = (params?: any) =>
  defHttp.get({ url: Api.getLoginLogList, params });

export const getOnlineUserList = () =>
  defHttp.get({ url: Api.getOnlineUserList });

export const kickoutUser = (userName: string) =>
  defHttp.post({ url: Api.kickoutUser, data: { userName } });



export const getStreeNodeList = (params?: MenuParams) =>
  defHttp.get({ url: Api.StreeNodeList, params });

export const getTopStreeNodes = (params?: MenuParams) =>
  defHttp.get({ url: Api.getTopStreeNodes, params });

export const createStreeNode = (data) =>
  defHttp.post({ url: Api.createStreeNode, data });

export const updateStreeNode = (data) =>
  defHttp.post({ url: Api.updateStreeNode, data });

export const deleteStreeNode = (id) =>
  defHttp.delete({ url: Api.deleteStreeNode + "/" + id });

export const getChildrenStreeNodes = (id) =>
  defHttp.get({ url: Api.getChildrenStreeNodes + "/" + id });

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

export const getResourceDnsUnbindList = () =>
  defHttp.get({ url: Api.getResourceDnsUnbindList });

export const bindDnsToStreeNode = (data) =>
  defHttp.post({ url: Api.bindDnsToStreeNode, data });

export const unBindDnsToStreeNode = (data) =>
  defHttp.post({ url: Api.unBindDnsToStreeNode, data });

export const fetchResourceByNode = (params) =>
  defHttp.get({ url: Api.fetchResourceByNode, params: params });




export const getProcessList = (params?: any) =>
  defHttp.get({ url: Api.getProcessList, params });

export const createProcess = (data) =>
  defHttp.post({ url: Api.createProcess, data });

export const updateProcess = (data) =>
  defHttp.post({ url: Api.updateProcess, data });

export const deleteProcess = (id) =>
  defHttp.delete({ url: Api.deleteProcess + "/" + id });


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

export const getWorkOrderNotificationList = () =>
  defHttp.get({ url: Api.getWorkOrderNotificationList });

export const markWorkOrderNotifyRead = (noticeId: string) =>
  defHttp.post({ url: '/api/workorder/markNotifyRead', data: { noticeId } });

export const clearWorkOrderNotifyTab = (noticeIds: string[]) =>
  defHttp.post({ url: '/api/workorder/clearNotifyTab', data: { noticeIds } });





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
  defHttp.post({ url: `${Api.actionJobExecTaskOne}/${id}?action=${action}` });

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
  defHttp.get({ url: Api.getMonitorPrometheusYamlOne + "?ip=" + ip });

export const getMonitorPrometheusAlertRuleYamlOne = (ip: string) =>
  defHttp.get({ url: Api.getMonitorPrometheusAlertRuleYamlOne + "?ip=" + ip });

export const getMonitorPrometheusRecordRuleYamlOne = (ip: string) =>
  defHttp.get({ url: Api.getMonitorPrometheusRecordRuleYamlOne + "?ip=" + ip });

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
  defHttp.get({ url: Api.getMonitorAlertManagerYamlOne + "?ip=" + ip });


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

// K8s YAML Template API
export const getK8sYamlTemplateList = (params?: any) =>
  defHttp.get({ url: Api.getK8sYamlTemplateList, params });

export const createK8sYamlTemplate = (data?: any) =>
  defHttp.post({ url: Api.createK8sYamlTemplate, data });

export const updateK8sYamlTemplate = (data?: any) =>
  defHttp.post({ url: Api.updateK8sYamlTemplate, data });

export const deleteK8sYamlTemplate = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteK8sYamlTemplate}/${id}` });

// K8s YAML Task API
export const getK8sYamlTaskList = (params?: any) =>
  defHttp.get({ url: Api.getK8sYamlTaskList, params });

export const createK8sYamlTask = (data?: any) =>
  defHttp.post({ url: Api.createK8sYamlTask, data });

export const updateK8sYamlTask = (data?: any) =>
  defHttp.post({ url: Api.updateK8sYamlTask, data });

export const deleteK8sYamlTask = (id: number | string) =>
  defHttp.delete({ url: `${Api.deleteK8sYamlTask}/${id}` });

export const applyK8sYamlTaskOne = (id: number | string) =>
  defHttp.post({ url: `${Api.applyK8sYamlTaskOne}/${id}` });

export const getK8sYamlTaskLogList = (params?: any) =>
  defHttp.get({ url: Api.getK8sYamlTaskLogList, params });

export const getK8sNamespaceList = (params?: any) =>
  defHttp.get({ url: Api.getK8sNamespaceList, params });

export const getK8sPodList = (params?: any) =>
  defHttp.get({ url: Api.getK8sPodList, params });

export const getK8sPodYaml = (params?: any) =>
  defHttp.get({ url: Api.getK8sPodYaml, params });

export const createK8sPod = (data?: any) =>
  defHttp.post({ url: Api.createK8sPod, data });

export const updateK8sPod = (data?: any) =>
  defHttp.post({ url: Api.updateK8sPod, data });

export const deleteK8sPod = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sPod, data });

export const deleteK8sPodBatch = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sPodBatch, data });

export const getK8sPodLogs = (params?: any) =>
  defHttp.get({ url: Api.getK8sPodLogs, params });

export const getK8sPodFileList = (params?: any) =>
  defHttp.get({ url: Api.getK8sPodFileList, params }, { errorMessageMode: 'none' });

export const deleteK8sPodFile = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sPodFile, data }, { errorMessageMode: 'none' });

export const readK8sPodFileContent = (params?: any) =>
  defHttp.get({ url: Api.readK8sPodFileContent, params }, { errorMessageMode: 'none' });

export const saveK8sPodFileContent = (data?: any) =>
  defHttp.post({ url: Api.saveK8sPodFileContent, data }, { errorMessageMode: 'none' });

export const getK8sDeploymentList = (params?: any) =>
  defHttp.get({ url: Api.getK8sDeploymentList, params });

export const getK8sDeploymentYaml = (params?: any) =>
  defHttp.get({ url: Api.getK8sDeploymentYaml, params });

export const createK8sDeployment = (data?: any) =>
  defHttp.post({ url: Api.createK8sDeployment, data });

export const updateK8sDeployment = (data?: any) =>
  defHttp.post({ url: Api.updateK8sDeployment, data });

export const scaleK8sDeployment = (data?: any) =>
  defHttp.post({ url: Api.scaleK8sDeployment, data });

export const restartK8sDeployment = (data?: any) =>
  defHttp.post({ url: Api.restartK8sDeployment, data });

export const deleteK8sDeployment = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sDeployment, data });

export const deleteK8sDeploymentBatch = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sDeploymentBatch, data });

// StatefulSet
export const getK8sStatefulSetList = (params?: any) =>
  defHttp.get({ url: Api.getK8sStatefulSetList, params });
export const getK8sStatefulSetYaml = (params?: any) =>
  defHttp.get({ url: Api.getK8sStatefulSetYaml, params });
export const createK8sStatefulSet = (data?: any) =>
  defHttp.post({ url: Api.createK8sStatefulSet, data });
export const updateK8sStatefulSet = (data?: any) =>
  defHttp.post({ url: Api.updateK8sStatefulSet, data });
export const scaleK8sStatefulSet = (data?: any) =>
  defHttp.post({ url: Api.scaleK8sStatefulSet, data });
export const restartK8sStatefulSet = (data?: any) =>
  defHttp.post({ url: Api.restartK8sStatefulSet, data });
export const deleteK8sStatefulSet = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sStatefulSet, data });
export const deleteK8sStatefulSetBatch = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sStatefulSetBatch, data });

// DaemonSet
export const getK8sDaemonSetList = (params?: any) =>
  defHttp.get({ url: Api.getK8sDaemonSetList, params });
export const getK8sDaemonSetYaml = (params?: any) =>
  defHttp.get({ url: Api.getK8sDaemonSetYaml, params });
export const createK8sDaemonSet = (data?: any) =>
  defHttp.post({ url: Api.createK8sDaemonSet, data });
export const updateK8sDaemonSet = (data?: any) =>
  defHttp.post({ url: Api.updateK8sDaemonSet, data });
export const restartK8sDaemonSet = (data?: any) =>
  defHttp.post({ url: Api.restartK8sDaemonSet, data });
export const deleteK8sDaemonSet = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sDaemonSet, data });
export const deleteK8sDaemonSetBatch = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sDaemonSetBatch, data });

// ConfigMap
export const getK8sConfigMapList = (params?: any) =>
  defHttp.get({ url: Api.getK8sConfigMapList, params });
export const getK8sConfigMapYaml = (params?: any) =>
  defHttp.get({ url: Api.getK8sConfigMapYaml, params });
export const createK8sConfigMap = (data?: any) =>
  defHttp.post({ url: Api.createK8sConfigMap, data });
export const updateK8sConfigMap = (data?: any) =>
  defHttp.post({ url: Api.updateK8sConfigMap, data });
export const deleteK8sConfigMap = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sConfigMap, data });
export const deleteK8sConfigMapBatch = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sConfigMapBatch, data });

// Secret
export const getK8sSecretList = (params?: any) =>
  defHttp.get({ url: Api.getK8sSecretList, params });
export const getK8sSecretYaml = (params?: any) =>
  defHttp.get({ url: Api.getK8sSecretYaml, params });
export const createK8sSecret = (data?: any) =>
  defHttp.post({ url: Api.createK8sSecret, data });
export const updateK8sSecret = (data?: any) =>
  defHttp.post({ url: Api.updateK8sSecret, data });
export const deleteK8sSecret = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sSecret, data });
export const deleteK8sSecretBatch = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sSecretBatch, data });

// Service
export const getK8sServiceList = (params?: any) =>
  defHttp.get({ url: Api.getK8sServiceList, params });
export const getK8sServiceYaml = (params?: any) =>
  defHttp.get({ url: Api.getK8sServiceYaml, params });
export const createK8sService = (data?: any) =>
  defHttp.post({ url: Api.createK8sService, data });
export const updateK8sService = (data?: any) =>
  defHttp.post({ url: Api.updateK8sService, data });
export const deleteK8sService = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sService, data });
export const deleteK8sServiceBatch = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sServiceBatch, data });

// Ingress
export const getK8sIngressList = (params?: any) =>
  defHttp.get({ url: Api.getK8sIngressList, params });
export const getK8sIngressYaml = (params?: any) =>
  defHttp.get({ url: Api.getK8sIngressYaml, params });
export const createK8sIngress = (data?: any) =>
  defHttp.post({ url: Api.createK8sIngress, data });
export const updateK8sIngress = (data?: any) =>
  defHttp.post({ url: Api.updateK8sIngress, data });
export const deleteK8sIngress = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sIngress, data });
export const deleteK8sIngressBatch = (data?: any) =>
  defHttp.post({ url: Api.deleteK8sIngressBatch, data });

// Project
export const getK8sProjectList = (params?: any) =>
  defHttp.get({ url: Api.getK8sProjectList, params });
export const getK8sProjectOne = (id: number) =>
  defHttp.get({ url: `${Api.getK8sProjectOne}/${id}` });
export const createK8sProject = (data?: any) =>
  defHttp.post({ url: Api.createK8sProject, data });
export const updateK8sProject = (data?: any) =>
  defHttp.post({ url: Api.updateK8sProject, data });
export const deleteK8sProject = (id: number) =>
  defHttp.delete({ url: `${Api.deleteK8sProject}/${id}` });

// App
export const getK8sAppList = (params?: any) =>
  defHttp.get({ url: Api.getK8sAppList, params });
export const getK8sAppOne = (id: number) =>
  defHttp.get({ url: `${Api.getK8sAppOne}/${id}` });
export const createK8sApp = (data?: any) =>
  defHttp.post({ url: Api.createK8sApp, data });
export const updateK8sApp = (data?: any) =>
  defHttp.post({ url: Api.updateK8sApp, data });
export const deleteK8sApp = (id: number) =>
  defHttp.delete({ url: `${Api.deleteK8sApp}/${id}` });

// Instance
export const getK8sInstanceList = (params?: any) =>
  defHttp.get({ url: Api.getK8sInstanceList, params });
export const getK8sInstanceOne = (id: number) =>
  defHttp.get({ url: `${Api.getK8sInstanceOne}/${id}` });
export const createK8sInstance = (data?: any) =>
  defHttp.post({ url: Api.createK8sInstance, data });
export const updateK8sInstance = (data?: any) =>
  defHttp.post({ url: Api.updateK8sInstance, data });
export const deleteK8sInstance = (id: number) =>
  defHttp.delete({ url: `${Api.deleteK8sInstance}/${id}` });
export const deployK8sInstance = (id: number) =>
  defHttp.post({ url: `${Api.deployK8sInstance}/${id}` });











export const updateUserInfoApi = (data: any) =>
  defHttp.post({ url: Api.updateUserInfo, data });

export const uploadAvatarApi = (params: any, onUploadProgress?: any) =>
  defHttp.uploadFile<{ url: string; avatar: string }>(
    {
      url: Api.uploadAvatar,
      onUploadProgress,
    },
    params,
  );
