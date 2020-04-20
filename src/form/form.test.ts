const tap = require("tap");
import * as form from "./form";
import * as field from "./field";

tap.test("constructor", (t: any) => {
  type MyForm = {
    simple: number;
    object: {
      foo: string;
      bar: boolean;
    };
    array: string[];
    nested: { bar: number[]; foo: string }[];
  };

  const form0 = form.Form<MyForm>({
    simple: 1,
    object: {
      foo: "foo",
      bar: true,
    },
    array: ["foo", "bar"],
    nested: [
      {
        bar: [1, 2, 3],
        foo: "foobar",
      },
      {
        bar: [4, 8, 15, 16, 23, 42],
        foo: "boofar",
      },
    ],
  });

  form.assertStructure(form0);
  t.matchSnapshot(form0);
  t.end();
});

tap.test("value_of", (t: any) => {
  type MyForm = {
    simple: number;
    object: {
      foo: string;
      bar: boolean;
    };
    array: string[];
    nested: { bar: number[]; foo: string }[];
  };
  const initialValue = {
    simple: 1,
    object: {
      foo: "foo",
      bar: true,
    },
    array: ["foo", "bar"],
    nested: [
      {
        bar: [1, 2, 3],
        foo: "foobar",
      },
      {
        bar: [4, 8, 15, 16, 23, 42],
        foo: "boofar",
      },
    ],
  };
  const form0 = form.Form<MyForm>(initialValue);

  t.same(
    field.value(form0.root),
    initialValue,
    "value of new form should be initial value"
  );
  t.end();
});

tap.test("change", (t: any) => {
  type MyForm = {
    a: [
      {
        object: {
          foo: string;
          bar: string;
        };
        array: string[];
      }
    ];
  };

  const form0 = form.Form<MyForm>({
    a: [
      {
        object: {
          foo: "",
          bar: "",
        },
        array: ["foo", "bar"],
      },
    ],
  });

  const _root = (form: form.Form<MyForm>) => form.root.children.a.children[0];
  const object = (form: form.Form<MyForm>) => _root(form).children.object;
  const foo = (form: form.Form<MyForm>) => object(form).children.foo;
  const bar = (form: form.Form<MyForm>) => object(form).children.bar;
  const array = (form: form.Form<MyForm>) => _root(form).children.array;

  // update one field
  const form1 = form.change(form0, foo(form0), "foo");

  form.assertStructure(form1);
  t.equal(form1.id, form0.id + 1);

  t.equal(field.value(foo(form1)), "foo", "foo field value should be updated");
  t.equal(foo(form1).dirty, true, "foo field should be dirty");

  t.equal(object(form1).dirty, true, "dirty should propagate up to the root");
  t.equal(form1.root.dirty, true, "dirty should propagate up to the root");

  t.equal(bar(form1), bar(form0), "untouched field should remain the same");
  t.equal(array(form1), array(form0), "untouched field should remain the same");

  // update another field
  const form2 = form.change(form1, bar(form1), "bar");

  form.assertStructure(form2);
  t.equal(form2.id, form1.id + 1);

  t.equal(field.value(bar(form2)), "bar", "bar field value should be updated");
  t.equal(bar(form2).dirty, true, "bar field should be dirty");

  t.equal(foo(form2), foo(form1), "untouched field should remain the same");
  t.equal(array(form2), array(form1), "untouched field should remain the same");

  // update object field
  const objectUpdate = { foo: "oof", bar: "rab" };
  const form3 = form.change(form2, object(form2), objectUpdate);
  t.equal(form3.id, form2.id + 1);

  form.assertStructure(form3);
  t.same(
    field.value(object(form3)),
    objectUpdate,
    "object field should be updated"
  );
  t.equal(array(form3), array(form2), "untouched field should remain the same");

  // update array field
  const arrayUpdate = ["foobar", "baz"];
  const form4 = form.change(form3, array(form3), arrayUpdate);
  t.equal(form4.id, form3.id + 1);

  form.assertStructure(form4);
  t.same(
    field.value(array(form4)),
    arrayUpdate,
    "array field should be updated"
  );

  t.throws(
    () => form.change(form4, object(form4), "wrong structure" as any),
    "can't change object structure"
  );
  t.throws(
    () => form.change(form4, array(form4), "wrong structure" as any),
    "can't change array structure"
  );
  t.end();
});

tap.test("validate", async (t: any) => {
  type MyForm = {
    foo: string;
    array: { bar: string; back: string }[];
  };

  const form0 = form.Form<MyForm>({
    foo: "toto",
    array: [
      { bar: "bar", back: "bichette" },
      { bar: "bar", back: "beuku" },
    ],
  });

  const foo = (form: form.Form<MyForm>) => form.root.children.foo;
  const array = (form: form.Form<MyForm>) => form.root.children.array;
  const arrayItem = (form: form.Form<MyForm>, i: number) =>
    array(form).children[i];
  const bar = (form: form.Form<MyForm>, i: number) =>
    arrayItem(form, i).children.bar;
  const back = (form: form.Form<MyForm>, i: number) =>
    arrayItem(form, i).children.back;

  const calls: string[] = [];
  form0.root.validate = async (value) => {
    calls.push("root");
    return [];
  };
  foo(form0).validate = async (value) => {
    calls.push("foo");
    if (value.startsWith("c")) {
      return [];
    }
    return ["should start with a c-"];
  };
  array(form0).validate = async (value) => {
    calls.push("array");
    return [];
  };
  arrayItem(form0, 1).validate = async (value) => {
    calls.push("array_item");
    return [];
  };
  bar(form0, 1).validate = async (value) => {
    calls.push("bar");
    if (value.startsWith("b")) {
      return [];
    }
    return ["should start with a b-"];
  };
  back(form0, 1).validate = async (value) => {
    calls.push("back");
    return [];
  };

  calls.length = 0;
  const form1 = await form.validate(form0, arrayItem(form0, 1));
  form.assertStructure(form1);
  t.equal(form1.id, form0.id + 1);

  t.same(
    calls,
    ["array_item", "back", "bar", "array", "root"],
    "should call validate towards leaf, then back to root"
  );
  t.same(bar(form1, 0).errors, []);
  t.same(foo(form1).errors, []);
  t.true(field.validity(bar(form1, 0)), "valid field should be valid");
  t.true(field.validity(foo(form1)), "valid field should be valid");
  t.true(field.validity(array(form1)), "valid field should be valid");

  calls.length = 0;
  const form2 = await form.validate(form1, foo(form1));
  form.assertStructure(form2);
  t.equal(form2.id, form1.id + 1);

  t.same(
    calls,
    ["foo", "root"],
    "should call validate towards leaf, then back to root"
  );
  t.same(bar(form2, 0).errors, []);
  t.same(foo(form2).errors, ["should start with a c-"]);
  t.true(field.validity(bar(form2, 0)), "valid field should be valid");
  t.false(field.validity(foo(form2)), "invalid field should not be valid");
  t.false(
    field.validity(form2.root),
    "parent of invalid field should not be valid"
  );
  t.equal(form2.id, form1.id + 1);

  array(form2).validable = false;
  back(form2, 1).validable = false;
  calls.length = 0;
  const form3 = await form.validate(form2, arrayItem(form2, 1));
  form.assertStructure(form3);
  t.equal(form3.id, form2.id + 1);

  t.same(
    calls,
    ["array_item", "bar", "root"],
    "should skip validation if field not validable"
  );

  t.end();
});

tap.test("validable", (t: any) => {
  type MyForm = {
    object: {
      foo: string;
      bar: string;
    }[];
  };

  const form0 = form.Form<MyForm>({
    object: [
      {
        foo: "",
        bar: "",
      },
    ],
  });

  const object = (form: form.Form<MyForm>) => form.root.children.object;
  const foo = (form: form.Form<MyForm>) =>
    object(form).children[0].children.foo;
  const bar = (form: form.Form<MyForm>) =>
    object(form).children[0].children.bar;

  foo(form0).errors = ["error 1", "error 2"];

  const form1 = form.validable(form0, foo(form0), false);
  form.assertStructure(form1);
  t.equal(form1.id, form0.id + 1);

  t.equal(
    foo(form1).validable,
    false,
    "foo field value should not be validable"
  );
  t.same(foo(form1).errors, [], "errors of not validable field are reset");
  t.equal(bar(form1), bar(form0), "untouched field should remain the same");
  t.equal(
    object(form1).validable,
    true,
    "parent of not validable field stay validable"
  );

  bar(form1).errors = ["error 1", "error 2"];

  const form2 = form.validable(form1, bar(form1), true);
  form.assertStructure(form2);
  t.equal(form2.id, form1.id + 1);

  t.equal(
    bar(form2).errors,
    bar(form1).errors,
    "making a validable an already validable field should not reset errors"
  );

  t.end();
});

tap.test("touch", (t: any) => {
  type MyForm = {
    object: {
      foo: string;
      bar: string;
    }[];
  };

  const form0 = form.Form<MyForm>({
    object: [
      {
        foo: "",
        bar: "",
      },
    ],
  });

  const object = (form: form.Form<MyForm>) => form.root.children.object;
  const foo = (form: form.Form<MyForm>) =>
    object(form).children[0].children.foo;
  const bar = (form: form.Form<MyForm>) =>
    object(form).children[0].children.bar;

  const form1 = form.touch(form0, foo(form0));
  form.assertStructure(form1);
  t.equal(form1.id, form0.id + 1);

  t.equal(foo(form1).touched, true, "foo field value should be touched");
  t.equal(bar(form1), bar(form0), "untouched field should remain the same");
  t.equal(
    object(form1).touched,
    true,
    "parent of touched field should be touched"
  );

  const form2 = form.touch(form1, bar(form1));
  form.assertStructure(form2);
  t.equal(form2.id, form1.id + 1);

  t.equal(bar(form2).touched, true, "bar field value should be touched");
  t.equal(foo(form2), foo(form1), "untouched field should remain the same");
  t.end();
});

tap.test("array method", (t: any) => {
  type MyForm = {
    a: { array: { bar: string; back: string }[] }[];
  };

  const initialValue = {
    a: [
      {
        array: [
          { bar: "bi", back: "toc" },
          { bar: "bouz", back: "ri" },
          { bar: "be", back: "intosh" },
        ],
      },
    ],
  };
  const form0 = form.Form<MyForm>(initialValue);

  const array = (form: form.Form<MyForm>) =>
    form.root.children.a.children[0].children.array;
  const arrayItem = (form: form.Form<MyForm>, i: number) =>
    array(form).children[i];

  t.test("push", (t: any) => {
    const push0 = { bar: "bar", back: "back" };
    const [form1, lengt1] = form.push(form0, array(form0), push0);
    form.assertStructure(form1);
    t.equal(form1.id, form0.id + 1);

    t.equal(lengt1, 4);
    t.same(
      field.value(arrayItem(form1, 3)),
      push0,
      "pushed value should be at the end of the array"
    );

    t.end();
  });

  t.test("swap", (t: any) => {
    const form1 = form.swap(form0, array(form0), 2, 0);
    form.assertStructure(form1);
    t.equal(form1.id, form0.id + 1);

    t.equal(
      arrayItem(form1, 0),
      arrayItem(form0, 2),
      "values should be swapped"
    );
    t.equal(
      arrayItem(form1, 1),
      arrayItem(form0, 1),
      "not swapped should be untouched"
    );
    t.equal(
      arrayItem(form1, 2),
      arrayItem(form0, 0),
      "values should be swapped"
    );

    t.end();
  });

  t.test("move", (t: any) => {
    const form1 = form.move(form0, array(form0), 2, 0);
    form.assertStructure(form1);
    t.equal(form1.id, form0.id + 1);

    t.same(
      arrayItem(form1, 0),
      arrayItem(form0, 2),
      "value should be moved at given index"
    );
    t.same(
      arrayItem(form1, 1),
      arrayItem(form0, 0),
      "not moved values are shifted"
    );
    t.same(
      arrayItem(form1, 2),
      arrayItem(form0, 1),
      "not moved values are shifted"
    );

    t.end();
  });

  t.test("insert", (t: any) => {
    const insert0 = { bar: "bar", back: "back" };
    const [form1, length] = form.insert(form0, array(form0), insert0, 1);
    form.assertStructure(form1);
    t.equal(form1.id, form0.id + 1);

    t.equal(length, 4);
    t.equal(
      arrayItem(form1, 0),
      arrayItem(form0, 0),
      "value before insertion point should be untouched"
    );
    t.same(
      field.value(arrayItem(form1, 1)),
      insert0,
      "inserted value is inserted"
    );
    t.equal(
      arrayItem(form1, 2),
      arrayItem(form0, 1),
      "values after insertion point are shifted"
    );
    t.equal(
      arrayItem(form1, 3),
      arrayItem(form0, 2),
      "values after insertion point are shifted"
    );

    t.end();
  });

  t.test("unshift", (t: any) => {
    const unshifted = { bar: "bar", back: "back" };
    const [form1, length] = form.unshift(form0, array(form0), unshifted);
    form.assertStructure(form1);
    t.equal(form1.id, form0.id + 1);

    t.equal(length, 4);
    t.same(
      field.value(arrayItem(form1, 0)),
      unshifted,
      "unshifted value should be at the start of the array"
    );
    t.equal(
      arrayItem(form1, 1),
      arrayItem(form0, 0),
      "subsequent values should be shifted"
    );
    t.equal(
      arrayItem(form1, 2),
      arrayItem(form0, 1),
      "subsequent values should be shifted"
    );
    t.equal(
      arrayItem(form1, 3),
      arrayItem(form0, 2),
      "subsequent values should be shifted"
    );

    t.end();
  });

  t.test("remove", (t: any) => {
    const [form1, removed] = form.remove(form0, array(form0), 1);
    form.assertStructure(form1);
    t.equal(form1.id, form0.id + 1);

    t.equal(removed, arrayItem(form0, 1), "should return deleted field");
    t.equal(
      arrayItem(form1, 0),
      arrayItem(form0, 0),
      "not deleted value should still be there"
    );
    t.equal(
      arrayItem(form1, 1),
      arrayItem(form0, 2),
      "not deleted value should still be there"
    );

    t.end();
  });

  t.test("pop", (t: any) => {
    const [form1, poped] = form.pop(form0, array(form0));
    form.assertStructure(form1);
    t.equal(form1.id, form0.id + 1);

    t.equal(
      poped,
      arrayItem(form0, 2),
      "should delete and return field of last item of array"
    );
    t.equal(
      arrayItem(form1, 0),
      arrayItem(form0, 0),
      "not poped value should still be there"
    );
    t.equal(
      arrayItem(form1, 1),
      arrayItem(form0, 1),
      "not poped value should still be there"
    );

    t.end();
  });

  t.end();
});
