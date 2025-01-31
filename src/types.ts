export interface FormManagerInstance<T extends Record<string, any>> {
  $form: {
    $invalid: boolean;
    $dirty: boolean;
    $errors: string[];
    $validate: () => boolean;
    $reset: () => void;
    $update: (newData: Partial<T>) => void;
    $touch: () => void;
  };
  $fields: {
    [K in keyof T]: FieldState<T[K]>;
  };
}

type ValidationMessage<T> = string | ((value: T) => string);

export interface ValidationRule<T> {
  name: string;
  message: ValidationMessage<T>;
  test: (value: T) => boolean;
}

export interface FieldState<T> {
  $invalid: boolean;
  $dirty: boolean;
  $errors: string[];
  $touch: () => void;
  $reset: () => void;
  $update: (value: T) => void;
  $validate: () => boolean;
  value: T;
}

export interface FormOptions {
  lazy?: boolean;
  autoTouch?: boolean;
}
