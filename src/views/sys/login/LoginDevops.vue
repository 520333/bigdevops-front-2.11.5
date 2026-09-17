<template>
  <div class="devops-login-container">
    <!-- 动态背景装饰元素 -->
    <div class="tech-glow-circle circle-1"></div>
    <div class="tech-glow-circle circle-2"></div>
    <div class="tech-glow-circle circle-3"></div>
    <div class="cyber-grid"></div>

    <!-- 顶部状态栏 -->
    <header class="devops-header">
      <div class="header-brand">
        <div class="brand-logo-wrap">
          <svg class="brand-logo-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
            <path d="M16 6L24.6603 11V21L16 26L7.33975 21V11L16 6Z" stroke="#38BDF8" stroke-width="1.8"
              stroke-linejoin="round" />
            <circle cx="16" cy="16" r="3.5" fill="#38BDF8" />
            <path d="M16 9.5V12.5M16 19.5V22.5M10.5 13L13 14.5M19 17.5L21.5 19M21.5 13L19 14.5M13 17.5L10.5 19"
              stroke="#E0F2FE" stroke-width="1.2" stroke-linecap="round" />
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stop-color="#0284C7" />
                <stop offset="1" stop-color="#0F172A" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">BigDevOps</span>
          <span class="brand-tag">Cloud-Native v2.11</span>
        </div>
      </div>

      <div class="header-status">
        <div class="status-indicator">
          <span class="pulse-dot"></span>
          <span class="status-text">集群控制面健康度: 99.99%</span>
        </div>
        <div class="system-time">{{ currentTime }}</div>
        <a href="/#/login" class="switch-version-link">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>返回原版登录</span>
        </a>
      </div>
    </header>

    <!-- 主体区域 -->
    <main class="devops-main">
      <!-- 左侧：DevOps 平台能力矩阵与运行态势 -->
      <section class="left-hero-section">
        <div class="hero-badge">
          <span class="badge-icon">⚡</span>
          <span>Enterprise Cloud-Native DevOps & AIOps Orchestration</span>
        </div>

        <h1 class="hero-title">
          下一代企业级<br />
          <span class="text-gradient">智能云原生运维平台</span>
        </h1>

        <p class="hero-desc">
          集多集群纳管、GitOps 自动化交付流水线、全链路可观测性与 AIOps 智能异常根因诊断于一体，驱动数字化业务高可用稳健运行。
        </p>

        <!-- 平台核心能力卡片组 -->
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon-box cyan">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div class="feature-info">
              <h3>Kubernetes 多集群编排</h3>
              <p>跨云与混合云生产集群统一调度，动态 HPA 与容器微服务治理</p>
            </div>
          </div>

          <div class="feature-card">
            <div class="feature-icon-box blue">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div class="feature-info">
              <h3>CI/CD 敏捷交付流水线</h3>
              <p>代码合规检测、自动镜像构建与一键蓝绿/金丝雀平滑发布</p>
            </div>
          </div>

          <div class="feature-card">
            <div class="feature-icon-box purple">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div class="feature-info">
              <h3>AIOps 智能根因可观测</h3>
              <p>Prometheus 实时指标大盘、AI 时序降噪收敛与自动化自愈排障</p>
            </div>
          </div>

          <div class="feature-card">
            <div class="feature-icon-box emerald">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div class="feature-info">
              <h3>资产 CMDB & 终端日志审计</h3>
              <p>多云主机动态拓扑纳管，特权会话录屏回放与安全合规溯源</p>
            </div>
          </div>
        </div>

        <!-- 实时平台监控指标条 -->
        <div class="telemetry-bar">
          <div class="telemetry-item">
            <span class="telemetry-label">已纳管集群</span>
            <span class="telemetry-value text-cyan">18 <small>Clusters</small></span>
          </div>
          <div class="telemetry-divider"></div>
          <div class="telemetry-item">
            <span class="telemetry-label">运行容器组</span>
            <span class="telemetry-value text-blue">4,280+ <small>Pods</small></span>
          </div>
          <div class="telemetry-divider"></div>
          <div class="telemetry-item">
            <span class="telemetry-label">今日流水线构建</span>
            <span class="telemetry-value text-purple">1,350+ <small>Runs</small></span>
          </div>
          <div class="telemetry-divider"></div>
          <div class="telemetry-item">
            <span class="telemetry-label">告警收敛率</span>
            <span class="telemetry-value text-emerald">94.8%</span>
          </div>
        </div>
      </section>

      <!-- 右侧：高质感玻璃拟态登录表单 -->
      <section class="right-login-section">
        <div class="login-glass-card">
          <!-- 登录卡片头部 -->
          <div class="card-header">
            <div class="welcome-tag">SECURITY AUTHENTICATION</div>
            <h2 class="card-title">登录控制台</h2>
            <p class="card-subtitle">请输入您的工程师凭据以接入 BigDevOps 生产环境</p>
          </div>

          <!-- 模式切换 Tab -->
          <div class="auth-tabs">
            <button class="tab-item" :class="{ active: authMode === 'account' }" @click="authMode = 'account'">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>账号认证</span>
            </button>
            <button class="tab-item" :class="{ active: authMode === 'sso' }" @click="authMode = 'sso'">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Keycloak SSO</span>
            </button>
          </div>

          <!-- 账号密码登录模式 -->
          <div v-if="authMode === 'account'" class="auth-form-body">
            <!-- 账号输入 -->
            <div class="input-field-group">
              <label class="field-label">运维工号 / 登录名</label>
              <div class="custom-input-box" :class="{ focused: activeInput === 'account' }">
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input type="text" v-model="formData.account" placeholder="请输入账号 (如: admin)" autocomplete="username"
                  @focus="activeInput = 'account'" @blur="activeInput = ''" @keyup.enter="handleLogin" />
              </div>
            </div>

            <!-- 密码输入 -->
            <div class="input-field-group mt-4">
              <div class="label-row">
                <label class="field-label">访问凭证 / 密码</label>
                <a class="forgot-link" @click="handleForgotTip">忘记密码?</a>
              </div>
              <div class="custom-input-box" :class="{ focused: activeInput === 'password' }">
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input :type="showPassword ? 'text' : 'password'" v-model="formData.password" placeholder="请输入访问凭证密码"
                  autocomplete="current-password" @focus="activeInput = 'password'" @blur="activeInput = ''"
                  @keyup.enter="handleLogin" />
                <button type="button" class="eye-btn" @click="showPassword = !showPassword">
                  <svg v-if="!showPassword" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor"
                    stroke-width="2" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2"
                    fill="none">
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- 快捷预填提示 -->
            <div class="quick-fill-row">
              <label class="checkbox-container">
                <input type="checkbox" v-model="rememberMe" />
                <span class="custom-checkbox"></span>
                <span class="checkbox-text">记住会话状态</span>
              </label>

              <!-- <button type="button" class="quick-admin-btn" @click="fillAdmin">
                ⚡ 预填默认账号
              </button> -->
            </div>

            <!-- 登录按钮 -->
            <button class="primary-glow-btn" :disabled="loading" @click="handleLogin">
              <span v-if="!loading" class="btn-content">
                <span>进入控制台</span>
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
              <span v-else class="btn-content">
                <span class="spinner"></span>
                <span>正在校验凭据并接入集群...</span>
              </span>
            </button>
          </div>

          <!-- Keycloak SSO 登录模式 -->
          <div v-else class="sso-mode-body">
            <div class="sso-notice-box">
              <div class="sso-logo-row">
                <span class="sso-badge">OIDC 2.0 / SAML 2.0</span>
              </div>
              <h4>Keycloak 企业统一认证中心</h4>
              <p>支持企业微信、钉钉、飞书组织架构与 LDAP 域账号统一身份互联互通，点击下方按钮将自动跳转至认证网关。</p>
            </div>

            <button class="sso-login-btn" @click="handleKeycloakLogin">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>通过 Keycloak 统一单点登录</span>
            </button>
          </div>

          <!-- 卡片底部安全合规提示 -->
          <div class="card-footer">
            <div class="security-badge">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="#10B981" stroke-width="2" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>本系统已受 SOC2 / 等保三级会话审计安全保护</span>
            </div>
            <p class="copyright-text">
              © {{ currentYear }} BigDevOps 智能云原生运维交付平台. All Rights Reserved.
            </p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { useMessage } from '@/hooks/web/useMessage';
import { defHttp } from '@/utils/http/axios';
import { PageEnum } from '@/enums/pageEnum';

const router = useRouter();
const userStore = useUserStore();
const { notification, createMessage, createConfirm } = useMessage();

const authMode = ref<'account' | 'sso'>('account');
const activeInput = ref<string>('');
const showPassword = ref<boolean>(false);
const rememberMe = ref<boolean>(true);
const loading = ref<boolean>(false);

const formData = reactive({
  account: '',
  password: '',
});

const currentYear = new Date().getFullYear();
const currentTime = ref('');

let timeTimer: any = null;

function updateCurrentTime() {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  const Y = now.getFullYear();
  const M = pad(now.getMonth() + 1);
  const D = pad(now.getDate());
  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  currentTime.value = `${Y}-${M}-${D} ${h}:${m}:${s} UTC+8`;
}

onMounted(() => {
  updateCurrentTime();
  timeTimer = setInterval(updateCurrentTime, 1000);
});

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer);
});

// 快捷预填
function fillAdmin() {
  formData.account = 'admin';
  formData.password = 'tingbao89';
  createMessage.success('已自动填充预设管理员凭据');
}

// 忘记密码
function handleForgotTip() {
  createConfirm({
    iconType: 'info',
    title: '密码找回与凭证重置',
    content: '为保障生产环境运维安全，管理员账号密码重置需由企业安全团队或根管理员在后端堡垒机/配置中心执行，请联系平台管理员。',
  });
}

// 账号密码登录
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
        description: `欢迎回来，${userInfo.realName || userInfo.username}！正在载入云原生中枢...`,
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

// SSO 登录
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

<style scoped>
/* 全局页面容器 */
.devops-login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: #060a14;
  background-image:
    radial-gradient(circle at 15% 20%, rgba(14, 165, 233, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 85% 75%, rgba(59, 130, 246, 0.18) 0%, transparent 45%),
    radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 60%);
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: flex;
  flex-direction: column;
}

/* 科技背景光晕 */
.tech-glow-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
}

.circle-1 {
  width: 480px;
  height: 480px;
  background: rgba(6, 182, 212, 0.18);
  top: -80px;
  left: -100px;
}

.circle-2 {
  width: 520px;
  height: 520px;
  background: rgba(37, 99, 235, 0.2);
  bottom: -100px;
  right: -50px;
}

.circle-3 {
  width: 360px;
  height: 360px;
  background: rgba(139, 92, 246, 0.12);
  top: 40%;
  left: 45%;
}

/* 科技网格纹理 */
.cyber-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 1;
}

/* 顶部状态 Header */
.devops-header {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.4));
}

.brand-logo-svg {
  width: 36px;
  height: 36px;
}

.brand-text {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.brand-name {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #ffffff 30%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-tag {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 9999px;
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.28);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 4px 12px;
  border-radius: 9999px;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: pulseAnimation 2s infinite;
}

@keyframes pulseAnimation {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }

  70% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.status-text {
  font-size: 0.75rem;
  color: #6ee7b7;
  font-weight: 500;
}

.system-time {
  font-size: 0.75rem;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.switch-version-link {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 4px 10px;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.switch-version-link:hover {
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.35);
  background: rgba(56, 189, 248, 0.1);
}

/* 主体容器 */
.devops-main {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 5rem;
  max-width: 1560px;
  width: 100%;
  margin: 0 auto;
  gap: 4rem;
}

/* 左侧介绍 */
.left-hero-section {
  flex: 1.15;
  display: flex;
  flex-direction: column;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 1.5rem;
  width: fit-content;
  backdrop-filter: blur(8px);
}

.badge-icon {
  color: #38bdf8;
}

.hero-title {
  font-size: 2.75rem;
  line-height: 1.25;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
  color: #ffffff;
}

.text-gradient {
  background: linear-gradient(135deg, #38bdf8 0%, #60a5fa 50%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-desc {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #94a3b8;
  margin-bottom: 2rem;
  max-width: 620px;
}

/* 特性卡片 */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 2rem;
}

.feature-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.feature-card:hover {
  background: rgba(15, 23, 42, 0.7);
  border-color: rgba(56, 189, 248, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 15px -2px rgba(56, 189, 248, 0.15);
}

.feature-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-icon-box.cyan {
  background: rgba(6, 182, 212, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(6, 182, 212, 0.3);
}

.feature-icon-box.blue {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.feature-icon-box.purple {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.feature-icon-box.emerald {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.feature-info h3 {
  font-size: 0.92rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 4px 0;
}

.feature-info p {
  font-size: 0.76rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.45;
}

/* 遥测数据栏 */
.telemetry-bar {
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 20px;
  backdrop-filter: blur(10px);
}

.telemetry-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.telemetry-label {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 500;
}

.telemetry-value {
  font-size: 1.15rem;
  font-weight: 700;
}

.telemetry-value small {
  font-size: 0.7rem;
  font-weight: normal;
  opacity: 0.8;
}

.text-cyan {
  color: #38bdf8;
}

.text-blue {
  color: #60a5fa;
}

.text-purple {
  color: #c084fc;
}

.text-emerald {
  color: #34d399;
}

.telemetry-divider {
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0 16px;
}

/* 右侧登录卡片 */
.right-login-section {
  flex: 0.85;
  display: flex;
  justify-content: center;
  min-width: 420px;
  max-width: 480px;
}

.login-glass-card {
  width: 100%;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 20px;
  padding: 2.2rem 2.2rem;
  backdrop-filter: blur(28px);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.6),
    0 0 35px -5px rgba(14, 165, 233, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.card-header {
  margin-bottom: 1.6rem;
}

.welcome-tag {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #38bdf8;
  margin-bottom: 6px;
}

.card-title {
  font-size: 1.65rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 6px 0;
}

.card-subtitle {
  font-size: 0.84rem;
  color: #94a3b8;
  margin: 0;
}

/* Tab 模式选择 */
.auth-tabs {
  display: flex;
  background: rgba(30, 41, 59, 0.6);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 1.8rem;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #94a3b8;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-item:hover {
  color: #f1f5f9;
}

.tab-item.active {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.28);
  font-weight: 600;
}

/* 表单主体 */
.input-field-group {
  display: flex;
  flex-direction: column;
}

.field-label {
  font-size: 0.8rem;
  color: #cbd5e1;
  font-weight: 500;
  margin-bottom: 6px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-link {
  font-size: 0.75rem;
  color: #38bdf8;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #7dd3fc;
  text-decoration: underline;
}

.custom-input-box {
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0 14px;
  height: 46px;
  transition: all 0.25s ease;
}

.custom-input-box.focused {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
  background: rgba(15, 23, 42, 0.95);
}

.input-icon {
  color: #64748b;
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.custom-input-box.focused .input-icon {
  color: #38bdf8;
}

.custom-input-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #f8fafc;
  font-size: 0.92rem;
}

.custom-input-box input::placeholder {
  color: #475569;
}

.eye-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.eye-btn:hover {
  color: #cbd5e1;
}

/* 快捷行 */
.quick-fill-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
  margin-bottom: 22px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.custom-checkbox {
  height: 16px;
  width: 16px;
  background-color: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  margin-right: 8px;
  transition: all 0.2s;
}

.checkbox-container input:checked~.custom-checkbox {
  background-color: #0284c7;
  border-color: #38bdf8;
}

.checkbox-text {
  font-size: 0.78rem;
  color: #94a3b8;
}

.quick-admin-btn {
  background: rgba(56, 189, 248, 0.08);
  border: 1px dashed rgba(56, 189, 248, 0.35);
  color: #38bdf8;
  font-size: 0.74rem;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-admin-btn:hover {
  background: rgba(56, 189, 248, 0.18);
  border-style: solid;
}

/* 渐变流光登录按钮 */
.primary-glow-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 20px -2px rgba(37, 99, 235, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.primary-glow-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -2px rgba(37, 99, 235, 0.7), 0 0 15px rgba(56, 189, 248, 0.4);
}

.primary-glow-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* SSO 模式面板 */
.sso-mode-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sso-notice-box {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
}

.sso-logo-row {
  margin-bottom: 8px;
}

.sso-badge {
  font-size: 0.68rem;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: #c084fc;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.sso-notice-box h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 6px 0;
}

.sso-notice-box p {
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}

.sso-login-btn {
  height: 48px;
  border-radius: 10px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(14, 165, 233, 0.15);
  color: #38bdf8;
  font-size: 0.92rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.sso-login-btn:hover {
  background: rgba(14, 165, 233, 0.25);
  border-color: #38bdf8;
  color: #ffffff;
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.25);
}

/* 底部安全说明 */
.card-footer {
  margin-top: 2rem;
  padding-top: 1.2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.security-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  color: #94a3b8;
}

.copyright-text {
  font-size: 0.66rem;
  color: #64748b;
  margin: 0;
  text-align: center;
}

/* 响应式媒体查询 */
@media (max-width: 1200px) {
  .devops-main {
    flex-direction: column;
    padding: 2rem 1.5rem;
    gap: 3rem;
  }

  .left-hero-section {
    text-align: center;
    align-items: center;
  }

  .hero-desc {
    margin-left: auto;
    margin-right: auto;
  }

  .feature-grid {
    grid-template-columns: 1fr;
    max-width: 520px;
    width: 100%;
  }

  .telemetry-bar {
    width: 100%;
    max-width: 520px;
  }
}

@media (max-width: 640px) {
  .devops-header {
    padding: 1rem 1.2rem;
  }

  .system-time {
    display: none;
  }

  .right-login-section {
    min-width: 100%;
  }

  .login-glass-card {
    padding: 1.5rem 1.2rem;
  }

  .hero-title {
    font-size: 2rem;
  }
}
</style>
