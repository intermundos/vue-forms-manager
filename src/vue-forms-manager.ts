import type { Reactive } from 'vue-demi';
import { reactive, watch } from 'vue-demi';
import type {
  FieldInstance,
  FieldValue,
  FormFieldsRecord,
  FormInstance,
  FormOptions,
  Path,
  RecursiveRecord,
  ValidationRule,
  ValidationRules,
} from './types';
import { extract, getInPath, setByPath, traverseFormStructure } from './utils';

function buildForm<
  State extends RecursiveRecord<State>,
  Rules extends ValidationRules<State>,
  Options extends FormOptions,
>(formConfig: State, rules: Rules, options: Options) {
  const form = reactive({
    $pending: false,
    $invalid: false,
    $dirty: false,
    $errors: [],
    $messages: [],
  } as Omit<FormInstance, '$reset' | '$touch' | '$validate'>);

  const state = reactive(formConfig) as State;

  const paths = {} as { [key: string]: FieldValue };

  const $fields = {} as FormFieldsRecord<State>;

  const updateForm = (
    update: Partial<Omit<FormInstance, '$reset' | '$touch' | '$validate'>>,
  ) => {
    Object.assign(form, update);
  };

  const updateField =
    (field: FieldInstance<any>) =>
    (
      update: Partial<
        Omit<FieldInstance<any>, '$touch' | '$reset' | '$validate'>
      >,
    ) => {
      Object.assign(field, update);
    };

  function setupForm(
    formInstance: Reactive<
      Omit<FormInstance, '$reset' | '$touch' | '$validate'>
    >,
  ) {
    const allFields = extract<FormFieldsRecord<State>>(
      $fields,
      value => '$invalid' in value,
    ) as FieldInstance<any>[];

    const $touch = () => {
      allFields.forEach(field => field.$touch());
    };

    const $reset = () => {
      allFields.forEach(field => field.$reset());
      updateForm({
        $errors: [],
        $messages: [],
        $invalid: false,
        $dirty: false,
        $pending: false,
      });
    };

    const $validate = async () => {
      $reset();
      updateForm({ $pending: true });

      const fieldsValidationResult = await Promise.all(
        allFields.map(field => field.$validate()),
      );

      if (fieldsValidationResult.some(Boolean)) {
        updateForm({ $pending: false });
        return false;
      }

      return true;
    };

    const $form = Object.assign(formInstance, {
      $touch,
      $reset,
      $validate,
    } as FormInstance);

    return $form as Reactive<FormInstance>;
  }

  function setupFields() {
    for (const { path, value } of traverseFormStructure<
      State,
      Path<keyof State>
    >(formConfig, '' as Path<keyof State>)) {
      paths[path] = value;

      const fieldRules = (getInPath(rules, path) || []) as ValidationRule<
        typeof value
      >[];

      const field = createField(path, value, fieldRules);

      watch(
        () => field.$field.value,
        () => {
          field.$field.$touch();
          setByPath(path, state, field.$field.value);

          if (field.$field.$invalid) {
            field.$field.$reset();
          }
        },
      );

      setByPath<FormFieldsRecord<State>, FieldInstance<typeof value>>(
        path,
        $fields,
        field.$field,
      );
    }
  }

  function createField<ValueType extends FieldValue>(
    id: string,
    value: ValueType,
    rules: ValidationRule<ValueType>[],
  ) {
    const field = reactive({
      $field: {
        id,
        value,
        $invalid: false,
        $dirty: false,
        $errors: [],
        $messages: [],
        $pending: false,
        $touch() {
          updateField(field.$field)({
            $dirty: true,
          });

          if (!form.$dirty) {
            updateForm({
              $dirty: true,
            });
          }
        },
        $reset() {
          updateField(field.$field)({
            $dirty: false,
            $pending: false,
            $invalid: false,
            $errors: [],
            $messages: [],
          });
        },
        $update(newValue: ValueType) {
          updateField(field.$field)({
            value: newValue,
            $dirty: true,
          });

          if (options?.validateTrigger?.includes('change')) {
            field.$field.$validate();
          }
        },
        async $validate() {
          if (form.$invalid && options?.lazy) {
            return true;
          }

          updateForm({
            $pending: true,
          });
          updateField(field.$field)({
            $pending: true,
          });

          try {
            for (const rule of rules) {
              if (options?.firstError && field.$field.$invalid) {
                break;
              }

              const result = rule.test(field.$field.value as ValueType);
              const invalid = result instanceof Promise ? await result : result;

              if (!invalid) {
                const error = {
                  name: rule.name,
                  message:
                    typeof rule.message === 'function'
                      ? rule.message(this.value)
                      : rule.message,
                };

                updateField(field.$field)({
                  $invalid: true,
                  $errors: [...field.$field.$errors, error],
                  $messages: [...field.$field.$messages, error.message],
                });

                updateForm({
                  $invalid: true,
                  $errors: [...form.$errors, error],
                  $messages: [...form.$messages, error.message],
                });

                if (options.firstError) {
                  break;
                }
              }
            }
          } finally {
            updateField(field.$field)({
              $pending: false,
            });
          }

          return field.$field.$invalid;
        },
      } as FieldInstance<ValueType>,
    });

    return field as {
      $field: FieldInstance<ValueType>;
    };
  }

  setupFields();
  const $form = setupForm(form);

  return {
    state: state as {
      [K in keyof State]: State[K];
    },
    $form,
    $fields,
  };
}

export const FormsManager = new (class FormsManager {
  buildForm<
    State extends RecursiveRecord<State>,
    Rules extends ValidationRules<State>,
    Options extends FormOptions,
  >(formState: State, rules: Rules, options: Options = {} as Options) {
    return buildForm(formState, rules, options);
  }
})();
