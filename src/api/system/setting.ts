import { defHttp } from '@/utils/http/axios';

enum Api {
  GetSetting = '/api/system/setting/get',
  UpdateSetting = '/api/system/setting/update',
}

export interface SystemSetting {
  watermarkEnabled: boolean;
  watermarkText: string;
  upgradePromptEnabled?: boolean;
  upgradePromptTiming?: 'never' | 'every_login' | 'version_once' | 'day_once';
  upgradePromptTitle?: string;
  upgradePromptVersion?: string;
  upgradePromptContent?: string;
}

export const getSystemSetting = () => {
  return defHttp.get<SystemSetting>({ url: Api.GetSetting });
};

export const updateSystemSetting = (data: SystemSetting) => {
  return defHttp.put({ url: Api.UpdateSetting, data });
};
