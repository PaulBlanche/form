import * as React from 'react'
import * as form from './form'
import { Lense, lense } from './lense'
import * as yup from 'yup'

type State<VALUE extends form.value.Object> = {
    /** current form */
    form: form.Form<VALUE>
    submit_count: number,
    status: {
        /** wheter the validation is running */
        validating: boolean
        submiting: boolean
    }
}

const enum ACTION {
    CHANGE,
    BLUR,
    VALIDATE_START,
    VALIDATE_DONE,
    SUBMIT_START,
    SUBMIT_DONE,
    ARRAY,
    VALIDABLE,
}

type ChangeAction<VALUE> = {
    type: ACTION.CHANGE,
    form: form.Form<VALUE>
}

type BlurAction<VALUE> = {
    type: ACTION.BLUR,
    form: form.Form<VALUE>
}

type ValidateStart = {
    type: ACTION.VALIDATE_START,
}

type ValidateDone<VALUE> = {
    type: ACTION.VALIDATE_DONE,
    for_id: number,
    form: form.Form<VALUE>
}

type SubmitStart = {
    type: ACTION.SUBMIT_START,
}

type SubmitDone = {
    type: ACTION.SUBMIT_DONE,
}

type ArrayAction<VALUE> = {
    type: ACTION.ARRAY,
    form: form.Form<VALUE>
}

type ValidableAction = {
    type: ACTION.VALIDABLE,
    field: form.field.Any
    validable: boolean,
}

type Action<VALUE> =
    | ChangeAction<VALUE>
    | BlurAction<VALUE>
    | ValidateStart
    | ValidateDone<VALUE>
    | SubmitStart
    | SubmitDone
    | ArrayAction<VALUE>
    | ValidableAction

type Reducer<VALUE> = (state:State<VALUE>, action: Action<VALUE>) => State<VALUE>
function reducer<VALUE extends form.value.Object>(state:State<VALUE>, action: Action<VALUE>): State<VALUE> {
    switch (action.type) {
        case ACTION.CHANGE: {
            if (state.status.submiting) {
                console.error("Cannot udpate the form during a submit.")
                return state;
            }
            return {
                ...state,
                form: action.form,
            }
        }
        case ACTION.BLUR: {
            if (state.status.submiting) {
                console.error("Cannot udpate the form during a submit.")
                return state;
            }
            return {
                ...state,
                form: action.form,
            }
        }
        case ACTION.VALIDATE_START: {
            return {
                ...state,
                status: {
                    ...state.status,
                    validating: true
                }
            }
        }
        case ACTION.VALIDATE_DONE: {
            if (state.form.id !== action.for_id) {
                return {
                    ...state,
                    status: {
                        ...state.status,
                        validating: false,
                    }
                };
            }
            return {
                ...state,
                form: action.form,
                status: {
                    ...state.status,
                    validating: false
                }
            }
        }
        case ACTION.SUBMIT_START: {
            return {
                ...state,
                submit_count: state.submit_count + 1,
                status: {
                    ...state.status,
                    submiting: true,
                }
            };
        }
        case ACTION.SUBMIT_DONE: {
            return {
                ...state,
                status: {
                    ...state.status,
                    submiting: false,
                }
            };
        }
        case ACTION.ARRAY: {
            if (state.status.submiting) {
                console.error("Cannot udpate the form during a submit.")
                return state;
            }
            return {
                ...state,
                form: action.form,
            }
        }
        case ACTION.VALIDABLE: {
            if (state.status.submiting) {
                console.error("Cannot udpate the form during a submit.")
                return state;
            }
            return {
                ...state,
                form: form.validable(state.form, action.field, action.validable),
            }
        }
    }
}

type BaseField<VALUE> = {
    onChange: (value: VALUE) => void,
    onBlur: () => void,
    value: () => VALUE,
    valid: () => boolean
}

export type SimpleField<VALUE extends form.value.Simple> = BaseField<VALUE> & {
    meta: form.field.Simple<VALUE>,
}

export type ObjectField<VALUE extends form.value.Object> = BaseField<VALUE> & {
    meta: form.field.Object<VALUE>,
    get: Lense<any, VALUE>['get']
}

export type ArrayField<VALUE extends form.value.Array> = BaseField<VALUE> &{
    map: <MAPPED>(callback:(index:number, array:number[]) => MAPPED) => MAPPED[],
    meta: form.field.Array<VALUE>,
    get: Lense<any, VALUE>['get'],
    array: {
        push: (value: VALUE[number]) => void,
        swap: (index_a: number, index_b: number) => void,
        move: (from: number, to: number ) => void,
        insert: (value: VALUE[number], index: number) => number,
        unshift: (value: VALUE[number]) => number,
        remove: (index:number) => VALUE[number],
        pop: () => VALUE[number]
    }
}

export type FieldOf<VALUE> =
    VALUE extends form.value.Array ? ArrayField<VALUE> :
    VALUE extends form.value.Object ? ObjectField<VALUE> :
    VALUE extends form.value.Simple ? SimpleField<VALUE> :
    never

export type FieldOptions<VALUE, FIELD_VALUE> = {
    validable?: boolean
    validate?: form.Validate<FIELD_VALUE>,
    field_strategy?: Partial<FieldStrategy<VALUE>>
}

export type UseForm<VALUE extends form.value.Object> = FieldOf<VALUE> & {
    submit: (event: React.FormEvent) => Promise<void>
    useField: <FIELD_VALUE>(lense:Lense<VALUE, FIELD_VALUE>, options?: FieldOptions<VALUE, FIELD_VALUE>) => FieldOf<FIELD_VALUE>;
}

type VoidStrategy<VALUE> = (validate:() => Promise<form.Form<VALUE>>) => void;
type BlurStrategy<VALUE> = (validate:() => Promise<form.Form<VALUE>>) => void;
type SubmitStrategy<VALUE> = (validate:() => Promise<form.Form<VALUE>>) => Promise<form.Form<VALUE>|undefined>;
type Strategy<VALUE> = {
    change: VoidStrategy<VALUE>,
    blur: VoidStrategy<VALUE>,
    submit: SubmitStrategy<VALUE>,
}

type FieldStrategy<VALUE> = {
    change: VoidStrategy<VALUE>,
    blur: VoidStrategy<VALUE>,
}

export const STRATEGY = {
    NOT: () => {},
    IMMEDIATE: <VALUE>(validate: () => Promise<form.Form<VALUE>>) => { validate() },
    DEBOUNCED: (timeout: number) => {
        let handler:any = null
        return <VALUE> (validate:() => Promise<form.Form<VALUE>>) => {
            clearTimeout(handler)
            handler = setTimeout(() => {
                validate()
                handler = null;
            }, timeout)

        }
    }
}

export function useForm<VALUE extends form.value.Object>(initial_values: VALUE, submit: (value: VALUE) => void, schema?:yup.Schema<VALUE>, validate?: form.Validate<VALUE>, form_strategy: Partial<Strategy<VALUE>> = {}): UseForm<VALUE> {
    const [state, dispatch] = React.useReducer<Reducer<VALUE>, VALUE>(reducer, initial_values, (initial_values) => {
        return {
            form: form.Form(initial_values),
            id: 0,
            submit_count: 0,
            status: {
                submiting: false,
                validating: false,
            }
        }
    })

    const stateRef = React.useRef(state)
    stateRef.current = state;

    const rootLense = React.useMemo(() => lense<VALUE>(), []);

    return {
        ...field(rootLense, {
            validate: make_field_validate(validate, schema),
            field_strategy:
            form_strategy
        }),
        submit: React.useCallback((event: React.FormEvent) => {
            event.preventDefault()
            return submit_form(form_strategy.submit||((validate) => validate()))
        }, []),
        useField: React.useCallback(field, [])
    }

    function field<FIELD_VALUE>(lense:Lense<VALUE, FIELD_VALUE>, { field_strategy = {}, validable = true, validate }: FieldOptions<VALUE, FIELD_VALUE> = {}): FieldOf<FIELD_VALUE> {
        const field = lense.field(stateRef.current.form)
        if (!field.validate) {
            console.log(schema && yup.reach(schema, lense.path))
            field.validate = make_field_validate(validate, schema && (yup.reach(schema, lense.path) as unknown as yup.Schema<FIELD_VALUE>));
        }

        React.useEffect(() => {
            if (field.validable !== validable) {
                dispatch({ type: ACTION.VALIDABLE, field: field, validable })
            }
        }, [validable])

        const strategy: FieldStrategy<VALUE> = React.useMemo(() => ({
            change:  field_strategy.change || form_strategy.change || STRATEGY.DEBOUNCED(400),
            blur:  field_strategy.blur || form_strategy.blur || STRATEGY.IMMEDIATE
        }), [])

        return React.useMemo(() => {
            switch (field.type) {
                case form.TYPE.ARRAY: {
                    return arrayField(lense as any, field as any, strategy) as any
                }
                case form.TYPE.OBJECT: {
                    return objectField(lense as any, field as any, strategy) as any
                }
                case form.TYPE.SIMPLE: {
                    return simpleField(lense as any, field as any, strategy) as any
                }
            }
        }, [lense, field])
    }

    function baseField<FIELD_VALUE>(lense:Lense<VALUE, FIELD_VALUE>, field:form.field.Of<FIELD_VALUE>, strategy:FieldStrategy<VALUE>):BaseField<FIELD_VALUE> {
        return {
            onChange: (value) => change_field(lense, value, strategy.change),
            onBlur: () => blur_field(lense, strategy.blur),
            value: () => form.value_of(field),
            valid: () => form.is_valid(field),
        }
    }

    function arrayField<FIELD_VALUE extends form.value.Array>(lense:Lense<VALUE, FIELD_VALUE>, field:form.field.Array<FIELD_VALUE>, strategy:FieldStrategy<VALUE>): ArrayField<FIELD_VALUE> {
        return {
            ...baseField(lense, field as any, strategy),
            map: (callback) => {
                const array = field.children.map((_, i) => i);
                return array.map((_, i, array) => {
                    return callback(i, array)
                })
            },
            meta: field,
            get: lense.get,
            array: {
                push: (value) => push(lense as any, value, strategy.change),
                swap: (index_a, index_b) => swap(lense as any, index_a, index_b, strategy.change),
                move: (from, to) => move(lense, from, to, strategy.change),
                insert: (value, index) => insert(lense as any, value, index, strategy.change),
                unshift: (value) => unshift(lense as any, value, strategy.change),
                remove: (index) => remove(lense as any, index, strategy.change),
                pop: () => pop(lense as any, strategy.change),
            }
        }
    }

    function objectField<FIELD_VALUE extends form.value.Object>(lense:Lense<VALUE, FIELD_VALUE>, field:form.field.Object<FIELD_VALUE>, strategy:FieldStrategy<VALUE>): ObjectField<FIELD_VALUE> {
        return {
            ...baseField(lense, field as any, strategy),
            meta: field,
            get: lense.get,
        }
    }

    function simpleField<FIELD_VALUE extends form.value.Simple>(lense:Lense<VALUE, FIELD_VALUE>, field:form.field.Simple<FIELD_VALUE>, strategy:FieldStrategy<VALUE>): SimpleField<FIELD_VALUE> {
        return {
            ...baseField(lense, field as any, strategy),
            meta: field,
        }
    }

    function make_field_validate<FIELD_VALUE>(validate?:form.Validate<FIELD_VALUE>, schema?:yup.Schema<FIELD_VALUE>): form.Validate<FIELD_VALUE>|undefined {
        if (validate === undefined && schema === undefined) {
            return undefined
        }
        return async (value) => {
            const errors = [];
            if (validate !== undefined) {
                errors.push(...await validate(value))
            }
            if (schema) {
                try {
                    await schema.validate(value, {
                        abortEarly: false,
                        recursive: false
                    })
                } catch (validation_error) {
                    errors.push(...validation_error.errors)
                }
            }
            return errors;
        }
    }

    function change_field<CHANGED>(lense:Lense<VALUE, CHANGED>, value:CHANGED, validation_strategy:VoidStrategy<VALUE>): void {
        const current_form = stateRef.current.form;
        const next_form = form.change(current_form, lense.field(current_form), value)
        dispatch({ type: ACTION.CHANGE, form: next_form })
        validation_strategy(() => validate_field(next_form, lense))
    }

    function blur_field(lense:Lense<VALUE, any>, validation_strategy:BlurStrategy<VALUE>): void {
        const current_form = stateRef.current.form;
        const next_form = form.touch(current_form, lense.field(current_form))
        dispatch({ type: ACTION.BLUR, form: next_form })
        validation_strategy(() => validate_field(next_form, lense))
    }

    async function submit_form(validation_strategy:SubmitStrategy<VALUE>): Promise<void> {
        dispatch({ type: ACTION.SUBMIT_START })
        const current_form = stateRef.current.form;
        const validated_form = await validation_strategy(() => validate_field(current_form, rootLense))
        const next_form = validated_form || stateRef.current.form;

        const root_field = next_form.root as form.field.Any;
        if (form.is_valid(root_field)) {
            submit(form.value_of(root_field))
        }
        dispatch({ type: ACTION.SUBMIT_DONE })
    }

    async function validate_field<VALIDATED>(current_form:form.Form<VALUE>, lense:Lense<VALUE, VALIDATED>): Promise<form.Form<VALUE>> {
        dispatch({ type: ACTION.VALIDATE_START })
        const next_form = await form.validate(current_form, lense.field(current_form))
        dispatch({ type: ACTION.VALIDATE_DONE, form: next_form, for_id: current_form.id })
        return next_form
    }

    function push<PUSHED>(lense:Lense<VALUE, PUSHED[]>, value:PUSHED, validation_strategy:VoidStrategy<VALUE>): number {
        const current_form = stateRef.current.form;
        const [next_form, next_length] = form.push(current_form, lense.field(current_form), value)
        dispatch({ type: ACTION.ARRAY, form: next_form })
        validation_strategy(() => validate_field(next_form, lense))

        return next_length;
    }

    function swap<SWAPPED>(lense:Lense<VALUE, SWAPPED[]>, index_a:number, index_b:number, validation_strategy:VoidStrategy<VALUE>): void {
        const current_form = stateRef.current.form;
        const next_form = form.swap(current_form, lense.field(current_form), index_a, index_b)
        dispatch({ type: ACTION.ARRAY, form: next_form })
        validation_strategy(() => validate_field(next_form, lense))
    }

    function move<MOVED>(lense:Lense<VALUE, MOVED[]>, from:number, to:number, validation_strategy:VoidStrategy<VALUE>): void {
        const current_form = stateRef.current.form;
        const next_form = form.move(current_form, lense.field(current_form), from, to)
        dispatch({ type: ACTION.ARRAY, form: next_form })
        validation_strategy(() => validate_field(next_form, lense))
    }

    function insert<INSERTED>(lense:Lense<VALUE, INSERTED[]>, value:INSERTED, index:number, validation_strategy:VoidStrategy<VALUE>): number {
        const current_form = stateRef.current.form;
        const [next_form, next_length] = form.insert(current_form, lense.field(current_form), value, index)
        dispatch({ type: ACTION.ARRAY, form: next_form })
        validation_strategy(() => validate_field(next_form, lense))

        return next_length;
    }

    function unshift<UNSHIFTED>(lense:Lense<VALUE, UNSHIFTED[]>, value:UNSHIFTED, validation_strategy:VoidStrategy<VALUE>): number {
        const current_form = stateRef.current.form;
        const [next_form, next_length] = form.unshift(current_form, lense.field(current_form), value)
        dispatch({ type: ACTION.ARRAY, form: next_form })
        validation_strategy(() => validate_field(next_form, lense))

        return next_length;
    }

    function remove<REMOVED>(lense:Lense<VALUE, REMOVED[]>, index:number, validation_strategy:VoidStrategy<VALUE>): REMOVED {
        const current_form = stateRef.current.form;
        const [next_form, deleted] = form.remove(current_form, lense.field(current_form), index)
        dispatch({ type: ACTION.ARRAY, form: next_form })
        validation_strategy(() => validate_field(next_form, lense))

        return form.value_of(deleted)
    }

    function pop<POPED>(lense:Lense<VALUE, POPED[]>, validation_strategy:VoidStrategy<VALUE>): POPED {
        const current_form = stateRef.current.form;
        const [next_form, poped] = form.pop(current_form, lense.field(current_form))
        dispatch({ type: ACTION.ARRAY, form: next_form })
        validation_strategy(() => validate_field(next_form, lense))

        return form.value_of(poped);
    }
}


