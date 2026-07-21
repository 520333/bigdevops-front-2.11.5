// ==================== Mock 数据 ====================


// 工单列表 Mock
export const mockWorkorderList = [
  {
    id: 1, orderNo: 'WO-2025031001', title: '【预生产惩戒黑名单查询改造】',
    env: '预生产环境', envKey: 'pre', type: '版本发布', status: 'releasing', statusText: '持续发布',
    creator: '任岩', createdAt: '2025-03-10 09:37:55', planAt: '2025-03-10 18:00:00',
    updatedAt: '2025-03-10 14:20:00',
  },
  {
    id: 2, orderNo: 'WO-2025030901', title: '【用户中心配置变更】',
    env: '生产环境', envKey: 'prod', type: '配置变更', status: 'pending', statusText: '待审批',
    creator: '张三', createdAt: '2025-03-09 10:00:00', planAt: '2025-03-09 20:00:00',
    updatedAt: '2025-03-09 10:00:00',
  },
  {
    id: 3, orderNo: 'WO-2025030801', title: '【结算服务升级至v2.3.1】',
    env: '生产环境', envKey: 'prod', type: '版本发布', status: 'success', statusText: '已完成',
    creator: '李四', createdAt: '2025-03-08 09:00:00', planAt: '2025-03-08 18:00:00',
    updatedAt: '2025-03-08 20:15:00',
  },
  {
    id: 4, orderNo: 'WO-2025030701', title: '【风控规则引擎SQL变更】',
    env: '测试环境', envKey: 'test', type: 'SQL变更', status: 'rollback', statusText: '已回滚',
    creator: '王五', createdAt: '2025-03-07 11:00:00', planAt: '2025-03-07 15:00:00',
    updatedAt: '2025-03-07 16:30:00',
  },
  {
    id: 5, orderNo: 'WO-2025030601', title: '【消息队列主题新增】',
    env: '开发环境', envKey: 'dev', type: 'MQ变更', status: 'success', statusText: '已完成',
    creator: '赵六', createdAt: '2025-03-06 08:00:00', planAt: '2025-03-06 10:00:00',
    updatedAt: '2025-03-06 10:45:00',
  },
];

// 工单详情 Mock
export const mockWorkorderDetail = {
  id: 1, orderNo: 'WO-2025031001', title: '【预生产惩戒黑名单查询改造】',
  env: '预生产环境', envKey: 'pre', type: '版本发布', status: 'releasing', statusText: '持续发布',
  creator: '任岩', createdAt: '2025-03-10 09:37:55', planAt: '2025-03-10 18:00:00',
  // 1. 发布方案描述
  description: `## 发布目的\n本次发布主要解决用户中心黑名单查询性能问题，将原有 MySQL 全表扫描改为 Redis 缓存查询，预计响应时间从 200ms 降低到 5ms 以内。\n\n## 发布步骤\n1. 停止旧版本服务（user-mr-data）\n2. 发布新版本镜像（user-mr-data:2025030409）\n3. 验证健康检查接口 \`/actuator/health\`\n4. 放开流量，监控错误率\n\n## 注意事项\n- ⚠️ 发布前确保 Redis 集群连接正常\n- ⚠️ 需提前预热 Redis 黑名单数据（预热脚本：/scripts/warmup-blacklist.sh）\n- ⚠️ 发布窗口：18:00~20:00，避开业务高峰期\n- 🔁 回滚方案：切换镜像 tag 到 user-mr-data:2025022801 即可`,
  // 2. 应用清单
  apps: [
    {
      id: 1, seq: 1, appName: 'user-mr-data', appType: 'java后端',
      baselineTag: 'user-mr-data-2025030409...', latestTag: 'user-mr-data-2025030409...',
      iterApp: '【user-mr-data】release-...', execStatus: 'success', execStatusText: '成功',
      instances: [
        { id: 1, clusterType: '主机', envType: 'pre', profile: 'cu-pre', ip: '172.21.0.68', deployStatus: 'success', deployStatusText: '成功', progress: ['offline', 'deploying', 'online', 'health'], currentStep: 3 },
        { id: 2, clusterType: '主机', envType: 'pre', profile: 'cu-pre', ip: '172.21.1.97', deployStatus: 'success', deployStatusText: '成功', progress: ['offline', 'deploying', 'online', 'health'], currentStep: 3 },
      ],
    },
    {
      id: 2, seq: 2, appName: 'user-center-api', appType: 'java后端',
      baselineTag: 'user-center-api-20250304...', latestTag: 'user-center-api-20250304...',
      iterApp: '【user-center-api】release-...', execStatus: 'pending', execStatusText: '待执行',
      instances: [
        { id: 3, clusterType: '主机', envType: 'pre', profile: 'cu-pre', ip: '172.21.2.10', deployStatus: 'pending', deployStatusText: '待发布', progress: ['offline', 'deploying', 'online', 'health'], currentStep: 0 },
      ],
    },
  ],
  // 3. NACOS 配置变更
  nacosChanges: [
    {
      id: 1, namespace: 'pre-env', dataId: 'user-mr-data.yaml', group: 'DEFAULT_GROUP',
      changeType: 'update',
      before: 'redis:\n  host: 10.0.0.1\n  port: 6379\n  timeout: 3000',
      after: 'redis:\n  host: 10.0.0.1\n  port: 6379\n  timeout: 1000\n  pool:\n    max-active: 50',
    },
    {
      id: 2, namespace: 'pre-env', dataId: 'application-common.yaml', group: 'DEFAULT_GROUP',
      changeType: 'add',
      before: '',
      after: 'blacklist:\n  cache-ttl: 3600\n  batch-size: 500',
    },
  ],
  // 4. SQL 变更
  sqlChanges: [
    {
      id: 1, database: 'user_db', filename: 'V2025031001__add_blacklist_index.sql',
      status: 'pending', statusText: '待执行', execTime: '',
      content: 'ALTER TABLE t_blacklist ADD INDEX idx_user_id (user_id);\nALTER TABLE t_blacklist ADD INDEX idx_phone (phone);',
    },
    {
      id: 2, database: 'user_db', filename: 'V2025031002__update_query_config.sql',
      status: 'success', statusText: '已执行', execTime: '2025-03-10 10:30:00',
      content: "UPDATE t_sys_config SET config_value = '1' WHERE config_key = 'USE_REDIS_CACHE';",
    },
  ],
  // 5. ES 变更
  esChanges: [
    { id: 1, cluster: 'es-pre-cluster', index: 'user_blacklist_v2', changeType: '新增索引', status: 'success', statusText: '已完成', mappings: '{"properties":{"user_id":{"type":"keyword"},"phone":{"type":"keyword"},"status":{"type":"integer"}}}' },
    { id: 2, cluster: 'es-pre-cluster', index: 'user_profile_v3', changeType: 'mapping变更', status: 'pending', statusText: '待执行', mappings: '{"properties":{"extra_info":{"type":"object","dynamic":true}}}' },
  ],
  // 6. MQ 变更
  mqChanges: [
    { id: 1, cluster: 'rocketmq-pre', topic: 'USER_BLACKLIST_SYNC', changeType: '新增Topic', status: 'success', statusText: '已完成', config: 'readQueueNums=8, writeQueueNums=8, perm=6' },
    { id: 2, cluster: 'rocketmq-pre', topic: 'USER_EVENT_V2', changeType: '修改配置', status: 'pending', statusText: '待执行', config: 'readQueueNums=16, writeQueueNums=16, perm=6' },
  ],
};

// 服务基线 Mock
export const mockBaselineList = [
  { id: 1, appName: 'user-mr-data', appType: 'java后端', lang: 'Java', jenkinsJob: 'user-mr-data-build', latestBuildNo: 42, latestBuildStatus: 'SUCCESS', latestTag: 'user-mr-data-2025031042', lastBuildTime: '2025-03-10 14:20:00', gitRepo: 'git@gitlab.com:user-center/user-mr-data.git', branch: 'main' },
  { id: 2, appName: 'user-center-api', appType: 'java后端', lang: 'Java', jenkinsJob: 'user-center-api-build', latestBuildNo: 28, latestBuildStatus: 'FAILURE', latestTag: 'user-center-api-2025030928', lastBuildTime: '2025-03-09 16:45:00', gitRepo: 'git@gitlab.com:user-center/user-center-api.git', branch: 'main' },
  { id: 3, appName: 'risk-engine', appType: 'java后端', lang: 'Java', jenkinsJob: 'risk-engine-build', latestBuildNo: 15, latestBuildStatus: 'SUCCESS', latestTag: 'risk-engine-2025030815', lastBuildTime: '2025-03-08 11:00:00', gitRepo: 'git@gitlab.com:risk/risk-engine.git', branch: 'release' },
  { id: 4, appName: 'devops-frontend', appType: 'vue前端', lang: 'Vue/TS', jenkinsJob: 'devops-frontend-build', latestBuildNo: 67, latestBuildStatus: 'SUCCESS', latestTag: 'devops-frontend-2025031067', lastBuildTime: '2025-03-10 09:10:00', gitRepo: 'git@gitlab.com:devops/devops-frontend.git', branch: 'main' },
  { id: 5, appName: 'settle-service', appType: 'java后端', lang: 'Java', jenkinsJob: 'settle-service-build', latestBuildNo: 33, latestBuildStatus: 'ABORTED', latestTag: 'settle-service-2025030933', lastBuildTime: '2025-03-09 20:00:00', gitRepo: 'git@gitlab.com:settle/settle-service.git', branch: 'main' },
];

// 环境配置 Mock
export const mockEnvList = [
  {
    id: 1, name: '开发环境', key: 'dev', desc: '日常开发联调', color: '#52c41a',
    vars: [
      { id: 1, key: 'SPRING_PROFILES_ACTIVE', value: 'dev', desc: 'Spring环境标识' },
      { id: 2, key: 'NACOS_SERVER_ADDR', value: '10.0.1.10:8848', desc: 'Nacos注册中心地址' },
      { id: 3, key: 'REDIS_HOST', value: '10.0.1.20', desc: 'Redis主节点' },
      { id: 4, key: 'MYSQL_HOST', value: '10.0.1.30:3306', desc: 'MySQL主库' },
    ],
    nodes: [
      { id: 1, ip: '172.16.10.1', role: '应用节点', status: 'online' },
      { id: 2, ip: '172.16.10.2', role: '应用节点', status: 'online' },
    ],
  },
  {
    id: 2, name: '测试环境', key: 'test', desc: 'QA测试验证', color: '#1890ff',
    vars: [
      { id: 5, key: 'SPRING_PROFILES_ACTIVE', value: 'test', desc: 'Spring环境标识' },
      { id: 6, key: 'NACOS_SERVER_ADDR', value: '10.0.2.10:8848', desc: 'Nacos注册中心地址' },
      { id: 7, key: 'REDIS_HOST', value: '10.0.2.20', desc: 'Redis主节点' },
    ],
    nodes: [
      { id: 3, ip: '172.16.20.1', role: '应用节点', status: 'online' },
    ],
  },
  {
    id: 3, name: '预生产环境', key: 'pre', desc: '上线前验证', color: '#fa8c16',
    vars: [
      { id: 8, key: 'SPRING_PROFILES_ACTIVE', value: 'pre', desc: 'Spring环境标识' },
      { id: 9, key: 'NACOS_SERVER_ADDR', value: '10.0.3.10:8848', desc: 'Nacos注册中心地址' },
      { id: 10, key: 'REDIS_HOST', value: '10.0.3.20', desc: 'Redis主节点' },
    ],
    nodes: [
      { id: 4, ip: '172.21.0.68', role: '应用节点', status: 'online' },
      { id: 5, ip: '172.21.1.97', role: '应用节点', status: 'online' },
    ],
  },
  {
    id: 4, name: '生产环境', key: 'prod', desc: '线上正式环境', color: '#f5222d',
    vars: [
      { id: 11, key: 'SPRING_PROFILES_ACTIVE', value: 'prod', desc: 'Spring环境标识' },
      { id: 12, key: 'NACOS_SERVER_ADDR', value: '10.1.0.10:8848', desc: 'Nacos注册中心地址' },
      { id: 13, key: 'REDIS_HOST', value: '10.1.0.20', desc: 'Redis主节点（主）' },
    ],
    nodes: [
      { id: 6, ip: '10.1.10.1', role: '应用节点', status: 'online' },
      { id: 7, ip: '10.1.10.2', role: '应用节点', status: 'online' },
      { id: 8, ip: '10.1.10.3', role: '应用节点', status: 'offline' },
    ],
  },
];

// Mock Jenkins 构建日志
export const generateBuildLog = (appName: string, buildNo: number): string => {
  return `Started by user admin
Running in Durability level: MAX_SURVIVABILITY
[Pipeline] Start of Pipeline
[Pipeline] node
Running on Jenkins in /var/jenkins_home/workspace/${appName}
[Pipeline] {
[Pipeline] stage
[Pipeline] { (Checkout)
[Pipeline] git
Cloning repository git@gitlab.com:user-center/${appName}.git
[Pipeline] }
[Pipeline] // stage
[Pipeline] stage
[Pipeline] { (Build)
[Pipeline] sh
+ mvn clean package -DskipTests -Ppre
[INFO] Scanning for projects...
[INFO] BUILD SUCCESS
[INFO] Total time: 45.123 s
[Pipeline] }
[Pipeline] // stage
[Pipeline] stage
[Pipeline] { (Build Docker Image)
[Pipeline] sh
+ docker build -t registry.cn/devops/${appName}:${appName}-${buildNo} .
Step 1/8 : FROM openjdk:17-jdk-slim
Step 2/8 : WORKDIR /app
Step 3/8 : COPY target/*.jar app.jar
Step 4/8 : EXPOSE 8080
Step 5/8 : ENTRYPOINT ["java","-jar","app.jar"]
Successfully built a1b2c3d4e5f6
Successfully tagged registry.cn/devops/${appName}:${appName}-${buildNo}
[Pipeline] sh
+ docker push registry.cn/devops/${appName}:${appName}-${buildNo}
The push refers to repository [registry.cn/devops/${appName}]
Pushing layer... done
[Pipeline] }
[Pipeline] // stage
[Pipeline] stage
[Pipeline] { (Archive)
[Pipeline] archiveArtifacts
Archiving artifacts
[Pipeline] }
[Pipeline] // stage
[Pipeline] }
[Pipeline] // node
[Pipeline] End of Pipeline
Finished: SUCCESS`;
};


// 工单接口
export const getWorkorderList = (params?: any) => {
  // Mock 直接返回
  const { status, keyword } = params || {};
  let list = [...mockWorkorderList];
  if (status) list = list.filter(i => i.status === status);
  if (keyword) list = list.filter(i => i.title.includes(keyword) || i.orderNo.includes(keyword));
  return Promise.resolve({ items: list, total: list.length });
};

export const getWorkorderDetail = (id: number | string) => {
  return Promise.resolve(mockWorkorderDetail);
};

// 服务基线接口
export const getBaselineList = (params?: any) => {
  return Promise.resolve({ items: mockBaselineList, total: mockBaselineList.length });
};

export const triggerJenkinsBuild = (data: { appName: string; jenkinsJob: string }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ buildNo: Math.floor(Math.random() * 100) + 1, message: '构建已触发' });
    }, 800);
  });
};

export const getJenkinsBuildLog = (data: { jenkinsJob: string; buildNo: number }) => {
  return Promise.resolve({ log: generateBuildLog(data.jenkinsJob, data.buildNo), finished: true });
};

// 环境配置接口
export const getEnvList = (params?: any) => {
  return Promise.resolve(mockEnvList);
};

export const saveEnvVar = (data: any) => {
  return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 500));
};

export const deleteEnvVar = (id: number) => {
  return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 300));
};

// ==================== 发布工单 Mock 数据 ====================
export const mockDeployList = [
  {
    id: 1,
    deployNo: 'DP-2025031001',
    orderNo: 'WO-2025031001',
    appName: 'user-mr-data',
    envKey: 'pre',
    envName: '预生产环境',
    version: 'v1.4.2-build42',
    status: 'success',
    statusText: '成功',
    currentStep: 3,
    steps: ['下线', '部署中', '上线', '健康检查'],
    operator: '任岩',
    createdAt: '2025-03-10 14:20:00',
    duration: '25s',
  },
  {
    id: 2,
    deployNo: 'DP-2025031002',
    orderNo: 'WO-2025031001',
    appName: 'user-center-api',
    envKey: 'pre',
    envName: '预生产环境',
    version: 'v1.1.0-build28',
    status: 'releasing',
    statusText: '部署中',
    currentStep: 1,
    steps: ['下线', '部署中', '上线', '健康检查'],
    operator: '任岩',
    createdAt: '2025-03-10 14:25:00',
    duration: '12s',
  },
  {
    id: 3,
    deployNo: 'DP-2025030901',
    orderNo: 'WO-2025030901',
    appName: 'risk-engine',
    envKey: 'prod',
    envName: '生产环境',
    version: 'v2.3.1-build15',
    status: 'failed',
    statusText: '失败',
    currentStep: 2,
    steps: ['下线', '部署中', '上线', '健康检查'],
    operator: '张三',
    createdAt: '2025-03-09 10:15:00',
    duration: '45s',
  },
  {
    id: 4,
    deployNo: 'DP-2025030701',
    orderNo: 'WO-2025030701',
    appName: 'devops-frontend',
    envKey: 'test',
    envName: '测试环境',
    version: 'v1.0.3-build67',
    status: 'success',
    statusText: '成功',
    currentStep: 3,
    steps: ['下线', '部署中', '上线', '健康检查'],
    operator: '王五',
    createdAt: '2025-03-07 11:30:00',
    duration: '18s',
  },
];

// 发布工单 Mock 接口
export const getDeployList = (params?: any) => {
  const { appName, envKey } = params || {};
  let list = [...mockDeployList];
  if (appName) {
    list = list.filter((i) => i.appName.includes(appName));
  }
  if (envKey) {
    list = list.filter((i) => i.envKey === envKey);
  }
  return Promise.resolve({ items: list, total: list.length });
};

export const createDeploy = (data?: any) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newDeploy = {
        id: mockDeployList.length + 1,
        deployNo: `DP-202503100${mockDeployList.length + 1}`,
        orderNo: data.orderNo || 'WO-2025031001',
        appName: data.appName,
        envKey: data.envKey || 'pre',
        envName: data.envKey === 'prod' ? '生产环境' : data.envKey === 'pre' ? '预生产环境' : '测试环境',
        version: data.version || 'v1.0.0',
        status: 'pending',
        statusText: '待部署',
        currentStep: 0,
        steps: ['下线', '部署中', '上线', '健康检查'],
        operator: 'admin',
        createdAt: new Date().toLocaleString(),
        duration: '--',
      };
      mockDeployList.unshift(newDeploy);
      resolve(newDeploy);
    }, 500);
  });
};

export const updateDeployList = (id: any, data: any) => {
  const item = mockDeployList.find((i) => i.id === id);
  if (item) {
    Object.assign(item, data);
  }
  return Promise.resolve({ success: true });
};

export const deleteDeployList = (id: any) => {
  const index = mockDeployList.findIndex((i) => i.id === id);
  if (index !== -1) {
    mockDeployList.splice(index, 1);
  }
  return Promise.resolve({ success: true });
};

