type DreExportRow = {
  label: string;
  value: string;
  tone?: "default" | "muted" | "success" | "warning" | "destructive";
};

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function exportDreAsPrintablePdf(args: {
  title: string;
  subtitle?: string;
  periodLabel: string;
  rows: DreExportRow[];
  notes?: string[];
  fileName?: string;
  openInNewTab?: boolean;
}) {
  const { title, subtitle, periodLabel, rows, notes, fileName, openInNewTab = false } = args;

  // Presentation-only split: first rows are the main DRE summary, the rest are supporting details.
  const mainRows = rows.slice(0, 4);
  const detailRows = rows.slice(4);

  const toneClass = (tone: DreExportRow["tone"]) => {
    switch (tone) {
      case "success":
        return "tone-success";
      case "warning":
        return "tone-warning";
      case "destructive":
        return "tone-destructive";
      case "muted":
        return "tone-muted";
      default:
        return "";
    }
  };

  const html = `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(fileName ?? title)}</title>
      <style>
        :root {
          --bg: 0 0% 100%;
          --fg: 222.2 84% 4.9%;
          --muted: 210 40% 96.1%;
          --muted-fg: 215.4 16.3% 46.9%;
          --border: 214.3 31.8% 91.4%;
          --primary: 222.2 47.4% 11.2%;
          --success: 142.1 76.2% 36.3%;
          --warning: 37.7 92.1% 50.2%;
          --destructive: 0 84.2% 60.2%;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: 222.2 84% 4.9%;
            --fg: 210 40% 98%;
            --muted: 217.2 32.6% 17.5%;
            --muted-fg: 215 20.2% 65.1%;
            --border: 217.2 32.6% 17.5%;
            --primary: 210 40% 98%;
          }
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 32px;
          background: hsl(var(--bg));
          color: hsl(var(--fg));
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
        }
        .wrap { max-width: 780px; margin: 0 auto; }
        header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
        h1 { margin: 0; font-size: 20px; letter-spacing: -0.01em; line-height: 1.2; }
        .sub { margin-top: 6px; color: hsl(var(--muted-fg)); font-size: 12px; }
        .meta { text-align: right; color: hsl(var(--muted-fg)); font-size: 12px; }

        .section { margin-top: 14px; }
        .section-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: hsl(var(--muted-fg));
          margin: 0 0 8px;
        }

        .card { border: 1px solid hsl(var(--border)); border-radius: 12px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 11px 14px; border-top: 1px solid hsl(var(--border)); }
        tr:first-child td, tr:first-child th { border-top: 0; }
        .label { font-size: 13px; color: hsl(var(--fg)); }
        .value { font-size: 13px; font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }

        .tone-muted .label, .tone-muted .value { color: hsl(var(--muted-fg)); }
        .tone-success .value { color: hsl(var(--success)); font-weight: 800; }
        .tone-warning .value { color: hsl(var(--warning)); font-weight: 700; }
        .tone-destructive .value { color: hsl(var(--destructive)); font-weight: 700; }

        .key-row .label { font-weight: 600; }
        .key-row .value { font-weight: 800; }
        .highlight { background: hsl(var(--muted) / 0.45); }

        .footer { margin-top: 16px; color: hsl(var(--muted-fg)); font-size: 11px; display:flex; justify-content: space-between; gap: 12px; }
        .notes { margin-top: 14px; }
        .notes h3 { margin: 0 0 6px; font-size: 12px; color: hsl(var(--fg)); }
        ul { margin: 6px 0 0; padding-left: 18px; }
        @page { size: A4; margin: 12mm; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="wrap">
        <header>
          <div>
            <h1>${escapeHtml(title)}</h1>
            ${subtitle ? `<div class="sub">${escapeHtml(subtitle)}</div>` : ``}
          </div>
          <div class="meta">
            <div>${escapeHtml(periodLabel)}</div>
            <div>${new Date().toLocaleString("pt-BR")}</div>
          </div>
        </header>

        <section class="section">
          <h2 class="section-title">Resumo</h2>
          <div class="card">
            <table>
              <tbody>
                ${mainRows
                  .map((r, idx) => {
                    const isNet = idx === 3;
                    const rowClass = `${toneClass(r.tone)} ${idx === 0 || idx === 3 ? "key-row" : ""} ${isNet ? "highlight" : ""}`.trim();
                    return `
                  <tr class="${rowClass}">
                    <td class="label">${escapeHtml(r.label)}</td>
                    <td class="value">${escapeHtml(r.value)}</td>
                  </tr>`;
                  })
                  .join("\n")}
              </tbody>
            </table>
          </div>
        </section>

        ${
          detailRows.length
            ? `
        <section class="section">
          <h2 class="section-title">Detalhamento</h2>
          <div class="card">
            <table>
              <tbody>
                ${detailRows
                  .map(
                    (r) => `
                  <tr class="${toneClass(r.tone)}">
                    <td class="label">${escapeHtml(r.label)}</td>
                    <td class="value">${escapeHtml(r.value)}</td>
                  </tr>`,
                  )
                  .join("\n")}
              </tbody>
            </table>
          </div>
        </section>`
            : ``
        }

        <div class="footer">
          <div>Gerado pelo Axion</div>
          <div>Valores em BRL</div>
        </div>

        ${
          notes?.length
            ? `<div class="notes">
                <h3>Observações</h3>
                <ul>${notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>
              </div>`
            : ``
        }
      </div>
      <script>
        window.addEventListener('load', () => {
          window.focus();
          window.print();
        });
      </script>
    </body>
  </html>`;

  // Prefer iframe printing to avoid popup blockers and blank windows.
  if (!openInNewTab) {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Exportar DRE");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) {
      document.body.removeChild(iframe);
      throw new Error("Falha ao preparar a exportação do DRE.");
    }

    doc.open();
    doc.write(html);
    doc.close();

    // Give the iframe a tick to render before printing.
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } finally {
        // Remove iframe after a short delay to avoid interrupting print dialog in some browsers.
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 1000);
      }
    }, 50);

    return;
  }

  // Optional: open in a new tab
  const w = window.open("", "_blank");
  if (!w) {
    throw new Error("Não foi possível abrir a janela de exportação (pop-up bloqueado). Permita pop-ups e tente novamente.");
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
