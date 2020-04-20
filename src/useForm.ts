import * as React from "react";
import {
  value as _value,
  field as _field,
  form as _form,
  TYPE,
  Validate,
} from "./form";
import { Lense, lense } from "./lense";
import * as yup from "yup";
import { invariant } from "./utils";

type State<VALUE extends _value.Object> = {
  /** current form */
  form: _form.Form<VALUE>;
  submitCount: number;
  status: {
    /** wheter the validation is running */
    validating: boolean;
    submiting: boolean;
  };
};

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
  type: ACTION.CHANGE;
  form: _form.Form<VALUE>;
};

type BlurAction<VALUE> = {
  type: ACTION.BLUR;
  form: _form.Form<VALUE>;
};

type ValidateStart = {
  type: ACTION.VALIDATE_START;
};

type ValidateDone<VALUE> = {
  type: ACTION.VALIDATE_DONE;
  for: number;
  form: _form.Form<VALUE>;
};

type SubmitStart = {
  type: ACTION.SUBMIT_START;
};

type SubmitDone = {
  type: ACTION.SUBMIT_DONE;
};

type ArrayAction<VALUE> = {
  type: ACTION.ARRAY;
  form: _form.Form<VALUE>;
};

type ValidableAction = {
  type: ACTION.VALIDABLE;
  field: _field.Any;
  validable: boolean;
};

type Action<VALUE> =
  | ChangeAction<VALUE>
  | BlurAction<VALUE>
  | ValidateStart
  | ValidateDone<VALUE>
  | SubmitStart
  | SubmitDone
  | ArrayAction<VALUE>
  | ValidableAction;

type Reducer<VALUE> = (
  state: State<VALUE>,
  action: Action<VALUE>
) => State<VALUE>;
function reducer<VALUE extends _value.Object>(
  state: State<VALUE>,
  action: Action<VALUE>
): State<VALUE> {
  switch (action.type) {
    case ACTION.CHANGE: {
      if (state.status.submiting) {
        console.error("Cannot udpate the form during a submit.");
        return state;
      }
      return {
        ...state,
        form: action.form,
      };
    }
    case ACTION.BLUR: {
      if (state.status.submiting) {
        console.error("Cannot udpate the form during a submit.");
        return state;
      }
      return {
        ...state,
        form: action.form,
      };
    }
    case ACTION.VALIDATE_START: {
      return {
        ...state,
        status: {
          ...state.status,
          validating: true,
        },
      };
    }
    case ACTION.VALIDATE_DONE: {
      if (state.form.id !== action.for) {
        return {
          ...state,
          status: {
            ...state.status,
            validating: false,
          },
        };
      }
      return {
        ...state,
        form: action.form,
        status: {
          ...state.status,
          validating: false,
        },
      };
    }
    case ACTION.SUBMIT_START: {
      return {
        ...state,
        submitCount: state.submitCount + 1,
        status: {
          ...state.status,
          submiting: true,
        },
      };
    }
    case ACTION.SUBMIT_DONE: {
      return {
        ...state,
        status: {
          ...state.status,
          submiting: false,
        },
      };
    }
    case ACTION.ARRAY: {
      if (state.status.submiting) {
        console.error("Cannot udpate the form during a submit.");
        return state;
      }
      return {
        ...state,
        form: action.form,
      };
    }
    case ACTION.VALIDABLE: {
      if (state.status.submiting) {
        console.error("Cannot udpate the form during a submit.");
        return state;
      }
      return {
        ...state,
        form: _form.validable(state.form, action.field, action.validable),
      };
    }
  }
}

type BaseField<VALUE> = {
  onChange: (value: VALUE) => void;
  onBlur: () => void;
  value: () => VALUE;
  valid: () => boolean;
};

export type SimpleField<VALUE extends _value.Simple> = BaseField<VALUE> & {
  meta: _field.Simple<VALUE>;
};

export type ObjectField<ROOT_VALUE, VALUE extends _value.Object> = BaseField<
  VALUE
> & {
  meta: _field.Object<VALUE>;
  get: Lense<ROOT_VALUE, VALUE>["get"];
};

export type ArrayField<ROOT_VALUE, VALUE extends _value.Array> = BaseField<
  VALUE
> & {
  map: <MAPPED>(
    callback: (index: number, array: number[]) => MAPPED
  ) => MAPPED[];
  meta: _field.Array<VALUE>;
  get: Lense<ROOT_VALUE, VALUE>["get"];
  utils: {
    push: (value: VALUE) => void;
    swap: (indexA: number, indexB: number) => void;
    move: (from: number, to: number) => void;
    insert: (value: VALUE, index: number) => number;
    unshift: (value: VALUE) => number;
    remove: (index: number) => VALUE;
    pop: () => VALUE;
  };
};

export type FieldOf<ROOT_VALUE, VALUE> = VALUE extends _value.Array
  ? ArrayField<ROOT_VALUE, VALUE>
  : VALUE extends _value.Object
  ? ObjectField<ROOT_VALUE, VALUE>
  : VALUE extends _value.Simple
  ? SimpleField<VALUE>
  : never;

export type FieldOptions<VALUE, FIELD_VALUE> = {
  validable?: boolean;
  validate?: Validate<FIELD_VALUE>;
  fieldStrategy?: Partial<FieldStrategy<VALUE>>;
};

export type UseForm<VALUE extends _value.Object> = FieldOf<VALUE, VALUE> & {
  submit: (event: React.FormEvent) => Promise<void>;
  useField: <FIELD_VALUE>(
    lense: Lense<VALUE, FIELD_VALUE>,
    options?: FieldOptions<VALUE, FIELD_VALUE>
  ) => FieldOf<VALUE, FIELD_VALUE>;
};

export type BaseFormOption<VALUE> = {
  initialValues: VALUE;
  submit: (value: VALUE) => void;
  validate?: Validate<VALUE>;
  formStrategy?: Partial<Strategy<VALUE>>;
};

export type FormOption<VALUE> =
  | (BaseFormOption<VALUE> & {
      schema: undefined;
      yup: undefined;
    })
  | (BaseFormOption<VALUE> & {
      schema: yup.Schema<VALUE>;
      yup: typeof yup;
    });

type VoidStrategy<VALUE> = (validate: () => Promise<_form.Form<VALUE>>) => void;
type SubmitStrategy<VALUE> = (
  validate: () => Promise<_form.Form<VALUE>>
) => Promise<_form.Form<VALUE> | undefined>;
type Strategy<VALUE> = {
  change: VoidStrategy<VALUE>;
  blur: VoidStrategy<VALUE>;
  submit: SubmitStrategy<VALUE>;
};

type FieldStrategy<VALUE> = {
  change: VoidStrategy<VALUE>;
  blur: VoidStrategy<VALUE>;
};

export const STRATEGY = {
  NOT: (): void => {
    /* noop */
  },
  IMMEDIATE: <VALUE>(
    validate: () => Promise<_form.Form<VALUE>>
  ): Promise<_form.Form<VALUE> | undefined> => {
    return validate();
  },
  DEBOUNCED: <VALUE>(timeout: number): VoidStrategy<VALUE> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let handler: any = null;
    return (validate: () => Promise<_form.Form<VALUE>>): void => {
      clearTimeout(handler);
      handler = setTimeout(() => {
        validate();
        handler = null;
      }, timeout);
    };
  },
};

export function useForm<VALUE extends _value.Object>(
  options: FormOption<VALUE>
): UseForm<VALUE> {
  const [state, dispatch] = React.useReducer<Reducer<VALUE>, VALUE>(
    reducer,
    options.initialValues,
    (initialValues) => {
      return {
        form: _form.Form(initialValues),
        id: 0,
        submitCount: 0,
        status: {
          submiting: false,
          validating: false,
        },
      };
    }
  );

  const stateRef = React.useRef(state);
  stateRef.current = state;

  const rootLense = React.useMemo(() => lense<VALUE>(), []);

  return {
    ...field(rootLense, {
      validate: makeFieldValidate(options.validate, options.schema),
      fieldStrategy: options.formStrategy,
    }),
    submit: React.useCallback((event: React.FormEvent) => {
      event.preventDefault();
      return submitForm(options.formStrategy?.submit ?? STRATEGY.IMMEDIATE);
    }, []),
    useField: React.useCallback(field, []),
  };

  function field<FIELD_VALUE>(
    lense: Lense<VALUE, FIELD_VALUE>,
    {
      fieldStrategy = {},
      validable = true,
      validate,
    }: FieldOptions<VALUE, FIELD_VALUE> = {}
  ): FieldOf<VALUE, FIELD_VALUE> {
    const field = lense.field(stateRef.current.form);
    if (!field.validate) {
      field.validate = makeFieldValidate(
        validate,
        options.schema &&
          ((options.yup.reach(
            options.schema,
            lense.path
          ) as unknown) as yup.Schema<FIELD_VALUE>)
      );
    }

    React.useEffect(() => {
      if (field.validable !== validable) {
        dispatch({ type: ACTION.VALIDABLE, field: field, validable });
      }
    }, [validable]);

    const strategy: FieldStrategy<VALUE> = React.useMemo(
      () => ({
        change:
          fieldStrategy.change ??
          options.formStrategy?.change ??
          STRATEGY.DEBOUNCED(400),
        blur:
          fieldStrategy.blur ??
          options.formStrategy?.blur ??
          STRATEGY.IMMEDIATE,
      }),
      []
    );

    return React.useMemo(() => {
      switch (field.type) {
        case TYPE.ARRAY: {
          invariant(Array.isArray(field.value), "");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return arrayField(lense as any, field as any, strategy) as any;
        }
        case TYPE.OBJECT: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return objectField(lense as any, field as any, strategy) as any;
        }
        case TYPE.SIMPLE: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return simpleField(lense as any, field as any, strategy) as any;
        }
      }
    }, [lense, field]);
  }

  function baseField<FIELD extends _field.Any>(
    lense: Lense<VALUE, _field.Value<FIELD>>,
    field: FIELD,
    strategy: FieldStrategy<VALUE>
  ): BaseField<_field.Value<FIELD>> {
    const base: BaseField<_field.Value<FIELD>> = {
      onChange: (value) => changeField(lense, value, strategy.change),
      onBlur: () => blurField(lense, strategy.blur),
      value: () => _field.value(field),
      valid: () => _field.validity(field),
    };
    return base;
  }

  function arrayField<FIELD_VALUE extends _value.Array>(
    lense: Lense<VALUE, FIELD_VALUE>,
    field: _field.Array<FIELD_VALUE>,
    strategy: FieldStrategy<VALUE>
  ): ArrayField<VALUE, FIELD_VALUE> {
    const utils: ArrayField<VALUE, FIELD_VALUE>["utils"] = {
      push: (value) => push(lense, value, strategy.change),
      swap: (indexA, indexB) => swap(lense, indexA, indexB, strategy.change),
      move: (from, to) => move(lense, from, to, strategy.change),
      insert: (value, index) => insert(lense, value, index, strategy.change),
      unshift: (value) => unshift(lense, value, strategy.change),
      remove: (index) => remove(lense, index, strategy.change),
      pop: () => pop(lense, strategy.change),
    };

    const array: ArrayField<VALUE, FIELD_VALUE> = {
      ...baseField(lense, field, strategy),
      map: (callback) => {
        const array = field.children.map((_, i) => i);
        return array.map((_, i, array) => {
          return callback(i, array);
        });
      },
      meta: field,
      get: lense.get,
      utils,
    };
    return array;
  }

  function objectField<FIELD_VALUE extends _value.Object>(
    lense: Lense<VALUE, FIELD_VALUE>,
    field: _field.Object<FIELD_VALUE>,
    strategy: FieldStrategy<VALUE>
  ): ObjectField<VALUE, FIELD_VALUE> {
    return {
      ...baseField(lense, field, strategy),
      meta: field,
      get: lense.get,
    };
  }

  function simpleField<FIELD_VALUE extends _value.Simple>(
    lense: Lense<VALUE, FIELD_VALUE>,
    field: _field.Simple<FIELD_VALUE>,
    strategy: FieldStrategy<VALUE>
  ): SimpleField<FIELD_VALUE> {
    return {
      ...baseField(lense, field, strategy),
      meta: field,
    };
  }

  function makeFieldValidate<FIELD_VALUE>(
    validate?: Validate<FIELD_VALUE>,
    schema?: yup.Schema<FIELD_VALUE>
  ): Validate<FIELD_VALUE> | undefined {
    if (validate === undefined && schema === undefined) {
      return undefined;
    }
    return async (value): Promise<string[]> => {
      const errors = [];
      if (validate !== undefined) {
        errors.push(...(await validate(value)));
      }
      if (schema) {
        try {
          await schema.validate(value, {
            abortEarly: false,
            recursive: false,
          });
        } catch (validationError) {
          errors.push(...validationError.errors);
        }
      }
      return errors;
    };
  }

  function changeField<CHANGED>(
    lense: Lense<VALUE, CHANGED>,
    value: CHANGED,
    validationStrategy: VoidStrategy<VALUE>
  ): void {
    const currentForm = stateRef.current.form;
    const nextForm = _form.change(currentForm, lense.field(currentForm), value);
    dispatch({ type: ACTION.CHANGE, form: nextForm });
    validationStrategy(() => validateField(nextForm, lense));
  }

  function blurField<BLURED>(
    lense: Lense<VALUE, BLURED>,
    validationStrategy: VoidStrategy<VALUE>
  ): void {
    const currentForm = stateRef.current.form;
    const nextForm = _form.touch(currentForm, lense.field(currentForm));
    dispatch({ type: ACTION.BLUR, form: nextForm });
    validationStrategy(() => validateField(nextForm, lense));
  }

  async function submitForm(
    validationStrategy: SubmitStrategy<VALUE>
  ): Promise<void> {
    dispatch({ type: ACTION.SUBMIT_START });
    const currentForm = stateRef.current.form;
    const validatedForm = await validationStrategy(() =>
      validateField(currentForm, rootLense)
    );
    const nextForm = validatedForm || stateRef.current.form;

    const rootField = nextForm.root as _field.Any;
    if (_field.validity(rootField)) {
      options.submit(_field.value(rootField));
    }
    dispatch({ type: ACTION.SUBMIT_DONE });
  }

  async function validateField<VALIDATED>(
    currentForm: _form.Form<VALUE>,
    lense: Lense<VALUE, VALIDATED>
  ): Promise<_form.Form<VALUE>> {
    dispatch({ type: ACTION.VALIDATE_START });
    const nextForm = await _form.validate(
      currentForm,
      lense.field(currentForm)
    );
    dispatch({
      type: ACTION.VALIDATE_DONE,
      form: nextForm,
      for: currentForm.id,
    });
    return nextForm;
  }

  function push<PUSHED>(
    lense: Lense<VALUE, PUSHED[]>,
    value: PUSHED,
    validationStrategy: VoidStrategy<VALUE>
  ): number {
    const currentForm = stateRef.current.form;
    const [nextForm, nextLength] = _form.push(
      currentForm,
      lense.field(currentForm),
      value
    );
    dispatch({ type: ACTION.ARRAY, form: nextForm });
    validationStrategy(() => validateField(nextForm, lense));

    return nextLength;
  }

  function swap<SWAPPED>(
    lense: Lense<VALUE, SWAPPED[]>,
    indexA: number,
    indexB: number,
    validationStrategy: VoidStrategy<VALUE>
  ): void {
    const currenForm = stateRef.current.form;
    const nextForm = _form.swap(
      currenForm,
      lense.field(currenForm),
      indexA,
      indexB
    );
    dispatch({ type: ACTION.ARRAY, form: nextForm });
    validationStrategy(() => validateField(nextForm, lense));
  }

  function move<MOVED>(
    lense: Lense<VALUE, MOVED[]>,
    from: number,
    to: number,
    validationStrategy: VoidStrategy<VALUE>
  ): void {
    const currentForm = stateRef.current.form;
    const nextForm = _form.move(
      currentForm,
      lense.field(currentForm),
      from,
      to
    );
    dispatch({ type: ACTION.ARRAY, form: nextForm });
    validationStrategy(() => validateField(nextForm, lense));
  }

  function insert<INSERTED>(
    lense: Lense<VALUE, INSERTED[]>,
    value: INSERTED,
    index: number,
    validationStrategy: VoidStrategy<VALUE>
  ): number {
    const currentForm = stateRef.current.form;
    const [nextForm, nextLength] = _form.insert(
      currentForm,
      lense.field(currentForm),
      value,
      index
    );
    dispatch({ type: ACTION.ARRAY, form: nextForm });
    validationStrategy(() => validateField(nextForm, lense));

    return nextLength;
  }

  function unshift<UNSHIFTED>(
    lense: Lense<VALUE, UNSHIFTED[]>,
    value: UNSHIFTED,
    validationStrategy: VoidStrategy<VALUE>
  ): number {
    const currentForm = stateRef.current.form;
    const [nextForm, nextLength] = _form.unshift(
      currentForm,
      lense.field(currentForm),
      value
    );
    dispatch({ type: ACTION.ARRAY, form: nextForm });
    validationStrategy(() => validateField(nextForm, lense));

    return nextLength;
  }

  function remove<REMOVED>(
    lense: Lense<VALUE, REMOVED[]>,
    index: number,
    validationStrategy: VoidStrategy<VALUE>
  ): REMOVED {
    const currentForm = stateRef.current.form;
    const [nextForm, deleted] = _form.remove(
      currentForm,
      lense.field(currentForm),
      index
    );
    dispatch({ type: ACTION.ARRAY, form: nextForm });
    validationStrategy(() => validateField(nextForm, lense));

    return _field.value(deleted);
  }

  function pop<POPED>(
    lense: Lense<VALUE, POPED[]>,
    validationStrategy: VoidStrategy<VALUE>
  ): POPED {
    const currentForm = stateRef.current.form;
    const [nextForm, poped] = _form.pop(currentForm, lense.field(currentForm));
    dispatch({ type: ACTION.ARRAY, form: nextForm });
    validationStrategy(() => validateField(nextForm, lense));

    return _field.value(poped);
  }
}
