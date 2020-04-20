import { invariant, getPath } from "../utils";
import * as _value from "./value";
import * as _field from "./field";
import { Validate } from "./types";
import { TYPE } from "./fieldtype";

export type Form<VALUE extends _value.Object> = {
  id: number;
  root: _field.Object<VALUE>;
  index: { [s: string]: _field.Any };
};

export function Form<VALUE extends _value.Object>(
  initialValue: VALUE,
  validate?: Validate<VALUE>
): Form<VALUE> {
  const root = _field.object(initialValue);
  root.validate = validate;

  const index: { [s: string]: _field.Any } = {};
  visitDown(root, (field) => {
    index[field.id] = field;
  });

  return {
    id: 0,
    root,
    index,
  };
}

/*
type DiveEntry = {
  field: _field.Any;
  path: (string | number)[];
  parent?: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { field: _field.Array<any>; key: number }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | { field: _field.Object<any>; key: string };
};

function dive<FIELD extends _field.Any>(
  field: FIELD,
  map: <SUBFIELD extends _field.Any>(
    field: SUBFIELD,
    relativePath: (string | number)[]
  ) => SUBFIELD
): FIELD {
  const queue: DiveEntry[] = [{ field, path: [] }];
  let current: DiveEntry | undefined;
  let root: _field.Any | undefined = undefined;
  while ((current = queue.pop()) !== undefined) {
    const nextField = map(current.field, current.path);
    invariant(
      nextField.type === current.field.type,
      "Tried to change the type of a field"
    );

    if (nextField.type === TYPE.ARRAY) {
      for (let i = 0, l = nextField.children.length; i < l; i++) {
        queue.push({
          field: nextField.children[i],
          path: [...current.path, i],
          parent: {
            field: nextField,
            key: i,
          },
        });
      }
    } else if (nextField.type === TYPE.OBJECT) {
      for (const key in nextField.children) {
        queue.push({
          field: nextField.children[key],
          path: [...current.path, key],
          parent: {
            field: nextField,
            key,
          },
        });
      }
    }

    if (current.parent !== undefined) {
      if (typeof current.parent.key === "string") {
        invariant(current.parent.field.type === TYPE.OBJECT);
        current.parent.field.children[current.parent.key] = nextField;
      } else {
        invariant(current.parent.field.type === TYPE.ARRAY);
        current.parent.field.children[current.parent.key] = nextField;
      }
    } else {
      invariant(root === undefined, "found two root during field mutate");
      root = nextField;
    }
  }

  invariant(root !== undefined, "found no root during field mutate");
  return root as FIELD;
}

function rise<VALUE extends _value.Object>(
  form: Form<VALUE>,
  nextField: _field.Any,
  map: <FIELD extends _field.Multi>(field: FIELD) => FIELD
): Form<VALUE>["root"] {
  let current = nextField;
  let nextCurrent = nextField;
  let parent: _field.Any | undefined;
  while ((parent = getField(form, current.parentId)) !== undefined) {
    invariant(parent.type !== TYPE.SIMPLE, "Found a simple field as a parent");

    switch (parent.type) {
      case TYPE.OBJECT:
        {
          const nextParent = map(parent);
          invariant(
            nextParent.type === TYPE.OBJECT,
            "Tried to change the type of a field"
          );
          const children = parent.children;
          const name = Object.keys(children).find(
            (key) => children[key].id === nextCurrent.id
          );
          invariant(
            name !== undefined,
            "Tried to update a field that is not in it's parent"
          );

          nextParent.children[name] = nextCurrent;
          nextCurrent = nextParent;
        }
        break;
      case TYPE.ARRAY:
        {
          const nextParent = map(parent);
          invariant(
            nextParent.type === TYPE.ARRAY,
            "Tried to change the type of a field"
          );
          const children = parent.children;
          const index = children.findIndex(
            (field) => field.id === nextCurrent.id
          );
          invariant(
            index !== -1,
            "Tried to update a field that is not in it's parent"
          );

          nextParent.children[index] = nextCurrent;
          nextCurrent = nextParent;
        }
        break;
    }

    current = parent;
  }
  return nextCurrent as Form<VALUE>["root"];
}

type DiveUpdatePattern = {
  simple: <FIELD extends _field.Simple>(
    field: FIELD,
    path: (string | number)[]
  ) => FIELD;
  object: <FIELD extends _field.Object>(field: FIELD) => FIELD;
  array: <FIELD extends _field.Array>(field: FIELD) => FIELD;
};

type RiseUpdatePattern = Partial<Omit<DiveUpdatePattern, "simple">>;

const diveUpdate: DiveUpdatePattern = {
  simple: (field) => field,
  object: (field) => field,
  array: (field) => field,
};

const riseUpdate: RiseUpdatePattern = {
  object: (field) => clone(field),
  array: (field) => clone(field),
};

function update<VALUE extends _value.Object, FIELD extends _field.Any>(
  form: Form<VALUE>,
  field: FIELD,
  divePattern: DiveUpdatePattern,
  risePattern: RiseUpdatePattern = {}
): Form<VALUE> {
  const index: { [s: string]: _field.Any } = {};

  const nextField = dive(field, (field, path) => {
    switch (field.type) {
      case TYPE.OBJECT: {
        const nextField = divePattern.object(
          field as typeof field & _field.Object
        );
        index[field.id] = nextField;
        return nextField;
      }
      case TYPE.ARRAY: {
        const nextField = divePattern.array(
          field as typeof field & _field.Array
        );
        index[field.id] = nextField;
        return nextField;
      }
      case TYPE.SIMPLE: {
        const nextField = divePattern.simple(
          field as typeof field & _field.Simple,
          path
        );
        index[field.id] = nextField;
        return nextField;
      }
    }
  });

  const root = rise(form, nextField, (field) => {
    switch (field.type) {
      case TYPE.OBJECT: {
        const nextField = (risePattern.object || divePattern.object)(
          field as typeof field & field.Object
        );
        index[field.id] = nextField;
        return nextField;
      }
      case TYPE.ARRAY: {
        const nextField = (risePattern.array || divePattern.array)(
          field as typeof field & field.Array
        );
        index[field.id] = nextField;
        return nextField;
      }
    }
  });

  return {
    id: form.id + 1,
    root,
    index: {
      ...form.index,
      ...index,
    },
  };
}*/

type DiveUpdate<FIELD extends _field.Any> = (
  field: FIELD,
  path: (string | number)[]
) => FIELD;

type DiveUpdatePattern = {
  simple: DiveUpdate<_field.Simple>;
  object: DiveUpdate<_field.Object>;
  array: DiveUpdate<_field.Array>;
};

type RiseUpdatePattern = {
  object: <FIELD extends _field.Object>(field: FIELD) => FIELD;
  array: <FIELD extends _field.Array>(field: FIELD) => FIELD;
};

const diveUpdate: DiveUpdatePattern = {
  simple: (field) => field,
  object: (field) => field,
  array: (field) => field,
};

const riseUpdate: RiseUpdatePattern = {
  object: (field) => clone(field),
  array: (field) => clone(field),
};

type DiveEntry = {
  field: _field.Any;
  path: (string | number)[];
  parent?: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { field: _field.Array<any>; key: number }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | { field: _field.Object<any>; key: string };
};

function update<VALUE extends _value.Object, FIELD extends _field.Any>(
  form: Form<VALUE>,
  field: FIELD,
  divePattern: DiveUpdatePattern,
  risePattern: RiseUpdatePattern
): Form<VALUE> {
  const nextIndex: { [s: string]: _field.Any } = {};

  const queue: DiveEntry[] = [{ field, path: [] }];
  let current: DiveEntry | undefined;
  let root: _field.Any | undefined = undefined;
  while ((current = queue.pop()) !== undefined) {
    let nextField;
    switch (current.field.type) {
      case TYPE.ARRAY: {
        nextField = divePattern.array(current.field, current.path);
        nextIndex[nextField.id] = nextField;
        for (let i = 0, l = nextField.children.length; i < l; i++) {
          queue.push({
            field: nextField.children[i],
            path: [...current.path, i],
            parent: {
              field: nextField,
              key: i,
            },
          });
        }
        break;
      }
      case TYPE.OBJECT: {
        nextField = divePattern.object(current.field, current.path);
        nextIndex[nextField.id] = nextField;
        for (const key in nextField.children) {
          queue.push({
            field: nextField.children[key],
            path: [...current.path, key],
            parent: {
              field: nextField,
              key,
            },
          });
        }
        break;
      }
      case TYPE.SIMPLE: {
        nextField = divePattern.simple(current.field, current.path);
        nextIndex[nextField.id] = nextField;
        break;
      }
    }
    invariant(
      nextField.type === current.field.type,
      "Tried to change the type of a field"
    );

    if (current.parent !== undefined) {
      if (typeof current.parent.key === "string") {
        invariant(
          current.parent.field.type === TYPE.OBJECT,
          "only object can have string key"
        );
        current.parent.field.children[current.parent.key] = nextField;
      } else {
        invariant(
          current.parent.field.type === TYPE.ARRAY,
          "only array can have number key"
        );
        current.parent.field.children[current.parent.key] = nextField;
      }
    } else {
      invariant(root === undefined, "found two root during field mutate");
      root = nextField;
    }
  }

  invariant(root !== undefined, "found no root during field mutate");

  let currentField = root;
  let nextCurrent = root;
  let parent: _field.Any | undefined;
  while ((parent = getField(form, currentField.parentId)) !== undefined) {
    invariant(parent.type !== TYPE.SIMPLE, "Found a simple field as a parent");

    switch (parent.type) {
      case TYPE.OBJECT:
        {
          const nextParent = risePattern.object(parent);
          nextIndex[nextParent.id] = nextParent;

          invariant(
            nextParent.type === TYPE.OBJECT,
            "Tried to change the type of a field"
          );
          const children = parent.children;
          const name = Object.keys(children).find(
            (key) => children[key].id === nextCurrent.id
          );
          invariant(
            name !== undefined,
            "Tried to update a field that is not in it's parent"
          );

          nextParent.children[name] = nextCurrent;
          nextCurrent = nextParent;
        }
        break;
      case TYPE.ARRAY:
        {
          const nextParent = risePattern.array(parent);
          nextIndex[nextParent.id] = nextParent;

          invariant(
            nextParent.type === TYPE.ARRAY,
            "Tried to change the type of a field"
          );
          const children = parent.children;
          const index = children.findIndex(
            (field) => field.id === nextCurrent.id
          );
          invariant(
            index !== -1,
            "Tried to update a field that is not in it's parent"
          );

          nextParent.children[index] = nextCurrent;
          nextCurrent = nextParent;
        }
        break;
    }

    currentField = parent;
  }

  return {
    id: form.id + 1,
    root: nextCurrent as Form<VALUE>["root"],
    index: {
      ...form.index,
      ...nextIndex,
    },
  };
}

export function change<VALUE extends _value.Object, CHANGED>(
  form: Form<VALUE>,
  field: _field.Of<CHANGED>,
  value: CHANGED
): Form<VALUE> {
  function _dive<FIELD extends _field.Any>(
    field: FIELD,
    path: (string | number)[]
  ): FIELD {
    return clone(field, { dirty: true, value: getPath(value, path) });
  }

  return update(
    form,
    field,
    {
      array: _dive,
      object: _dive,
      simple: _dive,
    },
    {
      array: (field) => {
        return clone(field, {
          dirty: true,
          value: field.children.map((child) => child.value),
        });
      },
      object: (field) => {
        return clone(field, {
          dirty: true,
          value: Object.entries(field.children).reduce(
            (value, [key, field]) => {
              value[key] = field.value;
              return value;
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {} as any
          ),
        });
      },
    }
  );
}

export async function validate<VALUE extends _value.Object, VALIDATED>(
  form: Form<VALUE>,
  field: _field.Of<VALIDATED>
): Promise<Form<VALUE>> {
  const validationPromises: Promise<void>[] = [];

  function _validate<FIELD extends _field.Any>(field: FIELD): FIELD {
    const nextField = clone(field);
    validationPromises.push(validateField(nextField));
    return nextField;
  }

  const nextForm = update(
    form,
    field,
    {
      array: _validate,
      object: _validate,
      simple: _validate,
    },
    {
      array: _validate,
      object: _validate,
    }
  );

  await Promise.all(validationPromises);

  return nextForm;
}

export function validable<VALUE extends _value.Object>(
  form: Form<VALUE>,
  field: _field.Any,
  validable: boolean
): Form<VALUE> {
  const nextField = {
    ...field,
    errors: validable ? field.errors : [],
    validable,
  };

  return update(form, nextField, diveUpdate, riseUpdate);
}

export function touch<VALUE extends _value.Object>(
  form: Form<VALUE>,
  field: _field.Any
): Form<VALUE> {
  function _touch<FIELD extends _field.Any>(field: FIELD): FIELD {
    return clone(field, { touched: true });
  }
  return update(
    form,
    field,
    {
      simple: _touch,
      object: _touch,
      array: _touch,
    },
    {
      object: _touch,
      array: _touch,
    }
  );
}

export function push<VALUE extends _value.Object, PUSHED extends _value.Any>(
  form: Form<VALUE>,
  field: _field.Array<PUSHED[]>,
  value: PUSHED
): [Form<VALUE>, number] {
  const pushedField = _field.of(value, field.id);

  const nextField = {
    ...field,
    children: [...field.children, pushedField],
  };

  const nextForm = update(form, nextField, diveUpdate, riseUpdate);

  return [nextForm, nextField.children.length];
}

export function swap<VALUE extends _value.Object>(
  form: Form<VALUE>,
  field: _field.Array<_value.Simple>,
  indexA: number,
  indexB: number
): Form<VALUE> {
  const firstIndex = Math.min(indexA, indexB);
  const lastIndex = Math.max(indexA, indexB);
  const nextField = {
    ...field,
    children: [
      ...field.children.slice(0, firstIndex),
      field.children[lastIndex],
      ...field.children.slice(firstIndex + 1, lastIndex),
      field.children[firstIndex],
      ...field.children.slice(lastIndex + 1),
    ],
  };

  return update(form, nextField, diveUpdate, riseUpdate);
}

export function move<VALUE extends _value.Object>(
  form: Form<VALUE>,
  field: _field.Array<_value.Simple>,
  from: number,
  to: number
): Form<VALUE> {
  const nextChildren = [...field.children];
  nextChildren.splice(to, 0, nextChildren.splice(from, 1)[0]);
  const nextField = {
    ...field,
    children: nextChildren,
  };

  return update(form, nextField, diveUpdate, riseUpdate);
}

export function insert<
  VALUE extends _value.Object,
  INSERTED extends _value.Any
>(
  form: Form<VALUE>,
  field: _field.Array<INSERTED[]>,
  value: INSERTED,
  index: number
): [Form<VALUE>, number] {
  const insertedField = _field.of(value, field.id);

  const nextField = {
    ...field,
    children: [
      ...field.children.slice(0, index),
      insertedField,
      ...field.children.slice(index),
    ],
  };

  const nextForm = update(form, nextField, diveUpdate, riseUpdate);

  return [nextForm, nextField.children.length];
}

export function unshift<
  VALUE extends _value.Object,
  UNNSHIFTED extends _value.Any
>(
  form: Form<VALUE>,
  field: _field.Array<UNNSHIFTED[]>,
  value: UNNSHIFTED
): [Form<VALUE>, number] {
  const unshiftedField = _field.of(value, field.id);

  const nextField = {
    ...field,
    children: [unshiftedField, ...field.children],
  };

  const nextForm = update(form, nextField, diveUpdate, riseUpdate);

  return [nextForm, nextField.children.length];
}

export function remove<VALUE extends _value.Object, REMOVED extends _value.Any>(
  form: Form<VALUE>,
  field: _field.Array<REMOVED[]>,
  index: number
): [Form<VALUE>, _field.Of<REMOVED>] {
  const removedField = field.children[index];

  const nextField = {
    ...field,
    children: [
      ...field.children.slice(0, index),
      ...field.children.slice(index + 1),
    ],
  };

  const nextForm = update(form, nextField, diveUpdate, riseUpdate);

  visitDown(removedField, (field) => {
    delete nextForm.index[field.id];
  });

  return [nextForm, removedField];
}

export function pop<VALUE extends _value.Object, POPED extends _value.Any>(
  form: Form<VALUE>,
  field: _field.Array<POPED[]>
): [Form<VALUE>, _field.Of<POPED>] {
  const popedField = field.children[field.children.length - 1];

  const nextField = {
    ...field,
    children: [...field.children.slice(0, -1)],
  };

  const nextForm = update(form, nextField, diveUpdate, riseUpdate);

  visitDown(popedField, (field) => {
    delete nextForm.index[field.id];
  });

  return [nextForm, popedField];
}

function visitDown(
  field: _field.Any,
  callback: (field: _field.Any) => void
): void {
  const queue = [field];
  let current: _field.Any | undefined;
  while ((current = queue.pop()) !== undefined) {
    if (current.type === TYPE.ARRAY) {
      queue.push(...current.children);
    }
    if (current.type === TYPE.OBJECT) {
      queue.push(...Object.values(current.children));
    }
    callback(current);
  }
}

function getField<VALUE extends _value.Object>(
  form: Form<VALUE>,
  id?: string
): _field.Any | undefined {
  if (id === undefined) {
    return undefined;
  }
  return form.index[id];
}

export function assertStructure<VALUE extends _value.Object>({
  root,
  index,
}: Form<VALUE>): void {
  visitDown(root, (field) => {
    invariant(
      index[field.id] === field,
      `field in tree should be the same as field in index (${field.id})`
    );
    if (field.type === "object") {
      Object.values(field.children).forEach((child) => {
        invariant(
          child.parentId === field.id,
          "child reference to parent don't match"
        );
      });
    }
    if (field.type === "array") {
      field.children.forEach((child) => {
        invariant(
          child.parentId === field.id,
          "child reference to parent don't match"
        );
      });
    }
  });
}

async function validateField(field: _field.Any): Promise<void> {
  if (field.validable && field.validate) {
    const errors = await field.validate(_field.value(field));
    field.errors = errors;
  }
}

function clone<FIELD extends _field.Any>(
  field: FIELD,
  added: Partial<_field.Any> = {}
): FIELD {
  switch (field.type) {
    case TYPE.SIMPLE: {
      const simpleField = field as typeof field & _field.Simple;
      return {
        ...simpleField,
        ...added,
      };
    }
    case TYPE.ARRAY: {
      const arrayField = field as typeof field & _field.Array;
      return {
        ...arrayField,
        ...added,
        children: [...arrayField.children],
      };
    }
    case TYPE.OBJECT: {
      const objectField = field as typeof field & _field.Object;
      return {
        ...objectField,
        ...added,
        children: { ...objectField.children },
      };
    }
  }
}
