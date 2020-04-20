const tap = require("tap");
import { lense } from "./lense";
import * as form from "./form";

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

  const initial_value = {
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
  const form0 = form.Form<MyForm>(initial_value);

  const root_lense = lense<MyForm>();
  const bar0 = root_lense.get("nested").get(0).get("bar");

  t.equals(
    root_lense.field(form0),
    form0.root,
    "root_lense.field return root field"
  );
  t.equals(
    root_lense.value(initial_value),
    initial_value,
    "root_lense.value return initial_value"
  );

  t.equals(
    bar0.field(form0),
    form0.root.children.nested.children[0].children.bar,
    "arbitrary path found in form"
  );
  t.equals(
    bar0.value(initial_value),
    initial_value.nested[0].bar,
    "arbitrary path found in value"
  );

  t.equals(
    root_lense.get("nested").get(0),
    root_lense.get("nested").get(0),
    "lense should be memoized"
  );
  t.equals(root_lense.get("nested").get(0).get("foo").path, "nested[0].foo");
  t.equals(
    root_lense.get("nested").get(1).get("bar").get(2).path,
    "nested[1].bar[2]"
  );

  t.end();
});
