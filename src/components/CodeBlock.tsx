import { createElement } from 'react';

export default function CodeBlock({ code }: { code: string }) {
  return createElement('code-snippet', null, <pre><code>{code}</code></pre>);
}
