import { defHttp } from '@/utils/http/axios';

enum Api {
  GetOverviewData = '/api/dashboard/getOverviewData',
}

export interface DashboardCardItem {
  title: string;
  icon: string;
  value: number | string;
  color: string;
  footerText: string;
  footerValue: string;
  suffix?: string;
  route?: string;
  footerRoute?: string;
}

export interface DashboardTrendChart {
  dates: string[];
  buildCounts: number[];
  successCounts: number[];
}

export interface DashboardPieItem {
  name: string;
  value: number;
}

export interface DashboardTaskItem {
  id: number;
  title: string;
  desc: string;
  status: string;
  createTime: string;
  creator: string;
  route: string;
}

export interface DashboardActivityItem {
  title: string;
  time: string;
  icon: string;
  color: string;
  status: string;
  jobName: string;
}

export interface DashboardQuickAction {
  title: string;
  icon: string;
  color: string;
  route: string;
  desc: string;
}

export interface DashboardOverviewResp {
  isAdmin: boolean;
  cards: DashboardCardItem[];
  trendChart: DashboardTrendChart;
  envDistribution: DashboardPieItem[];
  myPendingTasks: DashboardTaskItem[];
  myAppliedOrders: DashboardTaskItem[];
  recentActivities: DashboardActivityItem[];
  quickActions: DashboardQuickAction[];
}

export const getDashboardOverviewData = () =>
  defHttp.get<DashboardOverviewResp>({ url: Api.GetOverviewData });
