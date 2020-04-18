import { field, value, Form } from "./form"
import { get_path } from "./utils"

type LenseFactory<ROOT_VALUE extends value.Object, VALUE = ROOT_VALUE> = <KEY extends keyof VALUE> (key:KEY) => Lense<ROOT_VALUE, VALUE[KEY]>

export type Lense<ROOT_VALUE extends value.Object, VALUE extends any> = {
    field: (form:Form<ROOT_VALUE>) => field.Of<VALUE>,
    value: (value:ROOT_VALUE) => VALUE,
    path: string,
} & (VALUE extends value.Object|value.Array ? {
    get: LenseFactory<ROOT_VALUE, VALUE>
} : {})

export function lense<ROOT_VALUE extends value.Object, VALUE = ROOT_VALUE>(path:(string|number)[] = []): Lense<ROOT_VALUE, ROOT_VALUE> {
    const lenseMemory = new Map<keyof VALUE, any>()
    const get = <KEY extends keyof VALUE & (string|number)> (key:KEY) => {
        if (!lenseMemory.has(key)) {
            const full_path = [...path, key]
            lenseMemory.set(key, {
                field : (form:Form<ROOT_VALUE>) => {
                    const real_path = full_path.flatMap(prop => ['children', prop])
                    return get_path(form.root, real_path, `can't find path "${full_path.join('.')}" in form`);
                },
                value: (value:ROOT_VALUE) => {
                    return get_path(value, full_path, `can't find path "${full_path.join('.')}" in form`);
                },
                get: lense<ROOT_VALUE, VALUE[KEY]>([...path, key] as any).get,
                path: full_path.reduce((path, segment) => {
                    if (typeof segment === 'number') {
                        return `${path}[${segment}]`
                    } else {
                        const prefix = path === '' ? '' : '.'
                        return `${path}${prefix}${segment}`
                    }
                })
            } as any)
        }
        return lenseMemory.get(key)
    }
    return {
        get: get,
        field: (form:Form<ROOT_VALUE>) => form.root,
        value: (value: ROOT_VALUE) => value,
        path: ''
    } as any;
}
