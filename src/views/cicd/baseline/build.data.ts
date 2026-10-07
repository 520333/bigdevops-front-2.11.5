import { FormSchema } from '@/components/Form';
import { getRepoBranches } from '@/api/code/repo';

/**
 * 提取 Git 仓库 full_name (Group/Project)
 */
export function extractGitFullName(url: string): string {
  if (!url) return '';
  let clean = url.trim().replace(/\.git$/, '');

  if (clean.includes('://')) clean = clean.substring(clean.indexOf('://') + 3);
  if (clean.includes('@')) clean = clean.substring(clean.indexOf('@') + 1);
  if (clean.includes(':')) clean = clean.split(':').pop()!;
  clean = clean.replace(/^\/+/, '');

  const parts = clean.split('/').filter(Boolean);
  if (
    parts.length > 2 &&
    (parts[0].includes('.') || parts[0].includes(':') || /^\d+$/.test(parts[0]))
  ) {
    parts.shift();
    return parts.join('/');
  }
  return clean;
}

/**
 * 远程真实分支 ApiSelect 配置（直调接口，无多级兜底）
 */
export function getBranchApiSelectProps(getGitRepo: () => string) {
  return {
    showSearch: true,
    allowClear: true,
    alwaysLoad: true,
    optionFilterProp: 'name',
    labelField: 'name',
    valueField: 'name',
    placeholder: '请选择分支 (实时从 Git 仓库拉取)...',
    api: async () => {
      const gitRepo = getGitRepo() || '';
      const gitFullName = extractGitFullName(gitRepo);
      if (!gitRepo && !gitFullName) return [];

      try {
        const res: any = await getRepoBranches({ fullName: gitFullName || gitRepo });
        const list = res?.items || res || [];
        return Array.isArray(list) ? list : [];
      } catch (err) {
        console.error('获取 Git 仓库分支失败:', err);
        return [];
      }
    },
  };
}

/**
 * 自定义扩展参数 FormSchema 插槽项
 */
export const customParamsSchemaItem: FormSchema = {
  field: 'customParamsSlotField',
  label: ' ',
  colon: false,
  component: 'Input',
  slot: 'customParamsSlot',
  colProps: { span: 24 },
};

/**
 * 纯粹基于远程 Jenkins Job 参数定义动态组装 FormSchema
 */
export function buildDynamicSchemas(params: any[], getRecord?: () => any): FormSchema[] {
  const schemas: FormSchema[] = params.map((item) => {
    const isBool = item.type === 'boolean';
    const isChoice =
      item.type === 'choice' && Array.isArray(item.choices) && item.choices.length > 0;
    const isBranch =
      item.type === 'branch' ||
      ['分支', 'branch'].some((k) => item.name?.toLowerCase()?.includes(k));
    const isHost = ['目标主机', 'target_host', 'targethost', 'hosts', 'host'].some((k) =>
      item.name?.toLowerCase()?.includes(k),
    );
    const isLongText = ['构建命令', 'command', 'GIT仓库', 'gitRepo', 'url'].some((key) =>
      item.name?.includes(key),
    );

    if (isBool) {
      return {
        field: item.name,
        label: item.name,
        component: 'Checkbox',
        helpMessage: item.description || undefined,
        colProps: { span: 24 },
      };
    }

    if (isBranch) {
      return {
        field: item.name,
        label: item.name,
        component: 'ApiSelect',
        required: true,
        helpMessage: item.description || undefined,
        colProps: { span: 12 },
        componentProps: ({ formModel }) => {
          const record = getRecord?.();
          return getBranchApiSelectProps(() => {
            return formModel?.['GIT仓库'] || formModel?.gitRepo || record?.gitRepo || '';
          });
        },
      };
    }

    if (isHost) {
      let hostOptions: string[] = [];
      if (isChoice && item.choices?.length > 0) {
        hostOptions = item.choices;
      } else if (item.defaultValue && typeof item.defaultValue === 'string') {
        hostOptions = item.defaultValue
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
      if (hostOptions.length === 0 && item.defaultValue) {
        hostOptions = [String(item.defaultValue).trim()];
      }

      if (hostOptions.length > 0) {
        return {
          field: item.name,
          label: item.name,
          component: 'Select',
          required: true,
          helpMessage: item.description || '支持多选或单选目标主机，支持自由追加 IP',
          colProps: { span: 24 },
          componentProps: {
            mode: 'tags',
            showSearch: true,
            allowClear: true,
            placeholder: `请选择 ${item.name}（可单选或多选）`,
            options: hostOptions.map((c: string) => ({ label: c, value: c })),
          },
        };
      }
    }

    if (isChoice) {
      return {
        field: item.name,
        label: item.name,
        component: 'Select',
        required: true,
        helpMessage: item.description || undefined,
        colProps: { span: 12 },
        componentProps: {
          showSearch: true,
          allowClear: false,
          placeholder: `请选择 ${item.name}`,
          options: item.choices.map((c: string) => ({ label: c, value: c })),
        },
      };
    }

    return {
      field: item.name,
      label: item.name,
      component: 'Input',
      required: false,
      helpMessage: item.description || undefined,
      colProps: { span: isLongText || isHost ? 24 : 12 },
      componentProps: {
        placeholder: item.description || `请输入 ${item.name}`,
      },
    };
  });

  schemas.push(customParamsSchemaItem);
  return schemas;
}

/**
 * 组装 Jenkins 参数初始值
 */
export function extractInitialValues(params: any[], record?: any): Record<string, any> {
  const values: Record<string, any> = {};
  params.forEach((p) => {
    let val = p.defaultValue;
    const isHost = ['目标主机', 'target_host', 'targethost', 'hosts', 'host'].some((k) =>
      p.name?.toLowerCase()?.includes(k),
    );

    if (p.type === 'boolean') {
      val = val === true || val === 'true';
    } else if (isHost) {
      if (Array.isArray(val)) {
        // 已经是数组
      } else if (typeof val === 'string' && val.trim() !== '') {
        val = val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (p.type === 'choice' && Array.isArray(p.choices) && p.choices.length > 0) {
        val = p.choices;
      }
    } else if (p.type === 'choice' && (!val || val === '') && p.choices?.length > 0) {
      val = p.choices[0];
    }
    if ((p.name === 'GIT仓库' || p.name === 'gitRepo') && !val && record?.gitRepo) {
      val = record.gitRepo;
    }
    if ((p.name === '分支名' || p.name === 'branch' || p.type === 'branch') && !val) {
      val = record?.gitBranch || undefined;
    }
    values[p.name] = val;
  });
  return values;
}
