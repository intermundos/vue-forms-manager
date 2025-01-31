export type FormConfigPropertyType = 'primitive' | 'array' | 'group';
export type FieldValueSingle = string | number | boolean | null | undefined;
export type FieldValueArray = FieldValueSingle[];
export type FieldValue = FieldValueSingle | FieldValueArray;

export type Path<T, P extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string | number
        ? Path<T[K], `${P}${P extends '' ? '' : '.'}${K}`>
        : never;
    }[keyof T]
  : P;

export interface ValidationError {
  name: string;
  message?: string | null;
}

export type ValidationRuleTest<Value> = (
  value: Value,
) => boolean | Promise<boolean>;

export interface ValidationRule<Value extends FieldValue> {
  name: string;
  message: string | ((value: Value) => string);
  test: ValidationRuleTest<Value>;
}

export type ValidationRules<State extends Record<string, any>> = {
  [K in keyof State]?: State[K] extends FieldValue
    ? ValidationRule<State[K]>[]
    : ValidationRules<State[K]>;
};

export type RecursiveRecord<T> = {
  [K in keyof T]: T[K] extends object ? RecursiveRecord<T[K]> : T[K];
};

export interface FieldInstance<Value extends FieldValue> {
  id: string;
  $invalid: boolean;
  $dirty: boolean;
  $errors: ValidationError[];
  $messages: ValidationError['message'][];
  $touch: () => void;
  $reset: () => void;
  $update: (newValue: Value) => void;
  $validate: () => boolean | Promise<boolean>;
  value: Value;
  $pending: boolean;
}

export type FormFieldsRecord<State extends RecursiveRecord<State>> = {
  [K in keyof State]: State[K] extends FieldValue
    ? FieldInstance<State[K]>
    : FormFieldsRecord<State[K]>;
};

export interface FormOptions {
  lazy?: boolean;
  firstError?: boolean;
  validateTrigger?: 'change' | 'blur' | 'input';
}

export interface FormInstance {
  $invalid: boolean;
  $dirty: boolean;
  $errors: ValidationError[];
  $messages: string[];
  $validate: () => Promise<boolean>;
  $reset: () => void;
  $touch: () => void;
  $pending: boolean;
}
