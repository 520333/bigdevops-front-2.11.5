import { defHttp } from '@/utils/http/axios';
import { LoginParams, LoginResultModel, GetUserInfoModel } from './model/userModel';

import { ErrorMessageMode } from '#/axios';

enum Api {
  Login = '/login',
  Logout = '/logout',
  GetUserInfo = '/api/getUserInfo',
  GetPermCode = '/api/getPermCode',
  TestRetry = '/testRetry',
}

/**
 * @description: user login api
 */
export function loginApi(params: LoginParams, mode: ErrorMessageMode = 'modal') {
  return defHttp.post<LoginResultModel>(
    {
      url: Api.Login,
      params,
    },
    {
      errorMessageMode: mode,
    },
  );
}

/**
 * @description: getUserInfo
 */
export function getUserInfo() {
  return defHttp.get<GetUserInfoModel>({ url: Api.GetUserInfo }, { errorMessageMode: 'none' });
}

export function getPermCode() {
  return defHttp.get<string[]>({ url: Api.GetPermCode });
}

export function doLogout() {
  return defHttp.get({ url: Api.Logout });
}

export function testRetry() {
  return defHttp.get(
    { url: Api.TestRetry },
    {
      retryRequest: {
        isOpenRetry: true,
        count: 0,
        waitTime: 1000,
      },
    },
  );
}

export interface PlatformTelemetryModel {
  clusters: number;
  pods: number;
  pipelineRuns: number;
  alertRate: number;
  updatedAt?: number;
}

/**
 * @description: 获取登录页平台大盘公开遥测数据（免鉴权）
 */
export function getPlatformTelemetry() {
  return defHttp.get<PlatformTelemetryModel>(
    { url: '/noAuth/platform/telemetry' },
    { errorMessageMode: 'none' },
  );
}
