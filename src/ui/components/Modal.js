import ConnectedComponent from '../base/ConnectedComponent.js';
import { createElement } from '../../utils/helpers.js';

/**
 * Base Modal component
 * Provides common modal functionality and structure
 */
export class Modal extends ConnectedComponent {
    constructor(store, eventBus, options = {}) {
        super(store, eventBus);
        this.modalId = options.modalId || 'modal';
        this.title = options.title || 'Modal';
        this.isOpen = false;
    }

    setupEventListeners() {
        super.setupEventListeners();
        
        // Listen for modal-specific events
        this.eventBus.on('modal:open', this.handleModalOpen.bind(this));
        this.eventBus.on('modal:close', this.handleModalClose.bind(this));
        this.eventBus.on('modal:toggle', this.handleModalToggle.bind(this));
    }

    handleModalOpen(modalId) {
        if (modalId === this.modalId) {
            this.open();
        }
    }

    handleModalClose(modalId) {
        if (!modalId || modalId === this.modalId) {
            this.close();
        }
    }

    handleModalToggle(modalId) {
        if (modalId === this.modalId) {
            this.toggle();
        }
    }

    open() {
        this.isOpen = true;
        this.render();
        this.eventBus.emit('modal:opened', this.modalId);
    }

    close() {
        this.isOpen = false;
        this.render();
        this.eventBus.emit('modal:closed', this.modalId);
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    handleBackdropClick(event) {
        if (event.target.classList.contains('modal')) {
            this.close();
        }
    }

    handleCloseClick() {
        this.close();
    }

    handleEscapeKey(event) {
        if (event.key === 'Escape' && this.isOpen) {
            this.close();
        }
    }

    renderContent() {
        // Override in child classes
        return createElement('div', { className: 'modal-body' }, [
            createElement('p', {}, ['Override renderContent in child class'])
        ]);
    }

    render() {
        const modalClass = this.isOpen ? 'modal open' : 'modal';
        
        this.element.innerHTML = '';
        this.element.appendChild(
            createElement('div', { 
                id: this.modalId,
                className: modalClass,
                style: this.isOpen ? 'display: flex;' : 'display: none;'
            }, [
                createElement('div', { className: 'modal-content beautiful-modal' }, [
                    createElement('button', { 
                        className: 'close-modal neon-x',
                        ariaLabel: 'Close',
                        onclick: this.handleCloseClick.bind(this)
                    }, ['×']),
                    createElement('h2', { 
                        style: 'color: #ffd700; text-align: center; margin-bottom: 1.5rem; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);'
                    }, [this.title]),
                    this.renderContent()
                ])
            ])
        );

        // Add backdrop click handler
        const modal = this.element.querySelector('.modal');
        if (modal) {
            modal.addEventListener('click', this.handleBackdropClick.bind(this));
        }

        // Add escape key handler
        if (this.isOpen) {
            document.addEventListener('keydown', this.handleEscapeKey.bind(this));
        } else {
            document.removeEventListener('keydown', this.handleEscapeKey.bind(this));
        }
    }

    mount(container) {
        super.mount(container);
        
        // Initial render
        this.render();
    }

    destroy() {
        // Clean up escape key listener
        document.removeEventListener('keydown', this.handleEscapeKey.bind(this));
        
        super.destroy();
    }
}
