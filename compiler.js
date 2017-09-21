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
        'sqrt'
    ];
    
    const globalConstantsDict = {
        e: Math.E,
        pi: Math.PI
    }

    function getJSFunctionName(name) {
        if (globalFunctions.includes(name)) {
            return 'Math.' + name;
        } else {
            throw new Error('Undefined function ' + name);
        }
    }

    function getJSVarName(name) {
        if (name in globalConstantsDict) {
            return globalConstantsDict[name] + '';
        } else {
            return name;
        }
    }

    function stringifyFormula(o) {
        switch(o.type) {
            case 'op':
                return '(' + stringifyFormula(o.children[0]) + o.value + stringifyFormula(o.children[1]) + ')';
                break;
            case 'function':
                return getJSFunctionName(o.value) + '(' + stringifyFormula(o.children) + ')'
                break;
            case 'unary':
                return '-' + stringifyFormula(o.children);
            case 'variable':
                return getJSVarName(o.value);
            case 'number':
                return o.value;
            default:
                throw new Error('Unexpected type: ' + o.type)

        }
    }

    function semantic_check_function(node, variable, localVar, localFun) {
        // checks that all functions and variables used are actually defined.
        let type = node.type;
        if (variable in localVar) {
            throw new Error('Variable already in use: ' + variable);
        }
        switch (type) {
            case 'op':
                let c = node.children;
                semantic_check_function(c[0], variable, localVar, localFun);
                semantic_check_function(c[1], variable, localVar, localFun);
            break;
            case 'unary':
               semantic_check_function(c[0], variable, localVar, localFun);
            break;
            case 'function':
                let name = node.value;
                if (!globalFunctions.inludes(name)) {
                    if (!(name in localFun)) {
                        throw new Error('Undefined function name: ');
                    }
                }
            break;
            case 'variable':
                let name = node.value;
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
    function semantic_check(ast) {
        // We check that:
        //   1. Functionas defined correctly
        //        f(x) = rts(x) is incorrect if rts has not been defined
        //        f(x) = a*x is incorrect if a has not been defined
        //   2. For now the command plot is the last command and there is only one
        //   3. The xrange is correctly specified.
        if (!ast.length) {
            throw new Error('Syntax error. Excpected list of statements');
        }
        var htLocalFunctions = {};
        var htLocalVariables = {};
        for (let i=0; i<ast.length; i++) {
            let node = ast[i];
            let type = node.type;
            if (type === 'function_declaration') {
                let name = node.name;
                let variable = node.variable;
                if (name in htLocalFunctions) {
                    throw new Error('Function already defined: ' + name);
                } else {
                    semantic_check_function(node, variable, htLocalVariables, htLocalFunctions);
                    htLocalFunctions[name] = true;
                }
            } else if (type == 'plot_command') {
                if (i !== ast.length - 1) {
                    throw new Error('Plot must be the last command');
                }
                // TODO
            }
        }
        return;
    }
    function fillDefaults(options) {
        let defaultOptions = {
            
        }
        return options;
    }
    compiler.compile = function(code) {
        let ast = keith.parse(code);
        semantic_check(ast);
        let options = {};
        let funtions = [];
        for (let i=0; i<ast.length; i++) {
            let node = ast[i];
            let type = node.type;
            if (type === 'function_declaration') {
                let name = node.name;
                let variable = node.variable;
                let expr = node.expression;
                let formulaString = stringifyFormula(expr);
                functions += `
    let ${name} = function () {
        return ${formulaString};
    };
    local['${name}'] = ${name};`;

            } else if (type === 'plot_command') {
                let funs = node.arguments;
                let options = fillDefaults(node.options);

            } else {
                throw new Error ('Invalid type of statement: ' + type);
            }
        }
        let program = `
(function(){
    let context = {};
    let local = {};
    
${functions}

    return context;
})()`;
        var context = window.eval(program);
        return context;
    }
    return compiler;
})();