import { IAnyObject } from '../typings/base-type';
import { Ref, SetupContext, getCurrentInstance, toRaw, type EmitsOptions } from 'vue';
import { cloneDeep, forOwn, isFunction } from 'lodash-es';
import { AForm, IVFormComponent } from '../typings/v-form-component';
import { Form } from 'ant-design-vue';

export function useFormInstanceMethods<E extends EmitsOptions = EmitsOptions>(
  props: IAnyObject,
  formdata,
  context: SetupContext<E>,
  _formInstance: Ref<AForm | null>,
) {
  /**
   * 绑定props和on中的上下文为parent
   */
  const bindContext = () => {
    const instance = getCurrentInstance();
    const vm = instance?.parent;
    if (!vm) return;

    (props.formConfig.schemas as IVFormComponent[]).forEach((item) => {
      // 绑定 props 中的上下文
      forOwn(item.componentProps, (value: any, key) => {
        if (isFunction(value)) {
          item.componentProps![key] = value.bind(vm);
        }
      });
      // 绑定事件监听（v-on）的上下文
      forOwn(item.on, (value: any, key) => {
        if (isFunction(value)) {
          item.componentProps![key] = value.bind(vm);
        }
      });
    });
  };
  bindContext();

  const { emit } = context;

  const validate = async () => {
    if (_formInstance.value && isFunction((_formInstance.value as any).validate)) {
      return await (_formInstance.value as any).validate();
    }
    return Promise.resolve();
  };

  const validateField = async (name: string) => {
    if (_formInstance.value && isFunction((_formInstance.value as any).validateField)) {
      return await (_formInstance.value as any).validateField(name);
    }
    return Promise.resolve();
  };

  const resetFields = async () => {
    if (_formInstance.value && isFunction((_formInstance.value as any).resetFields)) {
      (_formInstance.value as any).resetFields();
    }
  };

  const clearValidate = async () => {
    if (_formInstance.value && isFunction((_formInstance.value as any).clearValidate)) {
      (_formInstance.value as any).clearValidate();
    }
  };

  const submit = async () => {
    await validate();

    const data = cloneDeep(toRaw(formdata.value));
    emit?.('submit', data);
    props.formConfig.submit?.(data);
    return data;
  };

  return {
    validate,
    validateField,
    resetFields,
    clearValidate,
    submit,
  };
}
