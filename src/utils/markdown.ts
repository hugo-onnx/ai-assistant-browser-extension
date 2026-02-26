import { Marked, type Tokens } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";

import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import sql from "highlight.js/lib/languages/sql";
import yaml from "highlight.js/lib/languages/yaml";
import typescript from "highlight.js/lib/languages/typescript";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);

const marked = new Marked();

marked.use({
  breaks: true,
  gfm: true,
  renderer: {
    code({ text, lang }: Tokens.Code): string {
      let highlighted: string;
      try {
        if (lang && hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(text, { language: lang }).value;
        } else {
          highlighted = hljs.highlightAuto(text).value;
        }
      } catch {
        highlighted = text;
      }
      const langClass = lang ? ` language-${lang}` : "";
      return `<pre><code class="hljs${langClass}">${highlighted}</code></pre>`;
    },
    table({ header, rows }: Tokens.Table): string {
      let html = "<table><thead>";
      if (header && header.length > 0) {
        html += "<tr>";
        for (const cell of header) {
          const align = cell.align ? ` style="text-align:${cell.align}"` : "";
          html += `<th${align}>${cell.text}</th>`;
        }
        html += "</tr>";
      }
      html += "</thead><tbody>";
      if (rows && rows.length > 0) {
        for (const row of rows) {
          html += "<tr>";
          for (const cell of row) {
            const align = cell.align ? ` style="text-align:${cell.align}"` : "";
            const content = marked.parseInline(cell.text || "") as string;
            html += `<td${align}>${content}</td>`;
          }
          html += "</tr>";
        }
      }
      html += "</tbody></table>";
      return `<div class="table-wrapper">${html}</div>`;
    },
  },
});

export function renderMarkdown(text: string): string {
  if (!text) return "";
  try {
    const html = marked.parse(text) as string;
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "em", "u", "s",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "ul", "ol", "li",
        "pre", "code",
        "blockquote",
        "table", "thead", "tbody", "tr", "th", "td",
        "div", "span", "a",
        "hr",
      ],
      ALLOWED_ATTR: ["class", "style", "href", "title", "target", "rel"],
      ALLOW_DATA_ATTR: false,
    });
  } catch {
    return DOMPurify.sanitize(text);
  }
}