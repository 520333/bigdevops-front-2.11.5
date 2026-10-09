// ==================== Mock 数据 ====================


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


