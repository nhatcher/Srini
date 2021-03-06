let compiler = (function() {
    let compiler = {};
    const globalFunctions = [
        'sin',
        'cos',
        'log',
        'pow',
        'exp',
        'tan',
        'tanh',
        'cosh',
        'sinh',
        'atanh',
        'acosh',
        'asinh',
        'atan',
        'acos',
        'asin',
        'abs',
        'ceil',
        'floor',
        'max',
        'min',
        'sqrt',
        'erf',
        'erfc',
        'j0',
        'y0',
        'j1',
        'y1',
        'jn',
        'yn'
    ];
    
    const globalConstantsDict = {
        e: Math.E,
        pi: Math.PI
    }

    function deepCopy(expr) {
        return JSON.parse(JSON.stringify(expr));
    }

    function make_function_options(opt) {
        // default options
        let options = {
            color: 'black',
            width: 1
        };
        for (let i=0; i<opt.length; i++) {
            options[opt[i].key] = opt[i].value;
        }
        return options;
    }

    function make_plot_options(opt) {
        // default options
        let options = {
            ysoftmax: 100,
            ysoftmin: -100,
            axiscolor: 'grey',
            axiswithd: 1,
            gridcolor: 'lightgrey',
            gridwidth: 1,
            padding: {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
            }
        }
        for (let i=0; i<opt.length; i++) {
            options[opt[i].key] = opt[i].value;
        }
        // xrange is a must!
        if (!('xrange'  in options)) {
            throw new Error('Missing xrange!');
        }
        let xrange = options.xrange;
        if (!(xrange.length === 2 && typeof xrange[0] === 'number' && typeof xrange[1] == 'number')) {
            throw new Error('Invalid xrange!');
        }
        return options;
        
    }

    function getJSFunctionName(name) {
        if (globalFunctions.includes(name)) {
            if (name in math) {
                return 'math.' + name;
            } else {
                return 'Math.' + name;
            }
        } else {
            return name;
        }
    }

    function getJSVarName(name) {
        if (name in globalConstantsDict) {
            return globalConstantsDict[name] + '';
        } else {
            // TODO: this is error prone, but right now the name for the local variable in 'x' whatever is called elsewhere
            return 'x';
        }
    }

    function stringifyFormula(o) {
        // takes an object and returns a javascript valid expression
        switch(o.type) {
            case 'op':
                return '(' + stringifyFormula(o.children[0]) + o.value + stringifyFormula(o.children[1]) + ')';
                break;
            case 'function':
                let c = o.children;
                let args = [];
                for (let i=0; i<c.length; i++) {
                    args.push(stringifyFormula(c[i]));
                }
                return getJSFunctionName(o.value) + '(' + args.join(', ') + ')'
                break;
            case 'unary':
                return '-' + stringifyFormula(o.children[0]);
            case 'variable':
                return getJSVarName(o.value);
            case 'number':
                return o.value;
            default:
                throw new Error('Unexpected type: ' + o.type)

        }
    }

    function semantic_pass_function(node, variable, localVar, localFun, extraFun) {
        // checks that all functions and variables used are actually defined.
        let type = node.type;
        let name, c;
        if (variable in localVar) {
            throw new Error('Variable already in use: ' + variable);
        }
        switch (type) {
            case 'op':
                c = node.children;
                semantic_pass_function(c[0], variable, localVar, localFun, extraFun);
                semantic_pass_function(c[1], variable, localVar, localFun, extraFun);
            break;
            case 'unary':
               c = node.children;
               semantic_pass_function(c[0], variable, localVar, localFun, extraFun);
            break;
            case 'function_declaration':
                name = node.name;
                if (globalFunctions.includes(name)) {
                    throw new Error('Function already exists: ' + name);
                } else if (name in localFun) {
                    throw new Error('Function already exists: ' + name);
                }
            break;
            case 'function':
                name = node.value;
                if (!globalFunctions.includes(name)) {
                    if (!(name in localFun)) {
                        throw new Error('Undefined function name: ' + name);
                    }
                }
                c = node.children;
                for (let i=0; i<c.length; i++) {
                    semantic_pass_function(c[i], variable, localVar, localFun, extraFun);
                }
            break;
            case 'derivation':
                // We find the derivation of a function
                // We substitute by another function and we add the derivative to our list of functions.

                let value = node.value;
                let order = node.order;
                if (order !== 1) {
                    throw new Error ('Only first order derivatives have been implemented so far!');
                }
                let newValue = '_' + value;
                delete node.order;
                // f'(g(x)) --> _f(g(x))*g'(x)
                node.type = 'op';
                node.value = '*';
                let lhs = {
                    type: 'function',
                    value: newValue,
                    children: node.children
                }
                let rhs = cas.derivate(node.children[0]);
                node.children = [lhs, rhs];
                extraFun[newValue] = true;
            break;
            case 'variable':
                name = node.value;
                if (name !== variable) {
                    if (!(name in globalConstantsDict)) {
                        if (!(name in localVar)) {
                            throw new Error('Undefined variable name: ' + name)
                        }
                    }
                }

            break;
            case 'number':
            break;
            default:
                throw new Error('Unlown node type in expression: ' + type);
        }
    }
    function semantic_pass(ast, extraFunctions) {
        // We check that:
        //   1. Functions defined correctly
        //        f(x) = rts(x) is incorrect if rts has not been defined
        //        f(x) = a*x is incorrect if a has not been defined
        //   2. For now the command plot is the last command and there is only one
        //   3. The xrange is correctly specified.

        //  extraFunctions are derivatives found duriong the semantic pass
        // TODO: The semantic pass should also recognize variables from constants and marke them
        if (!ast.length) {
            throw new Error('Syntax error. Excpected list of statements');
        }
        let htLocalFunctions = {};
        let htLocalVariables = {};
        for (let i=0; i<ast.length; i++) {
            let node = ast[i];
            let type = node.type;
            if (type === 'function_declaration') {
                let name = node.name;
                let variable = node.variable;
                if (name in htLocalFunctions) {
                    throw new Error('Function already defined: ' + name);
                } else {
                    semantic_pass_function(node.expression, variable, htLocalVariables, htLocalFunctions, extraFunctions);
                    htLocalFunctions[name] = true;
                }
            } else if (type == 'plot_command') {
                if (i !== ast.length - 1) {
                    throw new Error('Plot must be the last command');
                }
                // TODO
            } else if (type == 'print') {
                // TODO
            }
        }
        return;
    }

    compiler.compile = function(code) {
        let ast = keith.parse(code);
        let symbolTable = {
          /*  constants: {}, // keeps track of user defined constants. Unused now
            functions: {}, // keeps track of user defined functions
            derivatives: {} // used derivatives*/
        };
        semantic_pass(ast, symbolTable);
        let options = {};
        let functions = '';
        let plot_functions = '';
        let plot_options = '';
        for (let i=0; i<ast.length; i++) {
            let node = ast[i];
            let type = node.type;
            if (type === 'function_declaration') {
                let name = node.name;
                let variable = node.variable;
                let expr = node.expression;
                let formulaString = stringifyFormula(expr);
                functions += `
    let ${name} = function(x) {
        return ${formulaString};
    };
    local['${name}'] = ${name};`;
                if (`_${name}` in symbolTable) {
                    let dexpr = cas.derivate(deepCopy(expr));
                    let formulaString = stringifyFormula(dexpr);
                    functions += `
    let _${name} = function(x) {
        return ${formulaString};
    };
    local['_${name}'] = _${name};`;
                }

            } else if (type === 'plot_command') {
                let list = node.list;
                let p_options = JSON.stringify(make_plot_options(node.options));
                plot_options = `let options = ${p_options}`;
                for (let i=0; i<list.length; i++) {
                    let fnon = list[i];
                    let f_value = fnon.value;
                    let f_options = JSON.stringify(make_function_options(fnon.options));
                    plot_functions += `functions.push({value:${f_value}, options:${f_options}});\n`;
                }

            } else if (type === 'print_statement') {
                let expr = node.expr;
                let formulaString = stringifyFormula(expr);
                functions += `terminal.showOutput(${formulaString});`;
            } else {
                throw new Error ('Invalid type of statement: ' + type);
            }
        }
        let program = `
(function(){
    let local = {};
    let functions = [];
    
${functions}

${plot_functions}

${plot_options}
    return {
        functions: functions,
        options: options
    };
})()`;
        var context = window.eval(program);
        return context;
    }
    compiler.stringifyFormula = stringifyFormula;
    return compiler;
})();