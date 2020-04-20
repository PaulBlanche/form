import * as React from "react";
import { UseForm, FieldOptions, FieldOf } from "./useForm";
import { Lense } from "./lense";

export const fieldContext = React.createContext<
  UseForm<any>["useField"] | undefined
>(undefined);

type FormProps<VALUE> = {
  children: React.ReactNode;
  field: UseForm<VALUE>["useField"];
};
export function FormProvider<VALUE>({
  children,
  field,
}: FormProps<VALUE>): React.ReactElement<FormProps<VALUE>> {
  return (
    <fieldContext.Provider value={field}>{children}</fieldContext.Provider>
  );
}

export function useField<VALUE, FIELD_VALUE>(
  lense: Lense<VALUE, FIELD_VALUE>,
  options?: FieldOptions<VALUE, FIELD_VALUE>
): FieldOf<FIELD_VALUE> {
  const field = React.useContext(fieldContext);
  if (field === undefined) {
    throw Error("useField can only be used within a <FormProvider>");
  }

  return field(lense, options);
}
