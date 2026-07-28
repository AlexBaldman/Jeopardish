(function initStudyView(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYStudyView = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function studyViewFactory() {
  'use strict';

  const StudyCopy = Object.freeze({
    en: Object.freeze({
      direction: 'Pick a direction. I will remain tethered to the known facts, a restriction television has traditionally considered optional.',
      reviewed: 'Reviewed sources attached',
      archive: 'Archive text only',
      inputPlaceholder: 'Type your answer',
      checkMemory: 'Check memory',
    }),
    'pt-BR': Object.freeze({
      direction: 'Escolha um caminho. Continuarei preso aos fatos conhecidos, uma restrição que a televisão tradicionalmente considera opcional.',
      reviewed: 'Reviewed sources attached',
      archive: 'Archive text only',
      inputPlaceholder: 'Digite sua resposta',
      checkMemory: 'Verificar memória',
    }),
  });

  class StudyView {
    constructor({
      documentRef,
      dom,
      setText,
    } = {}) {
      if (!documentRef || !dom || typeof setText !== 'function') {
        throw new Error('StudyView requires document, DOM, and text adapters.');
      }
      this.document = documentRef;
      this.dom = dom;
      this.setText = setText;
    }

    getCopy(locale = 'en') {
      return StudyCopy[locale] || StudyCopy.en;
    }

    resetReinforcement() {
      if (this.dom.studyReinforcement) this.dom.studyReinforcement.hidden = true;
      if (this.dom.studyReinforcementForm) this.dom.studyReinforcementForm.hidden = false;
      if (this.dom.studyReinforcementInput) {
        this.dom.studyReinforcementInput.value = '';
        this.dom.studyReinforcementInput.disabled = false;
      }
      if (this.dom.studyReinforcementCheck) this.dom.studyReinforcementCheck.disabled = false;
      this.setText(this.dom.studyReinforcementResult, '');
      this.dom.studyReinforcementResult?.removeAttribute?.('data-state');
    }

    renderPanel(packet, actions = []) {
      const clue = packet.presentation || packet.canonical;
      const copy = this.getCopy(clue.locale);
      this.dom.studyPanel?.classList?.remove('reinforcement-active');
      this.setText(this.dom.studyCategory, clue.category);
      this.setText(this.dom.studyQuestion, clue.question);
      this.setText(this.dom.studyAnswer, clue.answer);
      this.setText(
        this.dom.studyGrounding,
        packet.grounding === 'reviewed' ? copy.reviewed : copy.archive,
      );

      const sourceLinks = (packet.citations || []).map((citation) => {
        const link = this.document.createElement('a');
        link.href = citation.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = citation.title;
        return link;
      });
      this.dom.studySources?.replaceChildren?.(...sourceLinks);
      if (this.dom.studySources) this.dom.studySources.hidden = sourceLinks.length === 0;
      this.setText(this.dom.studyResponse, copy.direction);
      this.resetReinforcement();

      const buttons = actions.map((action) => {
        const button = this.document.createElement('button');
        button.type = 'button';
        button.dataset.studyAction = action.id;
        button.textContent = action.label;
        return button;
      });
      this.dom.studyActions?.replaceChildren?.(...buttons);
    }

    renderResponse(response) {
      this.setText(this.dom.studyResponse, response);
    }

    renderReinforcement(reinforcement, locale = 'en') {
      if (!this.dom.studyReinforcement || !reinforcement) return false;
      const copy = this.getCopy(locale);
      this.dom.studyPanel?.classList?.add('reinforcement-active');
      this.dom.studyReinforcement.hidden = false;
      this.setText(this.dom.studyReinforcementPrompt, reinforcement.prompt);
      if (this.dom.studyReinforcementInput) {
        this.dom.studyReinforcementInput.value = '';
        this.dom.studyReinforcementInput.disabled = false;
        this.dom.studyReinforcementInput.placeholder = copy.inputPlaceholder;
      }
      if (this.dom.studyReinforcementCheck) {
        this.dom.studyReinforcementCheck.disabled = false;
        this.setText(this.dom.studyReinforcementCheck, copy.checkMemory);
      }
      this.setText(this.dom.studyReinforcementResult, '');
      this.dom.studyReinforcementResult?.removeAttribute?.('data-state');
      this.dom.studyReinforcementInput?.focus?.();
      return true;
    }

    renderReinforcementResult({ correct = false, empty = false, message = '' } = {}) {
      this.setText(this.dom.studyReinforcementResult, message);
      if (this.dom.studyReinforcementResult) {
        this.dom.studyReinforcementResult.dataset.state = empty
          ? 'empty'
          : correct ? 'correct' : 'incorrect';
      }
      if (correct) {
        if (this.dom.studyReinforcementInput) this.dom.studyReinforcementInput.disabled = true;
        if (this.dom.studyReinforcementCheck) this.dom.studyReinforcementCheck.disabled = true;
        this.dom.studyResume?.focus?.();
      } else {
        this.dom.studyReinforcementInput?.select?.();
      }
      this.dom.studyReinforcementResult?.scrollIntoView?.({ block: 'nearest' });
    }
  }

  return {
    StudyCopy,
    StudyView,
  };
}));
