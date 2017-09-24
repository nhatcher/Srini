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
}