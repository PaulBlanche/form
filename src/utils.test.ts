const tap = require('tap')
import { get_path, invariant } from './utils';

tap.test('invariant', (t:any) => {
    t.throws(() => invariant(false, 'message'), /^Invariant failed: message$/, 'false invariant should throw with the given message')
    t.throws(() => invariant(false, ''), /^Invariant failed: $/, 'false invariant withou message should throw with no message')
    invariant(true, 'true invariant should not throw')

    const old = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    t.throws(() => invariant(false, 'message'), /^Invariant failed$/, 'false invariant in production should throw without message')
    process.env.NODE_ENV = old

    t.end()
})

tap.test('get_path', (t:any) => {
    const object = {
        a: [
            { b: { c: [ 'toto', { t: 1} ] } },
            true,
            { c: [ { d: 1 }, { e:'tata' } ] },
            undefined,
            { d: undefined }
        ],
        b: 'toto'
    } as const

    t.equals(get_path(object, ['a', 2, 'c', 1, 'e']), object.a[2].c[1].e, "should find nested path")

    t.equals(get_path(object, ['a', 3 ]), object.a[3], "should find existing path event if value is undefined")
    t.equals(get_path(object, ['a', 4, 'd' ]), object.a[4].d, "should find existing path event if value is undefined")

    t.throws(() => get_path(object, ['c']), "should not find path that does not exists")
    t.throws(() => get_path(object, [1]), "should not find path that does not exists")
    t.throws(() => get_path(object, ['a', 4, 'foo']), "should not find path that does not exists")
    t.throws(() => get_path(object, ['b', 1]), "should not find not in an object or array")

    t.end()
})

