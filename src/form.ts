import { invariant, get_path } from "./utils"

export const enum TYPE {
    SIMPLE = 'simple',
    OBJECT = 'object',
    ARRAY = 'array'
}

export namespace value {
    export type Simple = any
    export type Array = any[]
    export type Object = { [s:string]: any }
    export type Any = Simple | Array | Object
}

export type Validate<VALUE> = (value:VALUE) => Promise<string[]>|string[]

export namespace field {
    interface Base<VALUE> {
        id: string,
        touched: boolean,
        dirty: boolean,
        errors: string[]
        parent_id?: string
        validate?: Validate<VALUE>,
        validable: boolean
        is_valid: boolean
    }

    export interface Simple<VALUE extends value.Simple> extends Base<VALUE> {
        type: TYPE.SIMPLE
        value: VALUE;
    }

    export interface Object<VALUE extends value.Object> extends Base<VALUE>  {
        type: TYPE.OBJECT
        children: {
            [name in keyof VALUE & string]: field.Of<VALUE[name]>
        }
    }

    export interface Array<VALUE extends value.Array> extends Base<VALUE>  {
        type: TYPE.ARRAY
        children: field.Of<VALUE[number]>[]
    }

    export type Of<VALUE> =
        VALUE extends value.Array ? field.Array<VALUE> :
        VALUE extends value.Object ? field.Object<VALUE> :
        VALUE extends value.Simple ? field.Simple<VALUE> :
        never

    export type Multi = Of<value.Array|value.Object>

    export type Any = Of<any>
}

export type Form<VALUE extends value.Object> = {
    id: number,
    root: field.Object<VALUE>
    index: { [s:string]: field.Any }
}

let counter = 0;
function simple_field<VALUE extends value.Simple>(value:VALUE, parent_id?:string): field.Simple<VALUE> {
    return {
        type: TYPE.SIMPLE,
        id: String(counter++),
        touched: false,
        dirty: false,
        value,
        errors: [],
        parent_id,
        validable: true,
        is_valid: true
    }
}


function object_field<VALUE extends value.Object>(value:VALUE, parent_id?:string): field.Object<VALUE> {
    const id = String(counter++);
    return {
        type: TYPE.OBJECT,
        id,
        touched: false,
        dirty: false,
        children: Object.entries(value).reduce((children, [key, value]) => {
            children[key] = field_of(value, id);
            return children;
        }, {} as any),
        errors: [],
        parent_id,
        validable: true,
        is_valid: true
    }
}


function array_field<VALUE extends value.Array>(value:VALUE, parent_id?:string): field.Array<VALUE> {
    const id = String(counter++);
    return {
        type: TYPE.ARRAY,
        id,
        touched: false,
        dirty: false,
        children: value.map(value => field_of(value, id)) as any,
        errors: [],
        parent_id,
        validable: true,
        is_valid: true
    }
}


function field_of<VALUE>(value:VALUE, parent_id?:string): field.Of<VALUE> {
    if (Array.isArray(value)) {
        return array_field(value, parent_id) as any;
    } else if (typeof value === 'object') {
        return object_field(value, parent_id) as any;
    } else {
        return simple_field(value, parent_id) as any;
    }
}

export function value_of<VALUE>(field:field.Of<VALUE>): VALUE {
    const any_field = field as field.Any
    switch(any_field.type) {
        case TYPE.ARRAY: {
            return any_field.children.map(field => {
                return value_of(field)
            }) as any
        }
        case TYPE.OBJECT: {
            return Object.entries(any_field.children).reduce((mapped, [key, field]) => {
                mapped[key] = value_of(field);
                return mapped;
            }, {} as any)
        }
        case TYPE.SIMPLE: {
            return any_field.value;
        }
    }
}

export function is_valid<VALUE>(field:field.Of<VALUE>): boolean {
    const any_field = field as field.Any
    switch (any_field.type) {
        case TYPE.ARRAY: {
            return any_field.errors.length === 0 && any_field.children.every(field => {
                return is_valid(field)
            })
        }
        case TYPE.OBJECT: {
            return any_field.errors.length === 0 && Object.values(any_field.children).every(field => {
                return is_valid(field)
            })
        }
        case TYPE.SIMPLE: {
            return any_field.errors.length === 0;
        }
    }
}


export function Form<VALUE>(initialValue:VALUE, validate?:Validate<VALUE>): Form<VALUE> {
    const root = object_field<VALUE>(initialValue);
    root.validate = validate;

    const index: { [s:string]: field.Any } = {}
    visit_down(root, (field) => {
        index[field.id] = field
    })

    return {
        id: 0,
        root,
        index
    }
}

type DiveEntry = {
    field:field.Any,
    path:(string|number)[],
    parent?:
        | { field:field.Array<any>, key: number }
        | { field:field.Object<any>, key: string } }

function dive(field:field.Any, map:(field:field.Any, relative_path:(string|number)[]) => field.Any) {
    let queue: DiveEntry[] = [{field, path:[] }];
    let current: DiveEntry|undefined;
    let root: field.Any|undefined = undefined;
    while ((current = queue.pop()) !== undefined) {
        const next_field = map(current.field, current.path);
        invariant(next_field.type === current.field.type, "Tried to change the type of a field")

        if (next_field.type === TYPE.ARRAY) {
            for (let i = 0, l = next_field.children.length; i < l ; i++) {
                queue.push({
                    field:next_field.children[i],
                    path: [...current.path, i],
                    parent: {
                        field: next_field,
                        key: i,
                    }
                })
            }
        } else if (next_field.type === TYPE.OBJECT) {
            for (const key in next_field.children) {
                queue.push({
                    field: next_field.children[key],
                    path: [...current.path, key],
                    parent: {
                        field: next_field,
                        key,
                    }
                })
            }
        }

        if (current.parent !== undefined) {
            if (typeof current.parent.key === 'string') {
                invariant(current.parent.field.type === TYPE.OBJECT)
                current.parent.field.children[current.parent.key] = next_field
            } else {
                invariant(current.parent.field.type === TYPE.ARRAY)
                current.parent.field.children[current.parent.key] = next_field
            }
        } else {
            invariant(root === undefined, 'found two root during field mutate')
            root = next_field
        }
    }

    invariant(root !== undefined, 'found no root during field mutate')
    return root
}

function rise<VALUE>(form:Form<VALUE>, next_field:field.Any, map:(field:field.Multi) => field.Multi): Form<VALUE>['root'] {
    let current = next_field;
    let next_current = next_field
    let parent: field.Any|undefined;
    while ((parent = get_field(form, current.parent_id)) !== undefined) {
        invariant(parent.type !== TYPE.SIMPLE, "Found a simple field as a parent")

        switch (parent.type) {
            case TYPE.OBJECT: {
                const next_parent = map(parent)
                invariant(next_parent.type === TYPE.OBJECT, "Tried to change the type of a field")
                const children = parent.children
                const name = Object.keys(children).find(key => children[key].id === next_current.id)
                invariant(name !== undefined, "Tried to update a field that is not in it's parent")

                next_parent.children[name] = next_current
                next_current = next_parent;
            } break;
            case TYPE.ARRAY: {
                const next_parent = map(parent)
                invariant(next_parent.type === TYPE.ARRAY, "Tried to change the type of a field")
                const children = parent.children
                const index = children.findIndex(field => field.id === next_current.id)
                invariant(index !== -1, "Tried to update a field that is not in it's parent")

                next_parent.children[index] = next_current
                next_current = next_parent;
            } break;
        }

        current = parent;
    }
    return next_current as Form<VALUE>['root']
}

type DiveUpdatePattern = {
    simple: <FIELD extends field.Simple<value.Simple>>(field:FIELD, path:(string|number)[]) => FIELD,
    object: <FIELD extends field.Object<value.Object>>(field:FIELD) => FIELD,
    array: <FIELD extends field.Array<value.Array>>(field:FIELD) => FIELD,
}

type RiseUpdatePattern = Partial<Omit<DiveUpdatePattern, 'simple'>>

const dive_update :DiveUpdatePattern= {
    simple: field => field,
    object: field => field,
    array: field => field
}

const rise_update: RiseUpdatePattern ={
    object: field => clone(field),
    array: field => clone(field)
}

function update<VALUE, TARGET>(form:Form<VALUE>, field:field.Of<TARGET>, dive_pattern:DiveUpdatePattern, rise_pattern:RiseUpdatePattern = {}): Form<VALUE> {
    const index: { [s:string]: field.Any } = {}

    const next_field = dive(field, (field, path) => {
        switch (field.type) {
            case TYPE.OBJECT: {
                const next_field = dive_pattern.object(field)
                index[field.id] = next_field;
                return next_field;
            }
            case TYPE.ARRAY: {
                const next_field = dive_pattern.array(field)
                index[field.id] = next_field;
                return next_field;
            }
            case TYPE.SIMPLE: {
                const next_field = dive_pattern.simple(field, path)
                index[field.id] = next_field;
                return next_field;
            }
        }
    })

    const root = rise(form, next_field, (field) => {
        switch (field.type) {
            case TYPE.OBJECT: {
                const next_field = (rise_pattern.object||dive_pattern.object)(field)
                index[field.id] = next_field;
                return next_field;
            }
            case TYPE.ARRAY: {
                const next_field = (rise_pattern.array||dive_pattern.array)(field)
                index[field.id] = next_field;
                return next_field;
            }
        }
    })

    return {
        id: form.id + 1,
        root,
        index: {
            ...form.index,
            ...index
        }
    }
}

function clone<FIELD extends field.Any>(field:FIELD, added:Partial<field.Any> = {}): FIELD {
    switch (field.type) {
        case TYPE.SIMPLE: {
            const simple_field = field as field.Simple<any>
            return {
                ...simple_field,
                ...added,
            } as FIELD
        }
        case TYPE.ARRAY: {
            const array_field = field as field.Array<any>
            return {
                ...array_field,
                ...added,
                children : [ ...array_field.children ]
            } as FIELD
        }
        case TYPE.OBJECT: {
            const object_field = field as field.Object<any>
            return {
                ...object_field,
                ...added,
                children : { ...object_field.children }
            } as FIELD
        }
    }
}

export function change<VALUE, CHANGED>(form:Form<VALUE>, field:field.Of<CHANGED>, value:CHANGED): Form<VALUE> {
    return update(form, field, {
        array: (field) => {
            return clone(field, { dirty:true })
        },
        object: (field) => {
            return clone(field, { dirty:true })
        },
        simple: (field, path) => {
            return clone(field, { dirty:true, value: get_path(value, path) })
        },
    })
}

export async function validate<VALUE, VALIDATED>(form:Form<VALUE>, field:field.Of<VALIDATED>) {
    const validation_promises: Promise<any>[] = [];

    function _validate<FIELD extends field.Any>(field:FIELD): FIELD  {
        const next_field = clone(field)
        validation_promises.push(validate_field(next_field))
        return next_field;
    }

    const next_form = update(form, field, {
        array: _validate,
        object: _validate,
        simple: _validate,
    })

    await Promise.all(validation_promises);

    return next_form;
}

export function validable<VALUE>(form:Form<VALUE>, field:field.Any, validable:boolean): Form<VALUE> {
    const next_field = {
        ...field,
        errors: validable ? field.errors : [],
        validable
    }

    return update(form, next_field, dive_update, rise_update)

}

export function touch<VALUE>(form:Form<VALUE>, field:field.Any): Form<VALUE> {
    function _validate<FIELD extends field.Any>(field:FIELD): FIELD  {
        return clone(field, { touched: true });
    }
    return update(form, field, {
        simple: _validate,
        object: _validate,
        array: _validate
    })
}

export function push<VALUE, PUSHED>(form:Form<VALUE>, field:field.Array<PUSHED[]>, value:PUSHED): [Form<VALUE>, number] {
    const pushed_field = field_of(value, field.id);

    const next_field:field.Array<PUSHED[]> = {
        ...field,
        children: [
            ...field.children,
            pushed_field
        ]
    }

    const next_form = update(form, next_field, dive_update, rise_update)

    return [next_form, next_field.children.length]
}

export function swap<VALUE>(form:Form<VALUE>, field:field.Array<value.Array>, index_a:number, index_b:number): Form<VALUE> {
    const first_index = Math.min(index_a, index_b);
    const last_index = Math.max(index_a, index_b);
    const next_field:field.Array<value.Array> = {
        ...field,
        children: [
            ...field.children.slice(0, first_index),
            field.children[last_index],
            ...field.children.slice(first_index + 1, last_index),
            field.children[first_index],
            ...field.children.slice(last_index + 1)
        ]
    }

    return update(form, next_field, dive_update, rise_update)
}

export function move<VALUE>(form:Form<VALUE>, field:field.Array<value.Array>, from:number, to:number): Form<VALUE> {
    const next_children = [...field.children]
    next_children.splice(to, 0, next_children.splice(from, 1)[0])
    const next_field:field.Array<value.Array> = {
        ...field,
        children: next_children
    }

    return update(form, next_field, dive_update, rise_update)
}

export function insert<VALUE, INSERTED>(form:Form<VALUE>, field:field.Array<INSERTED[]>, value:INSERTED, index:number): [Form<VALUE>, number] {
    const inserted_field = field_of(value, field.id);

    const next_field:field.Array<INSERTED[]> = {
        ...field,
        children: [
            ...field.children.slice(0, index),
            inserted_field,
            ...field.children.slice(index),
        ]
    }

    const next_form = update(form, next_field, dive_update, rise_update)

    return [next_form, next_field.children.length]
}

export function unshift<VALUE, UNNSHIFTED>(form:Form<VALUE>, field:field.Array<UNNSHIFTED[]>, value:UNNSHIFTED): [Form<VALUE>, number] {
    const unshifted_field = field_of(value, field.id);

    const next_field:field.Array<UNNSHIFTED[]> = {
        ...field,
        children: [
            unshifted_field,
            ...field.children,
        ]
    }

    const next_form = update(form, next_field, dive_update, rise_update)

    return [next_form, next_field.children.length]
}

export function remove<VALUE, REMOVED>(form:Form<VALUE>, field:field.Array<REMOVED[]>, index:number): [Form<VALUE>, field.Of<REMOVED>] {
    const removed_field = field.children[index]

    const next_field:field.Array<REMOVED[]> = {
        ...field,
        children: [
            ...field.children.slice(0, index),
            ...field.children.slice(index + 1)
        ]
    }

    const next_form = update(form, next_field, dive_update, rise_update)

    visit_down(removed_field, field => {
        delete next_form.index[field.id]
    })

    return [next_form, removed_field]
}

export function pop<VALUE, POPED>(form:Form<VALUE>, field:field.Array<POPED[]>): [Form<VALUE>, field.Of<POPED>] {
    const poped_field = field.children[field.children.length - 1]

    const next_field:field.Array<POPED[]> = {
        ...field,
        children: [
            ...field.children.slice(0, -1),
        ]
    }

    const next_form = update(form, next_field, dive_update, rise_update)

    visit_down(poped_field, field => {
        delete next_form.index[field.id]
    })

    return [next_form, poped_field]
}















function visit_down(field:field.Any, callback:(field:field.Any) => void): void {
    let queue = [field];
    let current: field.Any|undefined;
    while ((current = queue.pop()) !== undefined) {
        if (current.type === TYPE.ARRAY) {
            queue.push(...current.children)
        }
        if (current.type === TYPE.OBJECT) {
            queue.push(...Object.values(current.children))
        }
        callback(current)
    }
}

function get_field(form:Form<any>, id?:string): field.Any|undefined {
    if (id === undefined) {
        return undefined
    }
    return form.index[id]
}

export function assert_structure({ root, index }:Form<any>) {
    visit_down(root, field => {
        invariant(index[field.id] === field, `field in tree should be the same as field in index (${field.id})`);
        if (field.type === 'object') {
            Object.values(field.children).forEach(child => {
                invariant(child.parent_id === field.id, "child reference to parent don't match")
            })
        }
        if (field.type === 'array') {
            field.children.forEach(child => {
                invariant(child.parent_id === field.id, "child reference to parent don't match")
            })
        }
    })
}

async function validate_field(field:field.Any): Promise<void> {
    if (field.validable && field.validate) {
        const errors = await field.validate(value_of(field))
        field.errors = errors;
    }
}







