import type { AppRouteRecordRaw, AppRouteModule } from '@/router/types';

import {
  PAGE_NOT_FOUND_ROUTE,
  REDIRECT_ROUTE,
  CICD_WORKORDER_DETAIL_ROUTE,
  OAUTH_CALLBACK_ROUTE,
  DINGTALK_CALLBACK_ROUTE,
  ACCOUNT_SETTING_ROUTE,
} from '@/router/routes/basic';

import { mainOutRoutes } from './mainOut';
import { PageEnum } from '@/enums/pageEnum';
import { t } from '@/hooks/web/useI18n';

// import.meta.glob() 直接引入所有的模块 Vite 独有的功能
const modules = import.meta.glob('./modules/**/*.ts', { eager: true });
const routeModuleList: AppRouteModule[] = [];

// 加入到路由集合中
Object.keys(modules).forEach((key) => {
  const mod = (modules as Recordable)[key].default || {};
  const modList = Array.isArray(mod) ? [...mod] : [mod];
  routeModuleList.push(...modList);
});

export const asyncRoutes = [PAGE_NOT_FOUND_ROUTE, ...routeModuleList];

// 根路由
export const RootRoute: AppRouteRecordRaw = {
  path: '/',
  name: 'Root',
  redirect: PageEnum.BASE_HOME,
  meta: {
    title: 'Root',
  },
};

// 默认登录页（新版云原生智能运维平台登录页）
export const LoginRoute: AppRouteRecordRaw = {
  path: '/login',
  name: 'Login',
  component: () => import('@/views/sys/login/LoginDevops.vue'),
  meta: {
    title: 'BigDevOps 智能云原生运维平台',
    ignoreAuth: true,
  },
};

// 保留原版旧登录页
export const LoginOldRoute: AppRouteRecordRaw = {
  path: '/login-old',
  name: 'LoginOld',
  component: () => import('@/views/sys/login/Login.vue'),
  meta: {
    title: t('routes.basic.login'),
    ignoreAuth: true,
  },
};

// 兼容老路径 /login-v2 直接重定向到 /login
export const LoginV2RedirectRoute: AppRouteRecordRaw = {
  path: '/login-v2',
  name: 'LoginV2Redirect',
  redirect: '/login',
  meta: {
    title: 'BigDevOps 智能云原生运维平台',
    ignoreAuth: true,
  },
};

// Basic routing without permission
// 未经许可的基本路由
export const basicRoutes = [
  LoginRoute,
  LoginOldRoute,
  LoginV2RedirectRoute,
  RootRoute,
  ...mainOutRoutes,
  REDIRECT_ROUTE,
  PAGE_NOT_FOUND_ROUTE,
  CICD_WORKORDER_DETAIL_ROUTE,
  OAUTH_CALLBACK_ROUTE,
  DINGTALK_CALLBACK_ROUTE,
  ACCOUNT_SETTING_ROUTE,
];
