import { field, value, form } from "./form";
import { getPath } from "./utils";

type LenseFactory<ROOT_VALUE, VALUE = ROOT_VALUE> = <KEY extends keyof VALUE>(
  key: KEY
) => Lense<ROOT_VALUE, VALUE[KEY]>;

export type Lense<ROOT_VALUE, VALUE extends any> = {
  field: (form: form.Form<ROOT_VALUE>) => field.Of<VALUE>;
  value: (value: ROOT_VALUE) => VALUE;
  path: string;
} & (VALUE extends value.Object | value.Array
  ? {
      get: LenseFactory<ROOT_VALUE, VALUE>;
    }
  : {});

export function lense<ROOT_VALUE extends value.Object, VALUE = ROOT_VALUE>(
  path: (string | number)[] = []
): Lense<ROOT_VALUE, ROOT_VALUE> {
  const lenseMemory = new Map<keyof VALUE, any>();
  const get = <KEY extends keyof VALUE & (string | number)>(key: KEY) => {
    if (!lenseMemory.has(key)) {
      const fullPath = [...path, key];
      lenseMemory.set(key, {
        field: (form: form.Form<ROOT_VALUE>) => {
          const formPath = fullPath.flatMap((prop) => ["children", prop]);
          return getPath(form.root, formPath);
        },
        value: (value: ROOT_VALUE) => {
          return getPath(value, fullPath);
        },
        get: lense<ROOT_VALUE, VALUE[KEY]>([...path, key] as any).get,
        path: fullPath.reduce((path, segment) => {
          if (typeof segment === "number") {
            return `${path}[${segment}]`;
          } else {
            const prefix = path === "" ? "" : ".";
            return `${path}${prefix}${segment}`;
          }
        }),
      } as any);
    }
    return lenseMemory.get(key);
  };
  return {
    get: get,
    field: (form: form.Form<ROOT_VALUE>) => form.root,
    value: (value: ROOT_VALUE) => value,
    path: "",
  } as any;
}
