# BigDevOps 大运维平台前端

企业级一站式 DevOps 运维管理平台前端系统，基于 **Vue 3** + **TypeScript** + **Vite** + **Ant Design Vue (Vben Admin 2.11.5)** 架构开发。

---

## 📋 核心功能模块

- **CI/CD 持续交付 (`src/views/cicd/`)**：Jenkins 实例纳管、服务基线、动态参数构建部署、实时流水线日志与阶段追踪。
- **K8s 容器管理 (`src/views/k8s/`)**：Kubernetes 多集群接入、项目与应用发布、YAML 编排任务及 Pod 状态实时感知。
- **服务树 CMDB (`src/views/stree/`)**：三层架构服务树、ECS 云主机、RDS 数据库、ELB 负载均衡及 DNS 域名资产联动关联。
- **作业执行平台 (`src/views/jobExec/`)**：自动化脚本库、批量主机命令分发、Web Terminal 实时交互与作业执行结果审计。
- **监控告警与值班 (`src/views/monitor/`)**：Prometheus 规则配置、Alertmanager 告警池分发、自动化排班日历与值班交接记录。
- **工单审批流 (`src/views/workorder/`)**：可视化自定义表单设计、多节点审批流转与进度追踪。
- **研发效能大盘 (`src/views/dora/`)**：DORA 核心度量指标展示与团队研发部署效能分析。
- **系统与权限管理 (`src/views/system/`)**：RBAC 角色权限、Casbin 接口级鉴权、在线会话管理及操作审计日志。

---

## 🛠️ 技术栈

| 技术 | 说明 |
| :--- | :--- |
| **Vue 3** | Composition API、SFC 单文件组件 |
| **TypeScript** | 强类型开发支撑 |
| **Vite** | 现代化前端极速构建与开发服务器 |
| **Ant Design Vue** | 企业级 UI 组件库 |
| **Vben Admin** | 现代化后台前端基座 (v2.11.5) |
| **Pinia** | 状态管理库 |
| **CodeMirror** | 在线代码编辑器 (支持 YAML、Python、PromQL 语法高亮) |
| **Xterm.js** | 浏览器端高性能 Web 终端模拟器 |
| **ECharts** | 运维大盘与监控图表可视化 |

---

## 🚀 快速启动

### 1. 环境准备
- **Node.js**：`>= 18.0.0` (推荐 18.x / 20.x)
- **包管理器**：`pnpm >= 8.0.0` (强制要求，推荐使用 pnpm)

```bash
# 全局安装 pnpm (若未安装)
npm install -g pnpm
```

### 2. 安装依赖
```bash
# 安装项目核心依赖
pnpm install
```

### 3. 开发启动
```bash
# 启动本地开发服务 (默认端口 3100)
pnpm run dev
```

### 4. 生产打包
```bash
# 构建生产环境静态资源 (输出至 dist 目录)
pnpm run build

# 预览生产构建包
pnpm run preview
```

---

## 📦 扩展组件依赖安装参考

本项目包含 Web 终端 (Xterm) 和多语法在线代码编辑器 (CodeMirror)，如需重装或维护特殊扩展依赖，可参考以下命令：

### CodeMirror 在线代码编辑器依赖
```bash
# 核心与常用语言扩展 (YAML, Python, 暗色主题)
pnpm add codemirror vue-codemirror @codemirror/lang-python @codemirror/lang-yaml @codemirror/language @codemirror/legacy-modes @codemirror/theme-one-dark --ignore-workspace-root-check

# 状态与视图基础库
pnpm add @codemirror/state @codemirror/view @codemirror/commands -w

# PromQL 监控语法扩展
pnpm install --save codemirror-promql --ignore-workspace-root-check
pnpm install --save codemirror/basic-setup --ignore-workspace-root-check
```

### Xterm 终端模拟器依赖
```bash
pnpm add -w xterm xterm-addon-fit
```

---

## 📁 目录结构概览

```text
src/
├── api/            # 后端 API 接口定义层 (cicd, system, stree, monitor 等)
├── assets/         # 静态资源与图片
├── components/     # 全局通用业务组件
├── hooks/          # Vue Composition API 封装 Hooks
├── layouts/        # 页面布局架构 (侧边栏、顶部导航、Tabs 标签页)
├── router/         # 路由配置与动态路由守卫
├── store/          # Pinia 全局状态管理
├── utils/          # 通用工具函数库与 HTTP 封装 (defHttp)
└── views/          # 核心业务视图
    ├── cicd/       # 持续交付 (服务基线、构建历史、日志抽屉)
    ├── k8s/        # 容器云与 Kubernetes 管理
    ├── stree/      # CMDB 服务树与资产绑定
    ├── jobExec/    # 运维作业平台与批量脚本
    ├── monitor/    # Prometheus 监控与值班排班
    ├── workorder/  # 工单引擎与表单设计
    ├── dora/       # 研发效能 DORA 分析
    └── system/     # 账号管理、角色权限与审计日志
```

---

## ⚙️ 常见配置说明

- `.env`：全局通用基础环境变量（标题 `VITE_GLOB_APP_TITLE`、服务端口 `VITE_PORT` 等）。
- `.env.development`：开发环境配置，接口代理通常代理到后端 Go 服务（默认 `http://127.0.0.1:8080` 或本地后端服务地址）。
- `vite.config.ts`：Vite 配置文件（含反向代理 Proxy、打包优化与插件配置）。
