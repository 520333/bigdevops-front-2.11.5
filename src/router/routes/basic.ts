import type { AppRouteRecordRaw } from '@/router/types';
import { t } from '@/hooks/web/useI18n';
import { REDIRECT_NAME, LAYOUT, EXCEPTION_COMPONENT, PAGE_NOT_FOUND_NAME } from '@/router/constant';

// 404 on a page
export const PAGE_NOT_FOUND_ROUTE: AppRouteRecordRaw = {
  path: '/:path(.*)*',
  name: PAGE_NOT_FOUND_NAME,
  component: LAYOUT,
  meta: {
    title: 'ErrorPage',
    hideBreadcrumb: true,
    hideMenu: true,
  },
  children: [
    {
      path: '/:path(.*)*',
      // name: PAGE_NOT_FOUND_NAME,
      name: 'PageNotFoundEx',
      component: EXCEPTION_COMPONENT,
      meta: {
        title: 'ErrorPage',
        hideBreadcrumb: true,
        hideMenu: true,
      },
    },
  ],
};

export const REDIRECT_ROUTE: AppRouteRecordRaw = {
  path: '/redirect',
  component: LAYOUT,
  name: 'RedirectTo',
  meta: {
    title: REDIRECT_NAME,
    hideBreadcrumb: true,
    hideMenu: true,
  },
  children: [
    {
      path: '/redirect/:path(.*)/:_redirect_type(.*)/:_origin_params(.*)?',
      name: REDIRECT_NAME,
      component: () => import('@/views/sys/redirect/index.vue'),
      meta: {
        title: REDIRECT_NAME,
        hideBreadcrumb: true,
      },
    },
  ],
};

export const ERROR_LOG_ROUTE: AppRouteRecordRaw = {
  path: '/error-log',
  name: 'ErrorLog',
  component: LAYOUT,
  redirect: '/error-log/list',
  meta: {
    title: 'ErrorLog',
    hideBreadcrumb: true,
    hideChildrenInMenu: true,
  },
  children: [
    {
      path: 'list',
      name: 'ErrorLogList',
      component: () => import('@/views/sys/error-log/index.vue'),
      meta: {
        title: t('routes.basic.errorLogList'),
        hideBreadcrumb: true,
        currentActiveMenu: '/error-log',
      },
    },
  ],
};

export const OAUTH_CALLBACK_ROUTE = {
  path: '/oauth/callback',
  name: 'OauthCallback',
  component: () => import('@/views/sys/login/OauthCallback.vue'),
  meta: {
    title: 'SSO 登录回调',
    ignoreAuth: true, // 必须忽略 Auth 检查
  },
};

export const DINGTALK_CALLBACK_ROUTE = {
  path: '/oauth/dingtalk',
  name: 'DingtalkCallback',
  component: () => import('@/views/sys/login/DingtalkCallback.vue'),
  meta: {
    title: '钉钉 SSO 登录回调',
    ignoreAuth: true, // 必须忽略 Auth 检查
  },
};
export const ACCOUNT_SETTING_ROUTE: AppRouteRecordRaw = {
  path: '/system/accountSetting',
  name: 'AccountSettingStatic',
  component: LAYOUT,
  meta: {
    title: '个人设置',
    hideMenu: true,
  },
  children: [
    {
      path: '',
      name: 'AccountSettingPageStatic',
      component: () => import('@/views/system/account/setting/index.vue'),
      meta: {
        title: '个人设置',
        hideMenu: true,
      },
    },
  ],
};

// 兼容访问 /workorder/instance (小写)
export const WORKORDER_INSTANCE_ROUTE: AppRouteRecordRaw = {
  path: '/workorder/instance',
  name: 'WorkOrderInstanceStatic',
  component: LAYOUT,
  meta: {
    title: '工单管理',
    hideMenu: true,
  },
  children: [
    {
      path: '',
      name: 'WorkOrderInstancePageStatic',
      component: () => import('@/views/workorder/ticket/search.vue'),
      meta: {
        title: '工单管理',
        hideMenu: true,
        currentActiveMenu: '/workOrder/search',
      },
    },
  ],
};

// 兼容访问 /workOrder/instance (驼峰)
export const WORKORDER_INSTANCE_UPPER_ROUTE: AppRouteRecordRaw = {
  path: '/workOrder/instance',
  name: 'WorkOrderInstanceUpperStatic',
  component: LAYOUT,
  meta: {
    title: '工单管理',
    hideMenu: true,
  },
  children: [
    {
      path: '',
      name: 'WorkOrderInstanceUpperPageStatic',
      component: () => import('@/views/workorder/ticket/search.vue'),
      meta: {
        title: '工单管理',
        hideMenu: true,
        currentActiveMenu: '/workOrder/search',
      },
    },
  ],
};

// 兼容访问 /workorder/search (小写)
export const WORKORDER_SEARCH_LOWER_ROUTE: AppRouteRecordRaw = {
  path: '/workorder/search',
  name: 'WorkOrderSearchLowerStatic',
  component: LAYOUT,
  meta: {
    title: '我的工单',
    hideMenu: true,
  },
  children: [
    {
      path: '',
      name: 'WorkOrderSearchLowerPageStatic',
      component: () => import('@/views/workorder/ticket/search.vue'),
      meta: {
        title: '我的工单',
        hideMenu: true,
        currentActiveMenu: '/workOrder/search',
      },
    },
  ],
};

// 兼容访问 /workorder/detail (小写)
export const WORKORDER_DETAIL_LOWER_ROUTE: AppRouteRecordRaw = {
  path: '/workorder/detail',
  name: 'WorkOrderDetailLowerStatic',
  component: LAYOUT,
  meta: {
    title: '工单详情',
    hideMenu: true,
  },
  children: [
    {
      path: '',
      name: 'WorkOrderDetailLowerPageStatic',
      component: () => import('@/views/workorder/detail/index.vue'),
      meta: {
        title: '工单详情',
        hideMenu: true,
        currentActiveMenu: '/workOrder/search',
      },
    },
  ],
};

// 兼容访问 /resource/ecs，重定向到资产管理 CMDB 服务树 /serviceTree/streeAsync
export const RESOURCE_ECS_REDIRECT_ROUTE: AppRouteRecordRaw = {
  path: '/resource/ecs',
  name: 'ResourceEcsRedirect',
  redirect: '/serviceTree/streeAsync',
  meta: {
    title: '资产管理',
    hideMenu: true,
  },
};

