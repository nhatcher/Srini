var plotter = (function() {

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

    function getPrettyTicks(xmin, xmax, width) {
        // This function gives a hint of a good set of marks.
        var spacing = 50; // we guess that a nice spacing is ~ 20px;
        var tick_number = width/spacing; // aprox number of ticks
        var step = (xmax-xmin)/tick_number; // approx size of a step
        var s = step.toExponential();
        var expt = s.split('e')[1];
        // the step is going to be in multiples of 2, 5 or 10
        var firstdigit = parseInt(s[0], 10);
        if (firstdigit<=2) {
            step = parseFloat('2e' + expt);
        } else if(firstdigit<=5) {
            step = parseFloat('5e' + expt);
        } else {
            step = parseFloat('10e' + expt);
        }
        // Now we have the exact step, we look for the first multiple of the step
        var xstart = Math.floor(xmin/step);
        if (xstart < 0) {
            xstart += step;
        }
        var ticks = [];
        for (var x=xstart; x<xmax; x += step) {
            ticks.push(x);
        }
        return ticks;
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

        // FIXME: Hard eval the function
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

        // grid
        var xticks = getPrettyTicks(xmin, xmax, width);
        var yticks = getPrettyTicks(ymin, ymax, height);
        
        ctx.strokeStyle = 'lightgrey';
        ctx.beginPath();
        for (var i=0; i<xticks.length; i++) {
            x = getScreenX(xticks[i]);
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (var i=0; i<yticks.length; i++) {
            y = getScreenY(yticks[i]);
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

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

        // function
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
            step = (xmax-xmin)/N,
            datax = [],
            datay = [],
            x, y;

        if (isNaN(ymin)) {
            // In case the initial point is 0/0
            // That's an indeterminate, we should be able to deal with that
            // FIXME: Also this might also break. It could potentially be an indeterminate
            ymin = f(xmin + step);
            ymax = ymin;
        }

        for (x=xmin; x<=xmax; x += step) {
            y = f(x);
            if (isNaN(y)){
                // 0/0 
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

    return plotter;

})();
