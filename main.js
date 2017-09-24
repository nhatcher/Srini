function main(event) {
    function resize() {
        var plot_area = document.querySelector('#plot-area');
        var plot_canvas = document.querySelector('#plot-canvas');
        plot_canvas.setAttribute('width', plot_area.clientWidth);
        plot_canvas.setAttribute('height', plot_area.clientHeight);
        update();
    }
    window.addEventListener('resize', () => { resize(); }, true);
    var editorEl = document.querySelector('#program-area textarea');
    function update() {
        plotter('plot-canvas', editor.getValue().trim());
    }
    var editor = CodeMirror.fromTextArea(editorEl, {
        lineNumbers: true
    });
    var program_area = document.querySelector('#program-area');
    editor.setSize(program_area.clientWidth, program_area.clientHeight);
    editor.on('blur', function() {
        update();
    });
    resize();
    let examples = [
        {
            title: 'sin function',
            program: 'f(x) = sin(x);\nplot(f, [-2,2]);'
        },
        {
            title: 'purple haze',
            program: `
f(x) = cos(x)*exp(pow(x, 2))/(1+abs(x));
plot({f, color="purple", width=3}, xrange=[-2,3]);`
        },
        {
            title: 'Two functions',
            program: `
f(x) = 3*x/(1+x*x)+sin(x)/x;
g(x) = 5*exp(-x*x)*pow(x, 2);

plot(
  [
    {f, color="#4F6BB8", width=8},
    {g, color="red"}
  ],
  xrange=[-5, 3]
);`
        }
    ];

    let exampleId = 0;
    let exampleTotal = examples.length;
    let exampleEl = document.getElementById('example');
    function showExample(i) {
        exampleEl.innerHTML = `<pre><code>${examples[i].program}</code></pre>`;
    }
    showExample(0);
    let nextExample = document.getElementById('next-example');
    nextExample.onclick = function() {
        exampleId++;
        if (exampleId === exampleTotal) {
            exampleId = 0;
        }
        showExample(exampleId);
    }
    let previousExample = document.getElementById('previous-example');
    previousExample.onclick = function() {
        exampleId--;
        if (exampleId === -1) {
            exampleId = exampleTotal - 1;
        }
        showExample(exampleId);
    }
    let copyExample = document.getElementById('copy-example');
    copyExample.onclick = function() {
        editor.setValue(examples[exampleId].program);
        update();
    }
}