function getJSFunctionName(name) {
    switch(name) {
       case 'sin':
       case 'cos':
       case 'log':
       case 'pow':
       case 'exp':
       case 'tan':
       case 'tanh':
       case 'cosh':
       case 'sinh':
       case 'atanh':
       case 'acosh':
       case 'asinh':
       case 'atan':
       case 'acos':
       case 'asin':
       case 'abs':
       case 'ceil':
       case 'floor':
       case 'max':
       case 'min':
       case 'sqrt':
           return 'Math.' + name;
    default:
       throw new Error('Undefined function ' + name);
    }
}
function getJSVarName(name) {
    var knownValues = {
        "PI": Math.PI,
        "E": Math.E
    }
    if (name in knownValues) {
        return knownValues[name] + '';
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
        case 'var':
            return getJSVarName(o.value);
        case 'number':
            return o.value;
        default:
            throw new Error('Unexpected type: ' + o.type)

    }
}
function plotter(canvasId, options) {
    var canvas = document.getElementById(canvasId);
    var width = canvas.width;
    var height = canvas.height;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var options_default = {
        xmin: -5,
        xmax: 5,
        yaxes: {
            auto: true
        },
        linecolor: 'red',
        axiscolor: 'grey',
        padding: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        },
        f: 'x*x'
    }
    // set defaults
    Object.keys(options_default).forEach(function(key) {
        if (!(key in options)) {
          options[key] = options_default[key];
        }
    });
    var program = calculator.parse(options.f);
    options.xmin = program.xmin;
    options.xmax = program.xmax;
    var formula = stringifyFormula(program.expression);

    var sin = Math.sin,
        cos = Math.cos,
        log = Math.log,
        pow = Math.pow;
    eval('var f = function(x) { return ' + formula + ';}');
    var xmin = options.xmin,
        xmax = options.xmax,
        xwidth = xmax - xmin;
        plotwidth = width - options.padding.left - options.padding.right;
        xscale = plotwidth/xwidth;

    var ret = plot(f, options.xmin, options.xmax);
    var ymin = ret.ymin,
        ymax = ret.ymax,
        yheight = ymax - ymin,
        plotheight = height - options.padding.top - options.padding.bottom;
        yscale = plotheight/yheight;

    function getScreenX(x) {
        return (x - xmin)*xscale + options.padding.left;
    }
    function getScreenY(y) {
        return height - ((y - ymin)*yscale + options.padding.bottom);
    }


    // axes
    var x0 = getScreenX(0);
    var y0 = getScreenY(0);
    ctx.strokeStyle = options.axiscolor;
    ctx.beginPath();
    ctx.moveTo(getScreenX(xmin), y0);
    ctx.lineTo(getScreenX(xmax), y0);
    ctx.moveTo(x0, getScreenY(ymin));
    ctx.lineTo(x0, getScreenY(ymax));
    ctx.stroke();
    
    var datax = ret.datax,
        datay = ret.datay;
        l = datax.length;
    ctx.strokeStyle = options.linecolor;
    ctx.beginPath();
    ctx.moveTo(getScreenX(datax[0]), getScreenY(datay[0]));
    for (var i=1; i<l; i++) {
        x = getScreenX(datax[i]);
        y = getScreenY(datay[i]);
        ctx.lineTo(x, y);
    }
    ctx.stroke();
};

function plot(f, xmin, xmax) {
    var N = 10000; 
    var ymin = f(xmin),
        ymax = ymin,
        step = (xmax-xmin)/N;
        datax = [],
        datay = [];

    if (isNaN(ymin)) {
        // In case the initial point is 0/0
        ymin = f(xmin + step);
        ymax = ymin;
    }
    var x, y;
    for (x=xmin; x<=xmax; x += step) {
        y = f(x);
        if (isNaN(y)){
            continue;
        }
        if (y<ymin) {
            ymin = y;
        }
        if (y>ymax) {
            ymax = y;
        }
        datax.push(x)
        datay.push(y);
    }
    return {
        ymax: ymax,
        ymin: ymin,
        step: step,
        datax: datax,
        datay: datay
    }
}