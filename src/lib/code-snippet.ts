const template = document.querySelector<HTMLTemplateElement>('#code-snippet-controls')!;

class CodeSnippet extends HTMLElement {
  #resetTimer = 0;

  connectedCallback() {
    if (this.shadowRoot) return;

    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true), document.createElement('slot'));
    const button = root.querySelector('button')!;
    const status = root.querySelector<HTMLElement>('[role="status"]')!;

    button.addEventListener('click', async () => {
      const code = this.querySelector('pre > code');
      if (!code) return;

      window.clearTimeout(this.#resetTimer);
      status.textContent = '';

      try {
        await navigator.clipboard.writeText(code.textContent ?? '');
        status.textContent = 'Copied';
        this.#resetTimer = window.setTimeout(() => { status.textContent = ''; }, 2500);
      } catch {
        status.textContent = 'Copy unavailable. Select the code to copy it manually.';
      }
    });
  }

  disconnectedCallback() {
    window.clearTimeout(this.#resetTimer);
  }
}

customElements.define('code-snippet', CodeSnippet);
