<template>
  <div :class="prefixCls" class="relative w-full h-full px-4">
    <!-- 右上角控制栏（与原版保持一致） -->
    <div class="flex items-center absolute right-4 top-4 z-20">
      <a href="/#/login-old"
        class="enter-x mr-3 px-3 py-1 text-xs rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition-all flex items-center gap-1 cursor-pointer"
        style="text-decoration: none;">
        <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>原版登录页</span>
      </a>
      <AppDarkModeToggle class="enter-x mr-2" v-if="!sessionTimeout" />
      <AppLocalePicker class="text-white enter-x xl:text-gray-600" :show-text="false"
        v-if="!sessionTimeout && showLocale" />
    </div>

    <!-- 小屏幕 Logo (原版标准) -->
    <span class="-enter-x xl:hidden">
      <AppLogo :alwaysShowTitle="true" />
    </span>

    <!-- 主体容器 (原版标准结构：container relative h-full py-2 mx-auto sm:px-10) -->
    <div class="container relative h-full py-2 mx-auto sm:px-10">
      <div class="flex h-full">
        <!-- 左侧平台展示区 (原版标准结构：hidden min-h-full pl-4 mr-4 xl:flex xl:flex-col xl:w-6/12) -->
        <div class="hidden min-h-full pl-4 mr-4 xl:flex xl:flex-col xl:w-6/12">
          <AppLogo class="-enter-x" />
          <div class="my-auto">
            <!-- 顶部徽章 -->
            <div
              class="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full text-xs font-semibold tracking-wide border border-sky-400/30 bg-sky-500/10 text-sky-400 -enter-x">
              <!-- <span>⚡</span> -->
              <span>BigDevOps Cloud-Native Platform v1.0</span>
            </div>

            <!-- 主标题 -->
            <div class="font-bold text-3xl xl:text-4xl text-white dark:text-white -enter-x mb-2 leading-tight">
              下一代企业级<br />
              <span class="text-gradient">智能云原生运维交付平台</span>
            </div>

            <!-- 描述 -->
            <div class="text-sm font-normal text-white/80 dark:text-gray-400 -enter-x mb-6 max-w-lg leading-relaxed">
              融合多云 Kubernetes 编排、GitOps 自动化交付流水线、Prometheus 全链路可观测与 AIOps 智能异常根因诊断。
            </div>

            <!-- 核心能力卡片四矩阵 (紧凑适配) -->
            <div class="grid grid-cols-2 gap-3 mb-6 -enter-x max-w-lg">
              <div class="feature-card">
                <div class="feature-icon cyan">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div class="feature-text">
                  <div class="title">Kubernetes 多集群</div>
                  <div class="desc">多云纳管与微服务治理</div>
                </div>
              </div>

              <div class="feature-card">
                <div class="feature-icon blue">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div class="feature-text">
                  <div class="title">CI/CD 自动化交付</div>
                  <div class="desc">合规扫描与灰度发布</div>
                </div>
              </div>

              <div class="feature-card">
                <div class="feature-icon purple">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <div class="feature-text">
                  <div class="title">AIOps 智能可观测</div>
                  <div class="desc">告警时序降噪与根因分析</div>
                </div>
              </div>

              <div class="feature-card">
                <div class="feature-icon emerald">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <div class="feature-text">
                  <div class="title">CMDB 与审计中心</div>
                  <div class="desc">资产拓扑与会话录屏审计</div>
                </div>
              </div>
            </div>

            <!-- 平台实时遥测数据条 -->
            <div class="telemetry-box flex items-center justify-between p-3 rounded-lg border max-w-lg -enter-x">
              <div class="telemetry-col">
                <div class="label">纳管集群</div>
                <div class="val text-cyan-400">{{ telemetryData.clusters }} <small>Clusters</small></div>
              </div>
              <div class="telemetry-col">
                <div class="label">运行容器</div>
                <div class="val text-blue-400">{{ telemetryData.pods }} <small>Pods</small></div>
              </div>
              <div class="telemetry-col">
                <div class="label">流水线构建</div>
                <div class="val text-purple-400">{{ telemetryData.pipelineRuns }} <small>Runs</small></div>
              </div>
              <div class="telemetry-col">
                <div class="label">告警收敛率</div>
                <div class="val text-emerald-400">{{ telemetryData.alertRate }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧表单区 (原版标准结构：flex w-full h-full py-5 xl:h-auto xl:py-0 xl:my-0 xl:w-6/12) -->
        <div class="flex w-full h-full py-5 xl:h-auto xl:py-0 xl:my-0 xl:w-6/12">
          <div :class="`${prefixCls}-form`"
            class="relative w-full px-5 py-7 mx-auto my-auto rounded-xl shadow-md xl:ml-16 sm:px-8 xl:p-6 sm:w-[380px] lg:w-[400px] xl:w-[410px] enter-x">
            <!-- 卡片头部标题 -->
            <div class="form-header mb-4 enter-x">
              <div class="text-xs uppercase tracking-wider text-sky-400 font-semibold mb-1">
                SECURITY AUTHENTICATION
              </div>
              <h2 class="text-2xl font-bold m-0 form-title">
                登录控制台
              </h2>
              <p class="text-xs form-subtitle mt-1 mb-0">
                请输入您的工程师凭据以接入 BigDevOps 生产环境
              </p>
            </div>

            <!-- Tab 认证模式切换 -->
            <div class="auth-tabs flex mb-4 p-1 rounded-lg border enter-x">
              <button
                class="tab-btn flex-1 py-1.5 px-3 text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-all"
                :class="{ active: authMode === 'account' }" @click="authMode = 'account'">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>账号认证</span>
              </button>
              <button
                class="tab-btn flex-1 py-1.5 px-3 text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-all"
                :class="{ active: authMode === 'sso' }" @click="authMode = 'sso'">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>企业 SSO 认证</span>
              </button>
            </div>

            <!-- 统一表单高度容器（彻底避免切换 Tab 时卡片高度跳动） -->
            <div class="tab-content-wrapper min-h-[210px] flex flex-col justify-between">
              <!-- 账号密码表单 -->
              <div v-if="authMode === 'account'" class="enter-x flex flex-col justify-between h-full">
                <div>
                  <!-- 用户名输入 -->
                  <div class="form-item mb-3">
                    <Input size="large" v-model:value="formData.account" :placeholder="t('sys.login.userName')"
                      @pressEnter="handleLogin">
                      <template #prefix>
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2"
                          fill="none" class="text-gray-400">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </template>
                    </Input>
                  </div>

                  <!-- 密码输入 -->
                  <div class="form-item mb-3">
                    <InputPassword size="large" visibilityToggle v-model:value="formData.password"
                      :placeholder="t('sys.login.password')" @pressEnter="handleLogin">
                      <template #prefix>
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2"
                          fill="none" class="text-gray-400">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </template>
                    </InputPassword>
                  </div>

                  <!-- 记住我与忘记密码 (原版标准 ARow/ACol 结构) -->
                  <div class="flex items-center justify-between mb-4">
                    <Checkbox v-model:checked="rememberMe" size="small" class="remember-me-checkbox">
                      {{ t('sys.login.rememberMe') }}
                    </Checkbox>
                    <Button type="link" size="small" class="forgot-link-btn p-0" @click="handleForgotTip">
                      {{ t('sys.login.forgetPassword') }}
                    </Button>
                  </div>
                </div>

                <!-- 登录按钮 -->
                <Button type="primary" size="large" block :loading="loading" @click="handleLogin"
                  class="login-submit-btn">
                  {{ t('sys.login.loginButton') }}
                </Button>
              </div>

              <!-- SSO 模式 -->
              <div v-else class="sso-panel enter-x flex flex-col justify-between h-full">
                <div class="sso-desc-card p-3 rounded-lg border mb-3">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs font-semibold text-sky-400">企业级 SSO 联合认证</span>
                    <span
                      class="text-[11px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">双通道已就绪</span>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    支持通过钉钉企业免密扫码认证或 Keycloak 统一凭证通道快速安全接入。
                  </div>
                </div>

                <div class="flex flex-col gap-2.5">
                  <!-- 钉钉单点登录主按钮 (使用系统主题色) -->
                  <Button type="primary" size="large" block
                    class="!h-10 !flex !items-center !justify-center gap-2 text-sm font-medium"
                    @click="handleDingTalkLogin">
                    <DingtalkCircleFilled style="font-size: 19px;" class="flex-shrink-0" />
                    <span>钉钉登录</span>
                  </Button>

                  <!-- Keycloak 统一登录次按钮 (遵循主题规范与主题色 hover) -->
                  <Button size="large" block
                    class="!h-10 !flex !items-center !justify-center gap-2 text-sm font-medium transition-all"
                    @click="handleKeycloakLogin">
                    <SafetyCertificateOutlined style="font-size: 18px;" class="flex-shrink-0" />
                    <span>Keycloak登录</span>
                  </Button>
                </div>
              </div>
            </div>

            <!-- 底部安全说明 -->
            <div class="form-footer mt-6 pt-3 border-t text-center enter-x">
              <div class="text-xs text-gray-500 flex items-center justify-center gap-1 mb-1">
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="#10B981" stroke-width="2" fill="none">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>已接入等保三级安全会话审计</span>
              </div>
              <div class="text-[11px] text-gray-400">
                © {{ currentYear }} BigDevOps Platform. All Rights Reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Button, Input, Checkbox } from 'ant-design-vue';
import { DingtalkCircleFilled, SafetyCertificateOutlined } from '@ant-design/icons-vue';
import { AppDarkModeToggle, AppLocalePicker, AppLogo } from '@/components/Application';
import { useDesign } from '@/hooks/web/useDesign';
import { useI18n } from '@/hooks/web/useI18n';
import { useLocaleStore } from '@/store/modules/locale';
import { useUserStore } from '@/store/modules/user';
import { useMessage } from '@/hooks/web/useMessage';
import { defHttp } from '@/utils/http/axios';
import { PageEnum } from '@/enums/pageEnum';
import { getPlatformTelemetry } from '@/api/sys/user';

defineProps({
  sessionTimeout: {
    type: Boolean,
  },
});

const InputPassword = Input.Password;

const router = useRouter();
const userStore = useUserStore();
const { prefixCls } = useDesign('login-devops');
const { t } = useI18n();
const localeStore = useLocaleStore();
const showLocale = computed(() => localeStore.getShowPicker);
const { notification, createMessage, createConfirm } = useMessage();

const authMode = ref<'account' | 'sso'>('account');
const rememberMe = ref<boolean>(true);
const loading = ref<boolean>(false);

const formData = reactive({
  account: '',
  password: '',
});

// 平台真实大盘遥测指标（初始设为展示默认基线，加载成功后平滑更新为真数据）
const telemetryData = reactive({
  clusters: '18',
  pods: '4,280+',
  pipelineRuns: '1,350+',
  alertRate: '94.8%',
});

async function loadTelemetry() {
  try {
    const res = await getPlatformTelemetry();
    if (res) {
      if (typeof res.clusters === 'number') {
        telemetryData.clusters = `${res.clusters}`;
      }
      if (typeof res.pods === 'number') {
        telemetryData.pods = res.pods > 0 ? `${res.pods.toLocaleString()}+` : '0';
      }
      if (typeof res.pipelineRuns === 'number') {
        telemetryData.pipelineRuns = res.pipelineRuns > 0 ? `${res.pipelineRuns.toLocaleString()}+` : '0';
      }
      if (typeof res.alertRate === 'number') {
        telemetryData.alertRate = `${res.alertRate.toFixed(1)}%`;
      }
    }
  } catch {
    // 非阻塞兜底，保持登录页高可用
  }
}

onMounted(() => {
  loadTelemetry();
});

const currentYear = new Date().getFullYear();

// 忘记密码提示
function handleForgotTip() {
  createConfirm({
    iconType: 'info',
    title: '密码找回与凭证重置',
    content: '为保障生产环境运维安全，账号密码重置需由企业安全团队或系统管理员在后端堡垒机执行，请联系运维团队。',
  });
}

// 登录提交
async function handleLogin() {
  if (!formData.account.trim()) {
    createMessage.warning('请输入运维工号或登录账号');
    return;
  }
  if (!formData.password) {
    createMessage.warning('请输入访问密码凭证');
    return;
  }

  try {
    loading.value = true;
    const userInfo = await userStore.login({
      username: formData.account.trim(),
      password: formData.password,
      mode: 'none',
    });

    if (userInfo) {
      notification.success({
        message: 'BigDevOps 登录成功',
        description: `欢迎回来，${userInfo.realName || userInfo.username}！`,
        duration: 3,
      });
      router.push(PageEnum.BASE_HOME);
    }
  } catch (error: any) {
    createMessage.error(error?.message || '登录验证失败，请检查账号密码或后端服务状态');
  } finally {
    loading.value = false;
  }
}

// 钉钉 SSO 跳转
async function handleDingTalkLogin() {
  try {
    const res = await defHttp.get<{ url: string }>({ url: '/auth/dingtalk/login' });
    if (res && res.url) {
      window.location.href = res.url;
    } else {
      createMessage.warning('未获取到钉钉登录跳转地址，请确认后端钉钉配置');
    }
  } catch (err: any) {
    createMessage.error(err?.message || '请求钉钉单点登录网关失败');
  }
}

// Keycloak SSO 跳转
async function handleKeycloakLogin() {
  try {
    const res = await defHttp.get<{ url: string }>({ url: '/auth/oidc/login' });
    if (res && res.url) {
      window.location.href = res.url;
    } else {
      createMessage.warning('未获取到 SSO 重定向地址，请确认 Keycloak 服务配置');
    }
  } catch (err: any) {
    createMessage.error('请求 Keycloak 统一登录网关失败');
  }
}
</script>

<style lang="less">
@prefix-cls: ~'@{namespace}-login-devops';
@logo-prefix-cls: ~'@{namespace}-app-logo';
@dark-bg: #293146;

html[data-theme='dark'] {
  .@{prefix-cls} {
    background-color: @dark-bg;

    &::before {
      background-image: url('@/assets/svg/login-bg-dark.svg');
    }

    // 输入框外层容器 (消除外框内框断层与黑斑)
    .ant-input-affix-wrapper {
      background-color: #232a3b !important;
      border-color: #3b455b !important;
      color: #fff !important;

      // 核心：强制内层真实 input 背景完全透明，由外层统领，min-width: 0 避免挤出右侧眼睛图标
      >input.ant-input {
        background-color: transparent !important;
        color: #fff !important;
        border: none !important;
        box-shadow: none !important;
        min-width: 0 !important;
        flex: 1 1 auto;
      }

      .ant-input-prefix,
      .ant-input-suffix {
        color: #94a3b8 !important;
        display: inline-flex;
        align-items: center;
      }

      &:hover,
      &-focused {
        border-color: #2563eb !important;
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
      }
    }

    // 普通无 affix 的 input
    input.ant-input {
      background-color: #232a3b !important;
      border-color: #3b455b !important;
      color: #fff !important;
    }

    // 核心修复：修复 Chrome/Edge 浏览器自动填充（Autofill）导致的文字变纯黑 bug
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-text-fill-color: #fff !important;
      -webkit-box-shadow: 0 0 0 1000px #232a3b inset !important;
      box-shadow: 0 0 0 1000px #232a3b inset !important;
      transition: background-color 5000s ease-in-out 0s !important;
    }

    .ant-btn:not(.ant-btn-link, .ant-btn-primary) {
      border: 1px solid #4a5569;
      color: #e2e8f0;
    }

    // 卡片背景：通透精致毛玻璃
    &-form {
      background: rgba(30, 41, 59, 0.75) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5) !important;
      backdrop-filter: blur(16px);
    }

    .form-title {
      color: #fff;
    }

    .form-subtitle {
      color: #94a3b8;
    }

    // 核心修复：暗黑模式 Tab 按钮样式
    .auth-tabs {
      background: #192032;
      border-color: #2d3748;

      .tab-btn {
        background: transparent !important;
        border: none !important;
        color: #94a3b8;

        &.active {
          background: #2563eb !important;
          color: #fff !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        &:hover:not(.active) {
          color: #f1f5f9;
        }
      }
    }

    // 记住我与忘记密码样式
    .remember-me-checkbox {
      color: #94a3b8 !important;

      .ant-checkbox-inner {
        background-color: #232a3b !important;
        border-color: #3b455b !important;
      }

      &.ant-checkbox-wrapper-checked .ant-checkbox-inner {
        background-color: #2563eb !important;
        border-color: #2563eb !important;
      }
    }

    .forgot-link-btn {
      color: #38bdf8 !important;

      &:hover {
        color: #7dd3fc !important;
      }
    }

    .sso-desc-card {
      background: #192032;
      border-color: #2d3748;
    }

    .form-footer {
      border-top-color: #2d3748;
    }

    .feature-card {
      background: rgba(30, 41, 59, 0.55);
      border: 1px solid rgba(255, 255, 255, 0.08);

      &:hover {
        border-color: rgba(56, 189, 248, 0.4);
        background: rgba(30, 41, 59, 0.8);
      }

      .feature-text {
        .title {
          color: #f1f5f9;
        }

        .desc {
          color: #94a3b8;
        }
      }
    }

    .telemetry-box {
      background: rgba(30, 41, 59, 0.55);
      border-color: rgba(255, 255, 255, 0.08);

      .label {
        color: #94a3b8;
      }
    }
  }
}

/* 基础样式 (原版标准机制) */
.@{prefix-cls} {
  min-height: 100%;
  overflow: hidden;

  /* stylelint-disable-next-line media-query-no-invalid */
  @media (max-width: @screen-xl) {
    background-color: #293146;

    .@{prefix-cls}-form {
      background-color: #fff;
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin-left: -48%;
    background-image: url('@/assets/svg/login-bg.svg');
    background-repeat: no-repeat;
    background-position: 100%;
    background-size: auto 100%;

    /* stylelint-disable-next-line media-query-no-invalid */
    @media (max-width: @screen-xl) {
      display: none;
    }
  }

  /* 原版 AppLogo 规范 */
  .@{logo-prefix-cls} {
    position: absolute;
    top: 12px;
    height: 30px;

    &__title {
      color: #fff;
      font-size: 16px;
    }

    img {
      width: 32px;
    }
  }

  .container {
    .@{logo-prefix-cls} {
      display: flex;
      width: 60%;
      height: 80px;

      &__title {
        color: #fff;
        font-size: 24px;
      }

      img {
        width: 48px;
      }
    }
  }

  /* 输入框容器标准宽度与眼睛图标约束 (避免眼睛图标被内层 input 挤出框外) */
  .ant-input-affix-wrapper {
    width: 100% !important;

    >input.ant-input {
      min-width: 0 !important;
      width: auto !important;
      flex: 1 1 auto;
    }

    .ant-input-suffix {
      display: inline-flex;
      align-items: center;
      margin-left: 6px;
      flex-shrink: 0;
    }
  }

  /* 普通无 affix 的独立输入框宽度 */
  :not(.ant-input-affix-wrapper)>input:not([type='checkbox']) {
    width: 100%;
  }

  /* 亮色模式表单背景与固定尺寸 */
  &-form {
    width: 410px;
    max-width: 100%;
    background-color: #fff;
    border: 1px solid #f0f0f0;
  }

  .tab-content-wrapper {
    min-height: 205px;
  }

  .form-title {
    color: #1f2937;
  }

  .form-subtitle {
    color: #6b7280;
  }

  .auth-tabs {
    background: #f3f4f6;
    border-color: #e5e7eb;

    .tab-btn {
      background: transparent;
      border: none;
      outline: none;
      cursor: pointer;
      color: #6b7280;

      &.active {
        background: #fff;
        color: @primary-color;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
    }
  }

  .sso-desc-card {
    background: #f9fafb;
    border-color: #e5e7eb;
  }

  .form-footer {
    border-top-color: #f0f0f0;
  }

  /* 渐变标题 */
  .text-gradient {
    background: linear-gradient(135deg, #38bdf8 0%, #60a5fa 50%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* 特性卡片 */
  .feature-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .feature-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.cyan {
        background: rgba(6, 182, 212, 0.2);
        color: #38bdf8;
      }

      &.blue {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
      }

      &.purple {
        background: rgba(168, 85, 247, 0.2);
        color: #c084fc;
      }

      &.emerald {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
      }
    }

    .feature-text {
      .title {
        font-size: 0.84rem;
        font-weight: 600;
        color: #ffffff;
      }

      .desc {
        font-size: 0.72rem;
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  /* 遥测大盘 */
  .telemetry-box {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);

    .telemetry-col {
      .label {
        font-size: 0.68rem;
        color: rgba(255, 255, 255, 0.75);
      }

      .val {
        font-size: 0.96rem;
        font-weight: 700;
      }
    }
  }
}
</style>
