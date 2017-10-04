const terminal = (function() {
    const self = {};
    const output = document.getElementById('console-output');
    const debug = document.getElementById('console-debug');
    const output_button = document.querySelectorAll('#console-tabs span')[0];
    const debug_button = document.querySelectorAll('#console-tabs span')[1];
    self.showOutput = function() {

    }

    self.showDebug = function(e) {
        debug.innerText = e.toString();
    }

    output_button.onclick = function() {
        let classList = output_button.classList;
        if (classList.contains('selected')) {
            return;
        }
        classList.add('selected');
        debug_button.classList.remove('selected');
        output.style.visibility = 'hidden';
        debug.style.visibility = 'visible' ;
    }
    debug_button.onclick = function() {
        let classList = debug_button.classList;
        if (classList.contains('selected')) {
            return;
        }
        classList.add('selected');
        output_button.classList.remove('selected');
        debug.style.visibility = 'visible';
        output.style.visibility = 'hidden' ;
    }
    return self;
})();