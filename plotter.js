var plotter = (function() {

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
        var xstart = Math.floor(xmin/step)*(step);
        if (xstart < 0) {
            xstart += step;
        }
        var ticks = [];
        for (var x=xstart; x<xmax; x += step) {
            ticks.push(x);
        }
        return ticks;
    }
    function notifyPosition(x, y) {
        var info = document.getElementById('info');
        x = x.toPrecision(3);
        y = y.toPrecision(3);
        info.textContent = `x: ${x}, y:${y}`;
    }
    function getSafeLabel(value, scale) {
        // returns a safe label for a number
        // 14.9999999  --> 15
        // If number is really close to zero, we check if the general scale
        // is close to zero
        var s = parseFloat(value.toPrecision(14));
        if (Math.abs(s)<1e-14 && scale>1e-10) {
            s = 0;
        }
        return s + '';
    }
    function plotter(canvasId, options) {
        var canvas = document.getElementById(canvasId);
        var plot_area = document.getElementById('plot-area');
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

        let context = compiler.compile(options.program);
        window.ccc = context;
        let context_options = context.options;

        let xmin = options.xmin,
            xmax = options.xmax,
            xwidth = xmax - xmin;
            plotwidth = width - options.padding.left - options.padding.right;
            xscale = plotwidth/xwidth;

        // TODO: Only plots first function
        let f = context['functions'][0].value;
        let function_options = context['functions'][0].options;
        // FIXME: So far ignores all arguments
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
        function getPlotX(x) {
            return (x-options.padding.left)/xscale + xmin;
        }
        function getPlotY(y) {
            return (-y+height-options.padding.bottom)/yscale + ymin;
        }
        // grid
        var xticks = getPrettyTicks(xmin, xmax, width);
        var yticks = getPrettyTicks(ymin, ymax, height);
        
        ctx.strokeStyle = 'lightgrey';
        ctx.beginPath();
        ctx.font = '12px monospace';
        for (var i=0; i<xticks.length; i++) {
            // line
            x = getScreenX(xticks[i]);
            y = getScreenY(0);
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            // label
            var label = getSafeLabel(xticks[i], xmax-xmin);
            ctx.fillText(label, x, y + 12);
            // ticks
            ctx.moveTo(x, y + 10);
            ctx.lineTo(x, y - 10);
        }
        for (var i=0; i<yticks.length; i++) {
            // line
            y = getScreenY(yticks[i]);
            x = getScreenX(0);
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            // label
            var label = getSafeLabel(yticks[i], ymax-ymin);
            ctx.fillText(label, x + 2, y - 3);
            // ticks
            ctx.moveTo(x - 10, y);
            ctx.lineTo(x + 10, y);
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
        function getMousePos(canvas, evt) {
            var rect = canvas.getBoundingClientRect();
            return {
              x: evt.clientX - rect.left,
              y: evt.clientY - rect.top
            };
          }
        var rect = canvas.getBoundingClientRect();
        var vertical_hint = document.getElementById('vertical-hint');
        var horizontal_hint = document.getElementById('horizontal-hint');
        plot_area.addEventListener('mousemove', function(evt) {
            var mouseX = (evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width;
            var mouseY = (evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height;
            var plotX = getPlotX(mouseX);
            var plotY = getPlotY(mouseY);
            vertical_hint.style.left = mouseX + 'px';
            horizontal_hint.style.top = mouseY + 'px';

            notifyPosition(plotX, plotY);
        });
        plot_area.addEventListener('mouseleave', function(evt) {
            vertical_hint.style.left = '-1px';
            horizontal_hint.style.top = '-1px';
        });
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
