export type Validate<VALUE> = (value: VALUE) => Promise<string[]> | string[];
