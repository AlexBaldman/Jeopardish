(function initCreativeRoom(documentRef) {
  'use strict';

  const DIRECTIONS = {
    'channel-o': {
      label: 'CHANNEL O / XANDER TREFLECK',
      rationale: 'The most ownable bridge between prestige trivia, parody, mystery, and the interchangeable O.',
    },
    counterfeit: {
      label: 'COUNTERFEIT CROWN / M. ALEC TREBÈQUE',
      rationale: 'The richest editorial-parody direction, with fake currency and forged authority carrying the joke.',
    },
    substitute: {
      label: 'SUBSTITUTE SIGNAL / GORD TREBECKETT',
      rationale: 'The warmest and strangest direction, built from public-access television and one heroic misunderstanding.',
    },
  };

  documentRef.addEventListener('DOMContentLoaded', () => {
    const brand = globalThis.JeoPARODYBrand
      ? new globalThis.JeoPARODYBrand.BrandController({ documentRef })
      : null;
    brand?.bind();

    documentRef.getElementById('cycleOButton')?.addEventListener('click', () => brand?.cycle());

    const tokenButtons = Array.from(documentRef.querySelectorAll('[data-o-token-choice]'));
    tokenButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const selectedToken = brand?.setToken(button.dataset.oTokenChoice);
        tokenButtons.forEach((candidate) => {
          candidate.setAttribute(
            'aria-pressed',
            String(candidate.dataset.oTokenChoice === selectedToken),
          );
        });
      });
    });

    const cards = Array.from(documentRef.querySelectorAll('[data-direction-choice]'));
    const selectedDirection = documentRef.getElementById('selectedDirection');
    const selectedRationale = documentRef.getElementById('selectedRationale');

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const direction = card.dataset.directionChoice;
        const content = DIRECTIONS[direction];
        documentRef.body.dataset.direction = direction;
        cards.forEach((candidate) => {
          const selected = candidate === card;
          candidate.classList.toggle('is-selected', selected);
          candidate.setAttribute('aria-pressed', String(selected));
        });
        selectedDirection.textContent = content.label;
        selectedRationale.textContent = content.rationale;
      });
    });
  });
}(globalThis.document));
