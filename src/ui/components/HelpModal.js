import { Modal } from './Modal.js';
import { createElement } from '../../utils/helpers.js';

/**
 * HelpModal component
 * Provides instructions and tips for the game
 */
export class HelpModal extends Modal {
    constructor(store, eventBus, options = {}) {
        super(store, eventBus, { 
            modalId: options.modalId || 'help-modal', 
            title: options.title || 'Game Help'
        });
    }

    // Override renderContent to display help content
    renderContent() {
        return createElement('div', { className: 'modal-body help-content' }, [
            createElement('h3', {}, ['Welcome to Jeopardish!']),
            createElement('p', {}, ['Here’s how to play:']),
            createElement('ul', {}, [
                createElement('li', {}, ['Read the question carefully.']),
                createElement('li', {}, ['Use the input to type your answer.']),
                createElement('li', {}, ['Submit your answer before time runs out.']),
                createElement('li', {}, ['Earn points for correct answers.']),
                createElement('li', {}, ['Check your stats and progress in the StatsModal.']),
            ]),
            createElement('p', {}, ['Happy playing!'])
        ]);
    }
}

