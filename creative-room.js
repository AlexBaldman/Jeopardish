(function initCreativeRoom(documentRef) {
  'use strict';

  const DIRECTIONS = {
    interloper: {
      label: 'THE INTERLOPER',
      rationale: 'Preserve the iconic setup, then let one unmistakably foreign O create the entire joke.',
    },
    undercover: {
      label: 'THE UNDERCOVER O',
      rationale: 'The most restrained homage, but subtlety may hide the punchline at small sizes.',
    },
    impact: {
      label: 'THE IMPACT O',
      rationale: 'The strongest title-sequence gag, best reserved as motion behavior around a calmer static mark.',
    },
    daily: {
      label: 'THE O OF THE DAY',
      rationale: 'A powerful content system once one unmistakable default O has earned recognition.',
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
