const cas = (function() {
    const cas = {};
    function deepCopy(expr) {
        return JSON.parse(JSON.stringify(expr));
    }
    let functionsDirvatives = {
        sin: 'cos(x)',
        cos: '-sin(x)',
        log: '1/x',
        // pow:'n*pow(x, n-1)',
        exp: 'exp(x)',
        tan: '1+pow(tan(x), 2)',
        tanh: '1-pow(tanh(x), 2)',
        cosh: 'sinh(x)',
        sinh: 'cosh(x)',
        atanh: '1/(1-pow(x,2))',
        acosh: '1/sqrt(pow(x, 2)-1)',
        asinh: '1/sqrt(pow(x, 2)+1)',
        atan: '1/(1+pow(x,2))',
        acos: '-1/sqrt(1-pow(x, 2))',
        asin: '1/sqrt(1-pow(x, 2))',
        abs: 'x/abs(x)',
        ceil: '0',
        floor: '0',
        // max: '',
        // min: '',
        sqrt: 'pow(x, -1/2)/2',
        erf: '2*exp(-pow(x, 2))/sqrt(pi)',
        erfc: '-2*exp(-pow(x, 2))/sqrt(pi)',
        j0: '-j1(x)',
        y0: '-y1(x)',
        j1: '(j0(x)-jn(2, x))/2',
        y1: '(y0(x)-yn(2, x))/2',
        // jn: '(j(n - 1, x) - j(n + 1, x))/2',
        // yn: '(y(n - 1, x) - y(n + 1, x))/2'
    };
    function subtituteVar(expr, subs) {
        console.assert('children' in expr);
        let c = expr.children;
        for (let i=0; i<c.length; i++) {
            let e = c[i];
            if (e.type === 'variable')  {
                c[i] = subs;
            } else if ('children' in e) {
                subtituteVar(e, subs);
            }
        }
    }
    function derivateFunction(expr) {
        // f(g(x)) --> f'(g(x))*g'(x)
        let value = expr.value;
        if (value in functionsDirvatives) {
            let formula = functionsDirvatives[value];
            let lhs = keith.parse(`f(x) = ${formula};`)[0].expression;
            let subs = deepCopy(expr.children[0]);
            subtituteVar(lhs, subs);
            return {
                type: 'op',
                value: '*',
                children: [lhs, _derivate(expr.children[0])]
            };
        } else {
            let lhs = {
                type: 'function',
                value: '_' + value,
                children: deepCopy(expr.children)
            }
            return {
                type: 'op',
                value: '*',
                children: [lhs, _derivate(expr.children[0])]
            };
        }
        throw Error(`I do not know how to differentiate ${value} just yet`);

        /*switch (value) {
            case 'sin':
                // sin --> cos
                return {
                    type: 'function',
                    value: 'cos',
                    children: deepCopy(expr.children)
                }
            break;
            case 'cos': {
                // cos --> -sin
                return {
                    type: 'unary',
                    value: '-',
                    children: {
                        type: 'function',
                        value: 'sin',
                        children: deepCopy(expr.children)
                    }
                }
            }
        }*/

    }
    function derivateOperation(expr) {
        let left = expr.children[0];
        let right = expr.children[1];
        let leftp = _derivate(left);
        let rightp = _derivate(right);
        let value = expr.value;
        if (value === '+' || value === '-') {
            return {
                type: 'op',
                value: value,
                children: [leftp, rightp]
            }
        } else if (value === '*') {
            // f*g --> f'*g+f*g'
            return {
                type: 'op',
                value: '+',
                children:[
                    {
                        type: 'op',
                        value: '*',
                        children: [leftp, right]
                    },
                    {
                        type: 'op',
                        value: '*',
                        children: [left, rightp]
                    }
                ]
            }
        } else if (value === '/') {
            // f/g --> (f'*g-f*g')/pow(g, 2)
            return {
                type: 'op',
                value: '/',
                children:[
                    {
                        type: 'op',
                        value: '-',
                        children:[
                            {
                                type: 'op',
                                value: '*',
                                children: [leftp, right]
                            },
                            {
                                type: 'op',
                                value: '*',
                                children: [left, rightp]
                            }
                        ]

                    },
                    {
                        type: 'function',
                        value: 'pow',
                        children: [right, {type:'number', value:2}]
                    }
                ]
            }
        }
    }

    function _derivate(expr) {
        let type = expr.type;
        switch (type) {
            case 'op':
                return derivateOperation(expr);
            break;
            case 'function':
                return derivateFunction(expr);
            break;
            case 'unary':
                throw new Error('Non implemented: ' + type);
            break;
            case 'number':
                return {type: 'number', value:0};
            break;
            case 'variable':
                return {type: 'number', value:1};
                // return {type: 'variable', value:expr.value};
            break;
            case 'derivation':
                // TODO
                throw new Error('Non implemented: ' + type);
            break;
            default:
                throw new Error('Invalid node type: ' + type);
            break;
        }

    }
    function simplify(expr) {
        // 1*x --> x;
        // x+0 --> x;
        // so on so forth;
        // TODO!!
        return expr;
    }

    const derivate =  function(expr) {
        let result = _derivate(expr);
        return simplify(result);
    }

    cas.derivate = derivate;

    return cas;
})();

function test_derivate(str) {
    let o = keith.parse(`f(x) = ${str};`);
    let expr = o[0].expression;
    let ret = cas.derivate(expr);
    console.log(compiler.stringifyFormula(ret));
}