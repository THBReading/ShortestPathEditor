import { UIElement } from './libs/ui.js';

function Resizer(editor) {

    const signals = editor.signals;

    const dom = document.createElement('div');
    dom.id = 'resizer';

    dom.ownerDocument.addEventListener('dblclick', onDblClick, false);

    function onPointerDown(event) {

        if (event.isPrimary === false) return;

        dom.ownerDocument.addEventListener('pointermove', onPointerMove, false);
        dom.ownerDocument.addEventListener('pointerup', onPointerUp, false);

    }

    function onPointerUp(event) {

        if (event.isPrimary === false) return;

        dom.ownerDocument.removeEventListener('pointermove', onPointerMove);
        dom.ownerDocument.removeEventListener('pointerup', onPointerUp);

    }

    function onPointerMove(event) {

        // PointerEvent's movementX/movementY are 0 in WebKit

        const snap = editor.settings.sidebarSnap;

        if (event.isPrimary === false) return;

        const offsetWidth = document.body.offsetWidth;

        const clientX = event.clientX;

        const cX = clientX < 0 ? 0 : clientX > offsetWidth ? offsetWidth : clientX;

        let x = offsetWidth - cX;

        if (x < snap / 2) {

            x = 0;

        } else if (x < snap && x >= snap / 2) {

            x = snap;

        }

        dom.style.right = x + 'px';

        if (x === 0) {

            dom.classList.add("collapsed");

        } else {

            dom.classList.remove("collapsed");

        }


        document.getElementById('sidebar').style.width = x + 'px';
        // document.getElementById( 'player' ).style.right = x + 'px';
        // document.getElementById( 'script' ).style.right = x + 'px';
        document.getElementById('viewport').style.right = x + 'px';

        signals.windowResize.dispatch();

    }

    function onDblClick(event) {

        // PointerEvent's movementX/movementY are 0 in WebKit

        const snap = editor.settings.sidebarSnap;

        if (event.isPrimary === false) return;

        let x = dom.style.right === '0px' ? snap : 0;

        if (x === 0) {

            dom.classList.add("collapsed");

        } else {

            dom.classList.remove("collapsed");

        }

        dom.style.right = x + 'px';

        document.getElementById('sidebar').style.width = x + 'px';
        // document.getElementById( 'player' ).style.right = x + 'px';
        // document.getElementById( 'script' ).style.right = x + 'px';
        document.getElementById('viewport').style.right = x + 'px';

        signals.windowResize.dispatch();

    }

    dom.addEventListener('pointerdown', onPointerDown, false);

    return new UIElement(dom);

}

export { Resizer };