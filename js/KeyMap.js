function KeyMap(editor, graphEditor, sidebar) {
    var Signal = signals.Signal;
    var thisGraph = graphEditor;
    var MODES = editor.MODES;
    document.addEventListener('keydown', (event) => {
        var name = event.key.toLowerCase();
        var code = event.code;
        // Alert the key name and key code on keydown
        // console.log(`Key pressed ${name}`);

        switch (name) {
            case 'delete':
            case 'backspace':
                thisGraph.deleteSelected();
                break;
            case 'a':
                if (event.ctrlKey) {
                    thisGraph.select(d3.selectAll("." + thisGraph.consts.circleGClass + ", .edge"));
                }
                break;
            case 'i':
                sidebar.select('info');
                break;
            case 's':
                sidebar.select('settings');
                break;


            case 's':
                if (event.ctrlKey) {
                    event.preventDefault();
                }
                break;
            case 'z':
                if (event.ctrlKey) {
                    editor.undo();
                }
                break;
            case 'y':
                if (event.ctrlKey) {
                    editor.redo();
                }
                break;

            case 'shift':
                thisGraph.editor.state.mode = MODES.create;
                break;
            case 'ctrl':
                break;
            case 'alt':
                break;

        }
    }, false);

    document.addEventListener('keyup', (event) => {
        var name = event.key;
        var code = event.code;
        // Alert the key name and key code on keydown
        // console.log(`Key Up ${name}`);
        thisGraph.editor.state.keyDown = [];
        thisGraph.editor.state.lastKeyDown = -1;
        thisGraph.editor.state.mode = MODES.current;

        switch (name) {
            case 'Shift':
                //thisGraph.editor.state.mode = MODES.default;
                break;
        }
    }, false);
}

export { KeyMap };