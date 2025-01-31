import { reactive } from 'vue-demi';
import type {
  FieldState,
  FormManagerInstance,
  FormOptions,
  ValidationRule,
} from './types';

class FormInstance<T extends Record<string, any>>
  implements FormManagerInstance<T>
{
  private readonly initialData: T;
  private readonly formData: T;
  private rules: { [K in keyof T]: Array<ValidationRule<T[K]>> };
  private options: FormOptions;
  private dirtyFields = new Set<keyof T>();
  private formErrors: string[] = [];

  public $form: FormManagerInstance<T>['$form'];
  public $fields: FormManagerInstance<T>['$fields'];

  constructor(
    data: T,
    rules: { [K in keyof T]: Array<ValidationRule<T[K]>> },
    options: FormOptions = {},
  ) {
    this.initialData = reactive({ ...data }) as T;
    this.formData = reactive(data) as T;
    this.rules = rules;
    this.options = options;

    this.$fields = {} as FormManagerInstance<T>['$fields'];
    this.$form = {} as FormManagerInstance<T>['$form'];

    this.setupForm();
    this.setupFields();
  }

  private setupForm() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const keys = Object.keys(this.formData) as Array<keyof T>;

    this.$form = {
      get $dirty() {
        return Object.values(self.$fields).some(field => field.$dirty);
      },
      get $invalid() {
        return Object.values(self.$fields).some(field => field.$invalid);
      },
      get $errors() {
        return self.formErrors;
      },
      $validate: () => {
        return keys
          .map(field => this.$fields[field].$validate())
          .every(result => result);
      },
      $reset: () => {
        keys.forEach(field => {
          this.$fields[field].$reset();
        });
      },
      $update: (newData: Partial<T>) => {
        Object.assign(this.formData, newData);
        Object.assign(this.initialData, newData);
      },
      $touch: () => {
        keys.forEach(field => {
          this.$fields[field].$touch();
        });
      },
    };
  }

  private updateFormErrors() {
    this.formErrors.length = 0;
    Object.values(this.$fields).forEach(field => {
      this.formErrors.push(...field.$errors);
    });
  }

  private setupFields() {
    (Object.keys(this.formData) as Array<keyof T>).forEach(field => {
      this.$fields[field] = this.createFieldState(field);
    });
  }

  private createFieldState<K extends keyof T>(field: K): FieldState<T[K]> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    const fieldState = reactive({
      $invalid: false,
      $dirty: false,
      $errors: [],
      $touch: () => self.markAsDirty(field),
      $reset: () => {
        self.formData[field] = self.initialData[field];
        self.dirtyFields.delete(field);
        fieldState.$dirty = false;
        fieldState.$errors = [];
        fieldState.$invalid = false;
      },
      $update: (value: T[K]) => {
        self.formData[field] = value;
        if (!self.options.lazy) self.validateField(field);
      },
      $validate: () => self.validateField(field),
      get value() {
        return self.formData[field];
      },
      set value(val: T[K]) {
        self.formData[field] = val;
        if (!self.options.lazy) self.validateField(field);
        if (self.options.autoTouch) self.markAsDirty(field);
      },
    }) as FieldState<T[K]>;

    return fieldState;
  }

  private markAsDirty(field: keyof T) {
    if (!this.dirtyFields.has(field)) {
      this.dirtyFields.add(field);
      this.$fields[field].$dirty = true;
    }
  }

  private validateField(field: keyof T): boolean {
    const value = this.formData[field];
    const fieldEntry = this.$fields[field];
    fieldEntry.$errors = [];

    this.rules[field].forEach(rule => {
      if (!rule.test(value)) {
        const message =
          typeof rule.message === 'function'
            ? rule.message(value)
            : rule.message;
        fieldEntry.$errors.push(`${rule.name}: ${message}`);
      }
    });

    fieldEntry.$invalid = fieldEntry.$errors.length > 0;
    this.updateFormErrors();
    return !fieldEntry.$invalid;
  }
}

export class FormManager {
  buildForm<T extends Record<string, unknown>>(
    data: T,
    rules: { [K in keyof T]: Array<ValidationRule<T[K]>> },
    options?: FormOptions,
  ): FormManagerInstance<T> {
    return new FormInstance(data, rules, options);
  }
}
