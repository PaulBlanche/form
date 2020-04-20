const tap = require("tap");
import { useForm } from "./useForm";
import { renderHook, act } from "@testing-library/react-hooks";

tap.test("change", async (t: any) => {
  type MyForm = {
    simple: number;
    object: {
      foo: string;
      bar: boolean;
    };
    array: string[];
    nested: { bar: number[]; foo: string }[];
  };

  const calls: string[] = [];
  const formHook = renderHook(() =>
    useForm(
      {
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
      },
      () => {
        calls.push("submit");
      },
      () => {
        calls.push("validate root");
        return [];
      }
    )
  );

  const form0 = formHook.result.current;

  let fieldHook = renderHook(() =>
    form0.useField(form0.get("nested").get(0), {
      validate: () => {
        calls.push("validate field 1");
        return [];
      },
    })
  );
  const field0 = fieldHook.result.current;

  const update = { bar: [5, 6, 7], foo: "bazbar" };
  act(() => field0.onChange(update));

  await formHook.waitForNextUpdate();

  fieldHook = renderHook(() => form0.useField(form0.get("nested").get(0)));
  const field1 = fieldHook.result.current;

  t.same(field1.value(), update);
  t.same(calls, ["validate field 1", "validate"]);
  t.end();
});
