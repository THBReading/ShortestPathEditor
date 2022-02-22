import { UIPanel } from './libs/ui.js';

function Viewport(editor) {
    var container = new UIPanel();
    container.setId('viewport');
    container.setPosition('absolute');

    document.addEventListener("keydown", function (event) {
        switch (event.key.toLowerCase()) {
            case 'z':
                if (false ? event.metaKey : event.ctrlKey) { //TODO: Add IS_MAC Check in place of false
                    event.preventDefault(); // Prevent browser specific hotkeys
                    editor.undo();
                }
                break;
            case 'y':
                if (false ? event.metaKey : event.ctrlKey) { //TODO: Add IS_MAC Check in place of false
                    event.preventDefault(); // Prevent browser specific hotkeys
                    editor.redo();
                }
                break;
        }
    })


    return container;
}

export { Viewport };

// hot half chicken + coleslaw + low carb side