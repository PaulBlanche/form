export function get_path<RESULT>(object:any, path:(string|number)[], message?:string): RESULT {
    try {
        let current = object;
        const done: (string|number)[] = []
        for (const prop of path) {
            done.push(prop)
            if (Array.isArray(current)) {
                invariant(typeof prop === 'number' , `can't find string key in array (after ${done.join('.')})`)
                invariant(prop < current.length, `can't find index exceeding array length (after ${done.join('.')})`)
                current = current[prop];
            } else if (typeof current === 'object') {
                invariant(typeof prop === 'string' , `can't find number key in object (after ${done.join('.')})`)
                invariant(current.hasOwnProperty(prop), `can't find key that is not object ownProperty (after ${done.join('.')})`)
                current = current[prop];
            } else {
                invariant(false, `cant't search path if object is not array or object`)
            }
        }
        return current;
    } catch (cause) {
        throw new Error(`can't find path ${path.join('.')} in object : ${cause.message}`)
    }
}

export function invariant(condition:boolean, message?:string): asserts condition {
    if (condition) {
        return;
    }


    if (process.env.NODE_ENV === 'production') {
        throw new Error('Invariant failed');
    }

    throw new Error(`Invariant failed: ${message || ''}`);
}

