import { reactive } from 'vue-demi';
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

function buildForm<State extends RecursiveRecord<State>>(
  formConfig: State,
  rules: ValidationRules<State>,
  options: FormOptions = {},
) {
  const $form = reactive({
    $invalid: false,
    $dirty: false,
    $errors: [],
    $messages: [],
    $touch: () => {},
    $reset: () => {},
    $validate: () => true,
    $pending: false,
  }) as FormInstance;

  const state = reactive(formConfig) as State;

  const paths = {} as { [key: string]: FieldValue };

  const $fields = {} as FormFieldsRecord<State>;

  function setupForm() {
    const allFields = extract<FormFieldsRecord<State>>(
      $fields,
      value => '$invalid' in value,
    ) as FieldInstance<any>[];

    $form.$touch = () => {
      allFields.forEach(field => field.$touch());
    };

    $form.$reset = () => {
      allFields.forEach(field => field.$reset());
      $form.$errors = [];
      $form.$messages = [];
      $form.$invalid = false;
      $form.$dirty = false;
      $form.$pending = false;
    };

    $form.$validate = () => {
      allFields.forEach(field => field.$validate());
      return $form.$invalid;
    };

    return $form;
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

      setByPath<FormFieldsRecord<State>, FieldInstance<typeof value>>(
        path,
        $fields,
        createField(value, fieldRules),
      );
    }
  }

  function createField<ValueType extends FieldValue>(
    value: ValueType,
    fieldValidationRules: ValidationRule<ValueType>[],
  ) {
    const field = reactive({
      value,
      $invalid: false,
      $dirty: false,
      $errors: [],
      $messages: [],
      $pending: false,
      $touch() {
        this.$dirty = true;
        $form.$dirty = true;
      },
      $reset() {
        this.$dirty = false;
        this.$errors = [];
      },
      $update(newValue: ValueType) {
        this.value = newValue;
        this.$touch();
      },
      async $validate() {
        if (options.lazy && !this.$dirty) {
          return true;
        }

        this.$errors = [];
        this.$messages = [];
        this.$invalid = false;

        for (const rule of fieldValidationRules) {
          let result = rule.test(this.value);

          if (result instanceof Promise) {
            $form.$pending = true;
            this.$pending = true;
            try {
              console.log(result);
              result = Promise.resolve(result);
            } catch (e) {
              result = false;
            } finally {
              $form.$pending = false;
              this.$pending = false;
            }
          }

          if ($form.$invalid && options.firstError) {
            return true;
          }

          if (!result) {
            const error = {
              name: rule.name,
              message:
                typeof rule.message === 'function'
                  ? rule.message(this.value)
                  : rule.message,
            };

            this.$invalid = true;
            $form.$invalid = true;

            this.$errors.push(error);
            this.$messages.push(error.message);

            if (options.firstError) {
              break;
            }
          }
        }
        $form.$errors.push(...this.$errors);
        $form.$messages = $form.$errors.map(error => error.message);
        return !this.$errors.length;
      },
    } as FieldInstance<ValueType>) as FieldInstance<ValueType>;

    return reactive(field) as FieldInstance<ValueType>;
  }

  setupFields();
  setupForm();

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
  >(formState: State, rules: Rules, options?: FormOptions) {
    return buildForm(formState, rules, options);
  }
})();
