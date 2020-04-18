import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as form from "../index"
import "regenerator-runtime/runtime.js";

type Form = {
    first_name: string,
    last_name: string,
    age: number,
    phone: { 
        country: string,
        number: string
    },
    orders: {
        product: string,
        quantity: number
    }[]
}

const NETWORK_QUALITY = 1000;

function Form() {
    const myform = form.useForm<Form>({
        first_name: '',
        last_name: '',
        age: 10,
        phone: {
            country: '',
            number: ''
        },
        orders: []
    }, value => { 
        console.log('submit', value)
    })

    const first_name = myform.useField(myform.get('first_name'), {
        validate : delay((value) => {
            if (value === '') {
                return ['this value is required']
            }
            return []
        }, Math.random() * NETWORK_QUALITY)
    })
    const last_name = myform.useField(myform.get('last_name'), {
        validate: delay((value) => {
            if (value === '') {
                return ["this value is required"]
            }
            return []
        }, Math.random() * NETWORK_QUALITY)
    })
    const age = myform.useField(myform.get('age'), {
        validate: delay((value) => {
            if (value < 10) {
                return ['You must be at least 10']
            }
            if (value > 70) {
                return ['You are too old']
            }
            return []
        }, Math.random() * NETWORK_QUALITY)
    })
    const phone = myform.useField(myform.get('phone'))
    const orders = myform.useField(myform.get('orders'), {
        validate: delay((value) => {
            const total = value.reduce((total, order) => {
                return total + order.quantity
            }, 0)
            if (value.length === 0) {
                return ['You must make at least 1 order']
            }
            if (value.length > 5) {
                return ["You can't make more than 5 orders"]
            }
            if (total > 10) {
                return ["You can't order more than 10 products total"]
            }
            return []
        }, Math.random() * NETWORK_QUALITY)
    })

    return <form noValidate onSubmit={myform.submit}>
        <form.FormProvider field={myform.useField}>
            <fieldset>
                <div>
                    <fieldset>
                        <label><span>First Name</span><input
                            type="text"
                            value={first_name.value()}
                            onChange={evt => first_name.onChange(evt.target.value)}
                            onBlur={first_name.onBlur}
                        /></label>
                        <FieldState field={first_name} />
                    </fieldset>
                    <fieldset>
                        <label><span>Last Name</span><input
                            type="text"
                            value={last_name.value()}
                            onChange={evt => last_name.onChange(evt.target.value)}
                            onBlur={last_name.onBlur}
                        /></label>
                        <FieldState field={last_name} />
                    </fieldset>
                    <fieldset>
                        <label><span>Age</span><input
                            type="number"
                            value={age.value()}
                            onChange={evt => {
                                const raw_value = evt.target.value;
                                const value = Number(raw_value);
                                if (raw_value !== '' && !Number.isNaN(value)) {
                                    age.onChange(value)
                                } else {
                                    age.onChange(10)
                                }
                            }}
                            onBlur={age.onBlur}
                        /></label>
                        <FieldState field={age} />
                    </fieldset>
                    <Phone
                        phone={phone}
                    />
                </div>
                {<Orders
                    orders={orders}
                />}
                <FieldState field={myform} />
            </fieldset>
        </form.FormProvider>
        <button type="submit">Envoyer</button>
    </form>
}

type PhoneProps = { phone:form.ObjectField<Form['phone']> }
const Phone = function Phone({ phone }: PhoneProps) {
    const country = form.useField(phone.get('country'))
    const number = form.useField(phone.get('number'), {
        validate: delay((value) => {
            if (value === '') {
                return ["this value is required"]
            }
            if (String(Number(value)) !== value) {
                return ['you must enter a valid phone number']
            }
            return []
        }, Math.random() * NETWORK_QUALITY),
    })

    return <fieldset>
        <div>
            <fieldset>
                <label><span>Country</span><input
                    type="text"
                    value={country.value()}
                    onChange={evt => country.onChange(evt.target.value)}
                    onBlur={country.onBlur}
                /></label>
                <FieldState field={country} />
            </fieldset>
            <fieldset>
                <label><span>Number</span><input
                    type="text"
                    value={number.value()}
                    onChange={evt => number.onChange(evt.target.value)}
                    onBlur={number.onBlur}
                /></label>
                <FieldState field={number} />
            </fieldset>
        </div>
        <FieldState field={phone} />
    </fieldset>
}

type Orders = { orders: form.ArrayField<Form['orders']> }
function Orders({ orders }:Orders) {
    return <fieldset>
        {orders.map((i, array) => {
            const order = form.useField(orders.get(i))
            return <Order
                key={i}
                move={{
                    up: () => {
                        if (i !== 0) {
                            orders.array.move(i, i-1)
                        }
                    },
                    down: () => {
                        if (i !== array.length - 1) {
                            orders.array.move(i, i+1)
                        }
                    }
                }}
                order={order}
            />
        })}
        <button type="button" onClick={() => orders.array.push({ product:'', quantity: 0 })}>Add order</button>
        <FieldState field={orders} />
    </fieldset>

}

type OrderProps = { move:{ up:() => void, down:() => void }, order: form.ObjectField<Form['orders'][number]> }
const Order = function Order({ move, order }:OrderProps) {
    const [disabled, setDisabled] = React.useState(false);
    const product = form.useField(order.get('product'), {
        validable: !disabled
    })
    const quantity = form.useField(order.get('quantity'), {
        validate: delay<number, string[]>(value => {
            if (value <= 0) {
                return ['quantity must be > 0']
            }
            return []
        }, Math.random() * NETWORK_QUALITY),
        validable: !disabled
    })

    return <fieldset>
        <button type="button" onClick={move.up}>Move Up</button>
        <button type="button" onClick={move.down}>Move Down</button>
        <button type="button" onClick={() => setDisabled(!disabled)}>Toggle</button>
        <fieldset>
            <label><span>Product</span><input
                type="text"
                value={product.value()}
                onChange={evt => product.onChange(evt.target.value)}
                onBlur={product.onBlur}
            /></label>
            <FieldState field={product} />
        </fieldset>
        <fieldset>
        <label><span>Quantity</span><input
                type="number"
                value={quantity.value()}
                onChange={evt => {
                    const raw_value = evt.target.value;
                    const value = Number(raw_value);
                    if (raw_value !== '' && !Number.isNaN(value)) {
                        quantity.onChange(value)
                    } else {
                        quantity.onChange(0)
                    }
                }}
                onBlur={quantity.onBlur}
            /></label>
            <FieldState field={quantity} />
        </fieldset>
        <FieldState field={order} />
    </fieldset>
}


type FieldStateProps<VALUE> = {
    field: form.FieldOf<VALUE>
}

function FieldState<VALUE>({ field }: FieldStateProps<VALUE>): React.ReactElement<FieldStateProps<VALUE>> {
   return <div>
        <div>id: {field.meta.id}</div>
        <div>error: {field.meta.errors.join('')}</div>
        <div>validity: {field.valid() ? 'true' : 'false'}</div>
        <div>value: <pre>{JSON.stringify(field.value(), null, 2)}</pre></div>
        <div>dirty: {field.meta.dirty ? 'true' : 'false'}</div>
        <div>touched: {field.meta.touched ? 'true' : 'false'}</div>
        <div>validable: {field.meta.validable ? 'true' : 'false'}</div>
    </div>
}

ReactDOM.render(<Form/>, document.getElementById('app'))

function delay<A,B>(fn:(a:A)=>B, delay:number): (a:A) => Promise<B> {
    return a => {
        return new Promise((res) => {
            setTimeout(() => res(fn(a)), delay)
        })
    }
}