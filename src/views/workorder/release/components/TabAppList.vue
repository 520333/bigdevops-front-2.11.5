<template>
  <div class="space-y-3 py-1">
    <!-- 1. 顶部说明与控制栏 (完全参照原型) -->
    <div class="flex items-center justify-between pb-2">
      <div class="text-xs text-[#ff4d4f] font-normal tracking-wide flex items-center gap-1">
        <span>说明：应用的顺序即发布时的顺序，请注意调整顺序</span>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5 text-xs text-gray-500">
          <span>刷新</span>
          <Switch v-model:checked="autoRefresh" size="small" />
        </div>

        <Button type="primary" size="small" class="!bg-[#1890ff] !border-[#1890ff] text-xs h-7" @click="openSelectModal">
          添加迭代应用
        </Button>
      </div>
    </div>

    <!-- 2. 主应用清单表格 (支持拖拽排序 + 展开多实例流水线) -->
    <div class="border border-gray-200 dark:border-zinc-800 rounded overflow-hidden bg-white dark:bg-[#1e1e1e]">
      <!-- 表头 -->
      <div class="grid grid-cols-12 gap-2 px-3 py-2.5 bg-[#fafafa] dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 text-xs font-semibold text-gray-600 dark:text-gray-300">
        <div class="col-span-1 flex items-center justify-center gap-2">
          <span class="w-4"></span>
          <span class="w-4"></span>
          <span>序号</span>
        </div>
        <div class="col-span-2">应用名称</div>
        <div class="col-span-1">应用类型</div>
        <div class="col-span-2">测试完成基线tag</div>
        <div class="col-span-2">最新tag</div>
        <div class="col-span-2">迭代应用</div>
        <div class="col-span-1 text-center">执行状态</div>
        <div class="col-span-1 text-right pr-2">操作</div>
      </div>

      <!-- 可拖拽列表容器 -->
      <draggable
        v-model="list"
        item-key="id"
        handle=".drag-handle"
        ghost-class="ghost-row"
        animation="180"
        @end="handleDragEnd"
      >
        <template #item="{ element, index }">
          <div class="border-b border-gray-100 dark:border-zinc-800 last:border-b-0">
            <!-- 主行 -->
            <div
              class="grid grid-cols-12 gap-2 px-3 py-3 items-center text-xs hover:bg-[#fcfdfe] dark:hover:bg-zinc-800/40 transition-colors"
              :class="{ 'bg-blue-50/20': element.expanded }"
            >
              <!-- 拖拽把手、展开图标与序号 -->
              <div class="col-span-1 flex items-center justify-center gap-2">
                <span
                  class="drag-handle cursor-move text-gray-400 hover:text-blue-500 text-sm select-none"
                  title="按住拖动以调整发布次序"
                >
                  ⋮⋮
                </span>
                <!-- 展开/收起按钮 [+][-] 风格 -->
                <button
                  type="button"
                  class="w-4 h-4 rounded border border-gray-300 dark:border-zinc-700 flex items-center justify-center text-[10px] text-gray-500 hover:border-blue-500 hover:text-blue-500 bg-white dark:bg-zinc-800 transition-colors leading-none"
                  @click="toggleExpand(element)"
                >
                  {{ element.expanded ? '-' : '+' }}
                </button>
                <span class="text-gray-600 dark:text-gray-300 font-medium">
                  {{ index + 1 }}
                </span>
              </div>

              <!-- 应用名称 -->
              <div class="col-span-2 font-medium text-gray-800 dark:text-gray-200 truncate" :title="element.serviceName">
                {{ element.serviceName }}
              </div>

              <!-- 应用类型 -->
              <div class="col-span-1 text-gray-600 dark:text-gray-400">
                {{ element.appType || 'java后端' }}
              </div>

              <!-- 测试完成基线tag -->
              <div class="col-span-2 text-gray-600 dark:text-gray-300 font-mono truncate" :title="element.baselineTag">
                {{ element.baselineTag }}
              </div>

              <!-- 最新tag -->
              <div class="col-span-2 text-gray-800 dark:text-gray-200 font-mono font-medium truncate" :title="element.latestTag">
                {{ element.latestTag }}
              </div>

              <!-- 迭代应用 (可点击超链接风格) -->
              <div class="col-span-2">
                <a
                  class="text-blue-600 hover:text-blue-500 truncate block hover:underline"
                  :title="element.iterationApp"
                  @click.prevent="handleShowIterationDetail(element)"
                >
                  {{ element.iterationApp }}
                </a>
              </div>

              <!-- 执行状态 -->
              <div class="col-span-1 text-center">
                <Tag
                  :color="getStatusColor(element.status)"
                  class="!text-xs !px-2 !py-0.5 rounded"
                >
                  {{ getStatusText(element.status) }}
                </Tag>
              </div>

              <!-- 操作按钮组 -->
              <div class="col-span-1 flex items-center justify-end gap-1.5 text-xs pr-1">
                <a
                  class="text-blue-600 hover:text-blue-700 hover:underline"
                  @click="handleDeployApp(element)"
                >
                  一键部署
                </a>
                <a
                  class="text-blue-600 hover:text-blue-700 hover:underline"
                  @click="handleModifyTag(element)"
                >
                  修改tag
                </a>
                <a
                  class="text-blue-600 hover:text-blue-700 hover:underline"
                  @click="handleMarkDone(element)"
                >
                  完成
                </a>
                <Dropdown>
                  <template #overlay>
                    <Menu>
                      <Menu.Item key="rollback" @click="handleRollbackTag(element)">回滚基线Tag</Menu.Item>
                      <Menu.Item key="logs" @click="handleViewLogs(element)">查看部署日志</Menu.Item>
                      <Menu.Item key="delete" danger @click="handleRemoveApp(index)">移除服务</Menu.Item>
                    </Menu>
                  </template>
                  <a class="text-blue-600 hover:text-blue-700">更多</a>
                </Dropdown>
              </div>
            </div>

            <!-- 3. 展开后的多实例详细流水线表格 (直接对标原型中子表格) -->
            <div
              v-if="element.expanded"
              class="bg-[#fafbfc] dark:bg-[#181818] px-6 py-4 border-t border-dashed border-gray-200 dark:border-zinc-800"
            >
              <div class="border border-gray-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 overflow-hidden">
                <!-- 子表表头 -->
                <div class="grid grid-cols-12 gap-2 px-4 py-2 bg-[#f5f7fa] dark:bg-zinc-800 text-xs font-semibold text-gray-500 border-b border-gray-200 dark:border-zinc-800">
                  <div class="col-span-1 flex items-center gap-2">
                    <input type="checkbox" class="rounded border-gray-300 text-blue-600" />
                    <span>部署类型</span>
                  </div>
                  <div class="col-span-1">环境类型</div>
                  <div class="col-span-1">profile</div>
                  <div class="col-span-2">IP地址</div>
                  <div class="col-span-1 text-center">发布状态</div>
                  <div class="col-span-4 text-center">进度监控</div>
                  <div class="col-span-2 text-right pr-2">操作</div>
                </div>

                <!-- 实例子行 -->
                <div
                  v-for="(inst, iIdx) in element.instances"
                  :key="inst.id || iIdx"
                  class="grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs border-b border-gray-100 dark:border-zinc-800 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-zinc-800/40"
                >
                  <!-- 勾选与部署类型 -->
                  <div class="col-span-1 flex items-center gap-2">
                    <input type="checkbox" class="rounded border-gray-300 text-blue-600" />
                    <span class="text-gray-700 dark:text-gray-300">{{ inst.deployType }}</span>
                  </div>

                  <!-- 环境类型 -->
                  <div class="col-span-1 text-gray-600 dark:text-gray-400 font-mono">
                    {{ inst.envType }}
                  </div>

                  <!-- profile -->
                  <div class="col-span-1 text-gray-600 dark:text-gray-400 font-mono">
                    {{ inst.profile }}
                  </div>

                  <!-- IP地址 -->
                  <div class="col-span-2 font-mono text-gray-800 dark:text-gray-200">
                    {{ inst.ip }}
                  </div>

                  <!-- 发布状态 Tag -->
                  <div class="col-span-1 text-center">
                    <Tag
                      :color="inst.status === 'SUCCESS' ? 'success' : inst.status === 'DEPLOYING' ? 'processing' : 'default'"
                      class="!text-xs !px-1.5 !py-0.5 rounded"
                    >
                      {{ inst.status === 'SUCCESS' ? '成功' : inst.status === 'DEPLOYING' ? '发布中' : '待发布' }}
                    </Tag>
                  </div>

                  <!-- 进度监控流水线节点: 下线 -> 部署中 -> 上线 -> 健康检查 -->
                  <div class="col-span-4 flex items-center justify-center">
                    <div class="flex items-center justify-between w-full max-w-[280px]">
                      <!-- 节点 1: 下线 -->
                      <div class="flex flex-col items-center">
                        <div
                          class="w-2.5 h-2.5 rounded-full"
                          :class="inst.currentStepIndex >= 1 ? 'bg-[#52c41a]' : 'border-2 border-gray-300 bg-white'"
                        ></div>
                        <span
                          class="text-[11px] mt-1"
                          :class="inst.currentStepIndex >= 1 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400'"
                        >
                          下线
                        </span>
                      </div>

                      <div
                        class="flex-1 h-[2px] mx-1.5 -mt-3.5"
                        :class="inst.currentStepIndex >= 2 ? 'bg-[#52c41a]' : 'bg-gray-200 dark:bg-zinc-700'"
                      ></div>

                      <!-- 节点 2: 部署中 -->
                      <div class="flex flex-col items-center">
                        <div
                          class="w-2.5 h-2.5 rounded-full"
                          :class="inst.currentStepIndex >= 2 ? 'bg-[#52c41a]' : inst.status === 'DEPLOYING' ? 'bg-[#1890ff] animate-ping' : 'border-2 border-gray-300 bg-white'"
                        ></div>
                        <span
                          class="text-[11px] mt-1"
                          :class="inst.currentStepIndex >= 2 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400'"
                        >
                          部署中
                        </span>
                      </div>

                      <div
                        class="flex-1 h-[2px] mx-1.5 -mt-3.5"
                        :class="inst.currentStepIndex >= 3 ? 'bg-[#52c41a]' : 'bg-gray-200 dark:bg-zinc-700'"
                      ></div>

                      <!-- 节点 3: 上线 -->
                      <div class="flex flex-col items-center">
                        <div
                          class="w-2.5 h-2.5 rounded-full"
                          :class="inst.currentStepIndex >= 3 ? 'bg-[#52c41a]' : 'border-2 border-gray-300 bg-white'"
                        ></div>
                        <span
                          class="text-[11px] mt-1"
                          :class="inst.currentStepIndex >= 3 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400'"
                        >
                          上线
                        </span>
                      </div>

                      <div
                        class="flex-1 h-[2px] mx-1.5 -mt-3.5"
                        :class="inst.currentStepIndex >= 4 ? 'bg-[#52c41a]' : 'bg-gray-200 dark:bg-zinc-700'"
                      ></div>

                      <!-- 节点 4: 健康检查 -->
                      <div class="flex flex-col items-center">
                        <div
                          class="w-2.5 h-2.5 rounded-full"
                          :class="inst.currentStepIndex >= 4 ? 'bg-[#52c41a]' : 'border-2 border-gray-300 bg-white'"
                        ></div>
                        <span
                          class="text-[11px] mt-1"
                          :class="inst.currentStepIndex >= 4 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400'"
                        >
                          健康检查
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- 实例操作 -->
                  <div class="col-span-2 flex items-center justify-end gap-2 text-xs pr-1">
                    <a class="text-blue-600 hover:underline" @click="handleViewInstanceLog(element, inst)">
                      执行日志
                    </a>
                    <a class="text-blue-600 hover:underline" @click="handleDeployInstance(inst)">
                      构建部署
                    </a>
                    <a class="text-blue-600 hover:underline" @click="handleManualCheck(inst)">
                      手工检查
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </draggable>

      <!-- 空状态 -->
      <div v-if="list.length === 0" class="py-12 text-center text-gray-400 text-xs">
        当前无待发布应用，请点击右上角【添加迭代应用】从基线或仓库引入
      </div>
    </div>

    <!-- 4. 底部右下角【保存应用顺序】按钮 -->
    <div class="flex justify-end pt-2">
      <Button
        type="primary"
        class="!bg-[#1890ff] !border-[#1890ff] px-6 text-sm h-8"
        @click="handleSaveOrder"
      >
        保存应用顺序
      </Button>
    </div>

    <!-- 弹窗：选择添加服务 -->
    <SelectServiceModal @register="registerSelectModal" @select-services="handleSelectedServices" />

    <!-- 弹窗：修改Tag -->
    <Modal
      v-model:open="modifyTagVisible"
      title="修改应用发版 Tag"
      @ok="handleConfirmModifyTag"
    >
      <div class="py-3 space-y-3">
        <div>
          <label class="text-xs text-gray-500 block mb-1">应用名称</label>
          <Input :value="activeApp?.serviceName" disabled />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">测试完成基线 Tag</label>
          <Input :value="activeApp?.baselineTag" disabled />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">最新发布 Tag (构建目标)</label>
          <Input v-model:value="editingTag" placeholder="请输入合规的版本 Tag..." />
        </div>
      </div>
    </Modal>

    <!-- 抽屉：控制台实时日志 -->
    <Drawer
      v-model:open="logDrawerVisible"
      :title="`发布控制台执行日志 - ${drawerTitle}`"
      width="720px"
      placement="right"
    >
      <div class="bg-black text-green-400 font-mono text-xs p-4 rounded h-full overflow-y-auto whitespace-pre-wrap select-text leading-relaxed">
        {{ currentLogs || '正在拉取流水线日志...' }}
      </div>
    </Drawer>
  </div>
</template>

<script lang="ts" setup>
  import { ref, PropType } from 'vue';
  import draggable from 'vuedraggable';
  import {
    Tag,
    Button,
    Switch,
    Dropdown,
    Menu,
    Modal,
    Input,
    Drawer,
    message,
  } from 'ant-design-vue';
  import { useModal } from '@/components/Modal';
  import SelectServiceModal from './SelectServiceModal.vue';
  import type { ReleaseAppItem, AppInstanceItem } from '../types';

  const props = defineProps({
    modelValue: {
      type: Array as PropType<ReleaseAppItem[]>,
      required: true,
    },
  });

  const list = props.modelValue;
  const autoRefresh = ref(false);

  const [registerSelectModal, { openModal: openSelectModal }] = useModal();

  // 修改 Tag 状态
  const modifyTagVisible = ref(false);
  const activeApp = ref<ReleaseAppItem | null>(null);
  const editingTag = ref('');

  // 日志 Drawer
  const logDrawerVisible = ref(false);
  const drawerTitle = ref('');
  const currentLogs = ref('');

  const toggleExpand = (element: ReleaseAppItem) => {
    element.expanded = !element.expanded;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'success';
      case 'BUILDING':
        return 'processing';
      case 'FAILURE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '成功';
      case 'BUILDING':
        return '发布中';
      case 'FAILURE':
        return '失败';
      default:
        return '待发布';
    }
  };

  // 拖拽调整顺序后
  const handleDragEnd = () => {
    list.forEach((item, index) => {
      item.order = index + 1;
    });
    message.success('已调整应用发布依赖先后顺序，请点击下方【保存应用顺序】！');
  };

  // 保存应用顺序按钮
  const handleSaveOrder = () => {
    const orderNames = list.map((a, i) => `${i + 1}. ${a.serviceName}`).join(' -> ');
    message.success(`应用发布顺序已成功保存！当前执行流水顺序：${orderNames}`);
  };

  // 一键部署应用 (推进所有实例的步进管道)
  const handleDeployApp = (app: ReleaseAppItem) => {
    app.status = 'BUILDING';
    app.expanded = true;
    message.loading({ content: `正在触发应用 [${app.serviceName}] 的多主机灰度部署流水线...`, key: app.serviceName });

    app.instances.forEach((inst, idx) => {
      inst.status = 'DEPLOYING';
      inst.currentStepIndex = 1; // 下线
      setTimeout(() => {
        inst.currentStepIndex = 2; // 部署中
      }, 1000 + idx * 800);
      setTimeout(() => {
        inst.currentStepIndex = 3; // 上线
      }, 2200 + idx * 800);
      setTimeout(() => {
        inst.currentStepIndex = 4; // 健康检查完成
        inst.status = 'SUCCESS';
      }, 3400 + idx * 800);
    });

    setTimeout(() => {
      app.status = 'SUCCESS';
      message.success({ content: `[${app.serviceName}] 所有主机实例已灰度发布完成并通过健康检查！`, key: app.serviceName });
    }, 4200);
  };

  // 修改 Tag
  const handleModifyTag = (app: ReleaseAppItem) => {
    activeApp.value = app;
    editingTag.value = app.latestTag;
    modifyTagVisible.value = true;
  };

  const handleConfirmModifyTag = () => {
    if (activeApp.value) {
      activeApp.value.latestTag = editingTag.value;
      message.success(`已更新 [${activeApp.value.serviceName}] 的构建发布 Tag: ${editingTag.value}`);
    }
    modifyTagVisible.value = false;
  };

  // 标记完成
  const handleMarkDone = (app: ReleaseAppItem) => {
    app.status = 'SUCCESS';
    message.success(`应用 [${app.serviceName}] 状态已标记为完成！`);
  };

  // 回滚基线 Tag
  const handleRollbackTag = (app: ReleaseAppItem) => {
    Modal.confirm({
      title: '确认回滚至测试完成基线 Tag？',
      content: `系统将把最新 Tag 替换为基线 Tag: ${app.baselineTag} 并准备重新发布。`,
      onOk: () => {
        app.latestTag = app.baselineTag;
        message.warning(`已重置 [${app.serviceName}] 为基线 Tag: ${app.baselineTag}`);
      },
    });
  };

  // 移除应用
  const handleRemoveApp = (index: number) => {
    list.splice(index, 1);
    list.forEach((item, idx) => {
      item.order = idx + 1;
    });
    message.info('已从发布单中移除该应用！');
  };

  // 点击迭代应用
  const handleShowIterationDetail = (app: ReleaseAppItem) => {
    Modal.info({
      title: '迭代应用详情',
      content: `关联迭代版本：${app.iterationApp}\n所属服务：${app.serviceName}\n基线Tag：${app.baselineTag}\n最新Tag：${app.latestTag}`,
    });
  };

  // 部署单个主机实例
  const handleDeployInstance = (inst: AppInstanceItem) => {
    inst.status = 'DEPLOYING';
    inst.currentStepIndex = 1;
    message.loading({ content: `正在对主机 ${inst.ip} 执行下线与部署...`, key: inst.ip });

    setTimeout(() => {
      inst.currentStepIndex = 2;
    }, 1000);
    setTimeout(() => {
      inst.currentStepIndex = 3;
    }, 2000);
    setTimeout(() => {
      inst.currentStepIndex = 4;
      inst.status = 'SUCCESS';
      message.success({ content: `主机 ${inst.ip} 部署完成并健康上线！`, key: inst.ip });
    }, 3000);
  };

  // 手工检查单个实例
  const handleManualCheck = (inst: AppInstanceItem) => {
    Modal.info({
      title: `主机实例手工健康检查 - ${inst.ip}`,
      content: `检查地址: http://${inst.ip}:8080/actuator/health\n响应状态: 200 OK\n运行环境: ${inst.profile}\n服务进程: PID 32414 (Running 2h 45m)\n检查结果: [PASSED] 实例健康指标正常。`,
    });
  };

  // 查看应用日志
  const handleViewLogs = (app: ReleaseAppItem) => {
    drawerTitle.value = app.serviceName;
    currentLogs.value = `[DevOps Platform] Pulling git tag ${app.latestTag} for ${app.serviceName}...\n[Pipeline] Compiling maven artifacts with profile cu-pre...\n[Pipeline] Docker build harbor.net/service/${app.serviceName}:${app.latestTag} SUCCESS\n[Deploy] Dispatched to instances: 172.21.0.68, 172.21.1.87\n[HealthCheck] SpringBoot actuator endpoint returned 200 OK.`;
    logDrawerVisible.value = true;
  };

  // 查看单个实例日志
  const handleViewInstanceLog = (app: ReleaseAppItem, inst: AppInstanceItem) => {
    drawerTitle.value = `${app.serviceName} (${inst.ip})`;
    currentLogs.value = `[Host Agent] ${inst.ip} - Graceful shutdown initiated.\n[Host Agent] Removing traffic from SLB upstream...\n[Host Agent] Deploying binary version: ${app.latestTag} with profile: ${inst.profile}...\n[Host Agent] Process started: java -jar -Dspring.profiles.active=${inst.profile} app.jar\n[Host Agent] Listening on port 8080. Health check passed.\n[Host Agent] Re-registering to Nacos service discovery registry... OK.`;
    logDrawerVisible.value = true;
  };

  // 从弹窗选择服务添加至清单
  const handleSelectedServices = (services: any[]) => {
    services.forEach((s) => {
      const exists = list.some((item) => item.serviceName === s.serviceName);
      if (!exists) {
        list.push({
          id: s.id || Date.now() + Math.random(),
          order: list.length + 1,
          serviceName: s.serviceName,
          appType: 'java后端',
          baselineTag: `${s.serviceName}-2025030101`,
          latestTag: `${s.serviceName}-2025030601`,
          iterationApp: `【${s.serviceName}】release-v1.0`,
          status: 'WAITING',
          expanded: true,
          instances: [
            {
              id: `inst-${Date.now()}-1`,
              deployType: '主机',
              envType: 'pre',
              profile: 'cu-pre',
              ip: '172.21.3.11',
              status: 'WAITING',
              currentStepIndex: 0,
              steps: [
                { title: '下线', status: 'wait' },
                { title: '部署中', status: 'wait' },
                { title: '上线', status: 'wait' },
                { title: '健康检查', status: 'wait' },
              ],
            },
          ],
        });
      }
    });
    message.success(`成功载入 ${services.length} 个应用至发布清单！`);
  };
</script>

<style scoped>
  .ghost-row {
    opacity: 0.7;
    background-color: #e6f7ff !important;
    border: 1px dashed #1890ff !important;
  }
</style>
