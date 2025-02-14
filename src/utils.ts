import type { FieldValue, FormConfigPropertyType, Path } from './types';

export function* traverseFormStructure<
  State extends Record<string, any>,
  P extends Path<keyof State | ''>,
>(
  obj: State,
  path: P,
): Generator<
  {
    path: P;
    value: FieldValue;
    type: FormConfigPropertyType;
  },
  void,
  undefined
> {
  for (const key in obj) {
    const field = (obj as State)[key as keyof State];
    const currentPath = path ? `${path}.${key}` : key;
    const type = Object.prototype.toString.call(field);

    if (Array.isArray(field)) {
      yield {
        path: currentPath as P,
        value: field as FieldValue,
        type: 'array',
      };
    } else if (type === '[object Object]' && !Array.isArray(field)) {
      yield* traverseFormStructure(field as any, currentPath as P); // Recursively yield nested objects
    } else {
      yield {
        path: currentPath as P,
        value: field as FieldValue,
        type: 'primitive',
      };
    }
  }
}

export function extract<T extends Record<string, any>>(
  object: T,
  condition: (value: any) => boolean,
) {
  const result: any[] = [];

  function traverse(obj: T) {
    for (const key in obj) {
      const value = obj[key];

      if (condition(value)) {
        result.push(value);
      } else {
        traverse(value);
      }
    }
  }

  traverse(object);
  return result as T[keyof T][];
}

export function getInPath<T extends Record<string, any>>(
  obj: T,
  path: string,
): any {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj as any);
}

export function setByPath<T extends Record<string, any>, Value>(
  path: string,
  obj: T,
  value: Value,
): void {
  const keys = path.split('.');
  let current: any = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}
