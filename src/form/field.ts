import * as _value from "./value";
import { TYPE } from "./fieldtype";
import { Validate } from "./types";

interface Base<TYPE> {
  id: string;
  touched: boolean;
  dirty: boolean;
  errors: string[];
  parentId?: string;
  validable: boolean;
  valid: boolean;
}

export interface Simple<TYPE extends _value.Simple = _value.Simple>
  extends Base<TYPE> {
  type: TYPE.SIMPLE;
  validate?: Validate<TYPE>;
  value: TYPE;
}

export interface Object<TYPE extends _value.Object = _value.Object>
  extends Base<TYPE> {
  type: TYPE.OBJECT;
  validate?: Validate<TYPE>;
  value: TYPE;
  children: {
    [name in keyof TYPE & string]: Of<TYPE[name]>;
  };
}

export interface Array<TYPE extends _value.Array = _value.Array>
  extends Base<TYPE> {
  type: TYPE.ARRAY;
  validate?: Validate<TYPE>;
  value: TYPE;
  children: Of<TYPE[number]>[];
}

export type Of<TYPE> = TYPE extends _value.Array
  ? Array<TYPE>
  : TYPE extends _value.Object // eslint-disable-next-line @typescript-eslint/ban-types
  ? Object<TYPE>
  : TYPE extends _value.Simple
  ? Simple<TYPE>
  : never;

export type Multi<TYPE extends _value.Multi = _value.Multi> = Of<TYPE>;

export type Any<TYPE extends _value.Any = _value.Any> = Of<TYPE>;

export type Value<FIELD extends Any> = FIELD extends Array<infer TYPE>
  ? TYPE // eslint-disable-next-line @typescript-eslint/ban-types
  : FIELD extends Object<infer TYPE>
  ? TYPE
  : FIELD extends Simple<infer TYPE>
  ? TYPE
  : never;

let counter = 0;

export function simple<VALUE extends _value.Simple>(
  value: VALUE,
  parentId?: string
): Simple<VALUE> {
  return {
    type: TYPE.SIMPLE,
    id: String(counter++),
    touched: false,
    dirty: false,
    value,
    errors: [],
    parentId,
    validable: true,
    valid: true,
  };
}

export function object<VALUE extends _value.Object>(
  value: VALUE,
  parentId?: string
  // eslint-disable-next-line @typescript-eslint/ban-types
): Object<VALUE> {
  const id = String(counter++);
  return {
    type: TYPE.OBJECT,
    id,
    touched: false,
    dirty: false,
    value,
    children: Object.entries(value).reduce((children, [key, value]) => {
      children[key] = of(value, id);
      return children;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as any),
    errors: [],
    parentId,
    validable: true,
    valid: true,
  };
}

export function array<VALUE extends _value.Array>(
  value: VALUE,
  parentId?: string
): Array<VALUE> {
  const id = String(counter++);
  return {
    type: TYPE.ARRAY,
    id,
    touched: false,
    dirty: false,
    value,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: value.map((value) => of(value, id)) as any,
    errors: [],
    parentId,
    validable: true,
    valid: true,
  };
}

export function of<VALUE>(value: VALUE, parentId?: string): Of<VALUE> {
  if (Array.isArray(value)) {
    return array(value, parentId) as Of<VALUE>;
  } else if (typeof value === "object") {
    return object(value, parentId) as Of<VALUE>;
  } else {
    return simple(value, parentId) as Of<VALUE>;
  }
}

export function value<FIELD extends Any>(field: FIELD): Value<FIELD> {
  const anyField = field as Any;
  switch (anyField.type) {
    case TYPE.ARRAY: {
      return anyField.children.map((field) => {
        return value(field);
      }) as Value<FIELD>;
    }
    case TYPE.OBJECT: {
      return Object.entries(anyField.children).reduce(
        (mapped, [key, field]) => {
          mapped[key] = value(field);
          return mapped;
        },
        {} as Value<FIELD>
      );
    }
    case TYPE.SIMPLE: {
      return anyField.value as Value<FIELD>;
    }
  }
}

export function validity<FIELD extends Any>(field: FIELD): boolean {
  const anyField = field as Any;
  switch (anyField.type) {
    case TYPE.ARRAY: {
      return (
        anyField.errors.length === 0 &&
        anyField.children.every((field) => {
          return validity(field);
        })
      );
    }
    case TYPE.OBJECT: {
      return (
        anyField.errors.length === 0 &&
        Object.values(anyField.children).every((field) => {
          return validity(field);
        })
      );
    }
    case TYPE.SIMPLE: {
      return anyField.errors.length === 0;
    }
  }
}
