// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Simple = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Array = any[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Object = { [s: string]: any };

// eslint-disable-next-line @typescript-eslint/ban-types
export type Multi = Array | Object;

// eslint-disable-next-line @typescript-eslint/ban-types
export type Any = Simple | Array | Object;
