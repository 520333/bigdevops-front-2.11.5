<template>
  <PageWrapper title="创建 Jenkins 流水线" content="选择预设模板，快速生成并在线编辑 Jenkinsfile。">
    
    <div class="flex flex-col md:flex-row gap-4">
      <div class="w-full md:w-1/3">
        <Card title="Jenkins 任务配置" :bordered="false" class="h-full">
          <BasicForm @register="registerForm" />
          <div class="mt-4 flex justify-center space-x-4">
            <a-button @click="handleReset">重置</a-button>
            <a-button type="primary" :loading="submitLoading" @click="handleSubmit">
              保存并应用
            </a-button>
          </div>
        </Card>
      </div>

      <div class="w-full md:w-2/3">
        <Card title="Jenkinsfile 脚本编辑 (Groovy)" :bordered="false" class="h-full">
          <template #extra>
            <Space>
              <span class="text-gray-500 text-sm">快速插入模板：</span>
              <a-button size="small" type="dashed" @click="insertTemplate('go')">
                <Icon icon="ant-design:code-outlined" /> Go 后端
              </a-button>
              <a-button size="small" type="dashed" @click="insertTemplate('vue')">
                <Icon icon="ant-design:html5-outlined" /> Vue 前端
              </a-button>
              <a-button size="small" type="dashed" @click="insertTemplate('docker')">
                <Icon icon="ant-design:container-outlined" /> Docker 部署
              </a-button>
            </Space>
          </template>

          <div class="h-[500px] border border-gray-200 rounded-md overflow-hidden">
            <CodeEditor
              v-model:value="pipelineCode"
              mode="javascript" 
              class="h-full w-full"
              :readonly="false"
            />
          </div>
        </Card>
      </div>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { Card, Space, message, Modal } from 'ant-design-vue';
  import { PageWrapper } from '@/components/Page';
  import { BasicForm, useForm } from '@/components/Form';
  import { CodeEditor } from '@/components/CodeEditor';
  import Icon from '@/components/Icon/Icon.vue';

  const submitLoading = ref(false);
  const pipelineCode = ref('');

  // 1. 初始化表单 (加入了 Jenkins 常用的凭证配置)
  const [registerForm, { validate, resetFields }] = useForm({
    labelWidth: 100,
    schemas: [
      { field: 'jobName', label: 'Job 名称', component: 'Input', required: true, defaultValue: 'my-jenkins-job' },
      { field: 'repoUrl', label: 'Git 仓库地址', component: 'Input', required: true, defaultValue: 'git@gitlab.com:demo/project.git' },
      { field: 'branch', label: '触发分支', component: 'Input', defaultValue: 'main', required: true },
      { 
        field: 'credentialId', 
        label: 'Git 凭证 ID', 
        component: 'Input', 
        defaultValue: 'gitlab-ssh-key',
        helpMessage: 'Jenkins 中配置的 Credentials ID' 
      },
      { field: 'desc', label: '描述说明', component: 'InputTextArea' }
    ],
    showActionButtonGroup: false,
  });

  // 2. 预设 Jenkinsfile 模板库 (Declarative Pipeline 语法)
  const templates = {
    go: `pipeline {
    agent any
    
    environment {
        GO111MODULE = 'on'
        GOPROXY = 'https://goproxy.cn,direct'
    }

    stages {
        stage('Build') {
            steps {
                echo 'Building Go application...'
                sh 'go build -o bin/app main.go'
            }
        }
        stage('Test') {
            steps {
                echo 'Running unit tests...'
                sh 'go test ./...'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying to target server...'
                sh './deploy.sh'
            }
        }
    }
}`,

    vue: `pipeline {
    // 假设 Jenkins 节点安装了 Docker，使用 Node 容器进行前端构建
    agent {
        docker {
            image 'node:18-alpine'
            args '-v /root/.npm:/root/.npm'
        }
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm install -g pnpm'
                sh 'pnpm install'
            }
        }
        stage('Build') {
            steps {
                sh 'pnpm run build'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Syncing dist files to Nginx...'
                // 此处需配置 ssh 凭证或使用 Publish Over SSH 插件
                sh 'scp -r dist/* user@server:/usr/share/nginx/html/'
            }
        }
    }
}`,

    docker: `pipeline {
    agent any

    environment {
        REGISTRY = 'registry.cn-hangzhou.aliyuncs.com'
        IMAGE_NAME = 'my-namespace/my-app'
        IMAGE_TAG = "v\${env.BUILD_ID}" // 使用 Jenkins 内部构建号
    }

    stages {
        stage('Build Image') {
            steps {
                sh 'docker build -t $REGISTRY/$IMAGE_NAME:$IMAGE_TAG .'
            }
        }
        stage('Push Image') {
            steps {
                // 使用 Jenkins 的 withCredentials 注入密码防泄漏
                withCredentials([usernamePassword(credentialsId: 'docker-registry-creds', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin $REGISTRY'
                    sh 'docker push $REGISTRY/$IMAGE_NAME:$IMAGE_TAG'
                }
            }
        }
    }
}`
  };

  // 3. 插入模板操作 (增加防覆盖确认)
  function insertTemplate(type: 'go' | 'vue' | 'docker') {
    if (pipelineCode.value && pipelineCode.value !== templates[type]) {
      Modal.confirm({
        title: '覆盖确认',
        content: '当前编辑器已有代码，插入模板将会覆盖现有内容，是否继续？',
        onOk() {
          pipelineCode.value = templates[type];
          message.success('Jenkinsfile 模板已插入！');
        }
      });
    } else {
      pipelineCode.value = templates[type];
      message.success('Jenkinsfile 模板已插入！');
    }
  }

  // 4. 表单提交
  async function handleSubmit() {
    try {
      const values = await validate();
      if (!pipelineCode.value) {
        return message.warning('Jenkinsfile 脚本不能为空！');
      }
      
      submitLoading.value = true;
      
      const payload = {
        ...values,
        jenkinsfile: pipelineCode.value
      };
      
      console.log('提交给 Go 后端的数据:', payload);
      // await createJenkinsPipeline(payload); 
      
      setTimeout(() => {
        message.success('Jenkins 流水线创建成功！');
        submitLoading.value = false;
      }, 1000);
      
    } catch (error) {
      console.error('表单校验失败', error);
    }
  }

  function handleReset() {
    resetFields();
    pipelineCode.value = '';
  }
</script>