import { postalAddressLines, siteConfig } from "@/config/site";

/**
 * Basis-Layout für alle Transaktions-E-Mails.
 *
 * Bewusst tabellenbasiertes HTML mit Inline-Styles – nur so wird das Layout
 * von Outlook, Gmail und Apple Mail zuverlässig gleich dargestellt.
 */

export const emailColors = {
  black: "#080808",
  anthracite: "#151515",
  gold: "#C8A45D",
  goldLight: "#E1C785",
  cream: "#F7F3EA",
  white: "#FFFFFF",
  muted: "#8C8C8C",
  border: "#2A2A2A",
} as const;

/** Schützt gegen HTML-Injection in E-Mails (Namen, Notizen, Produktnamen). */
export function escapeHtml(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const fontStack =
  "'Helvetica Neue', Helvetica, Arial, 'Segoe UI', sans-serif";

export interface EmailLayoutOptions {
  /** Erscheint im Kopfbereich über der Überschrift. */
  preheader: string;
  heading: string;
  /** Kleine Zeile über der Überschrift, z. B. "Bestellbestätigung". */
  eyebrow?: string;
  bodyHtml: string;
  /** Optionaler Aktionsbutton. */
  cta?: { label: string; url: string };
  /** Zusätzlicher Hinweis unter dem Inhalt. */
  footnote?: string;
}

/** Goldene Trennlinie. */
export function divider(): string {
  return `<tr><td style="padding:0 32px;"><div style="height:1px;background:${emailColors.border};line-height:1px;font-size:0;">&nbsp;</div></td></tr>`;
}

/** Abschnittsüberschrift im Fliesstext. */
export function sectionTitle(title: string): string {
  return `<p style="margin:0 0 12px;font-family:${fontStack};font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:${emailColors.gold};">${escapeHtml(
    title,
  )}</p>`;
}

/** Absatz im Fliesstext. */
export function paragraph(text: string, muted = false): string {
  return `<p style="margin:0 0 14px;font-family:${fontStack};font-size:15px;line-height:1.65;color:${
    muted ? emailColors.muted : emailColors.cream
  };">${text}</p>`;
}

/** Definitionsliste (Label links, Wert rechts). */
export function keyValueTable(
  rows: Array<{ label: string; value: string; strong?: boolean }>,
): string {
  const body = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:6px 0;font-family:${fontStack};font-size:14px;color:${emailColors.muted};">${escapeHtml(
            row.label,
          )}</td>
          <td align="right" style="padding:6px 0;font-family:${fontStack};font-size:14px;color:${
            row.strong ? emailColors.goldLight : emailColors.cream
          };font-weight:${row.strong ? "700" : "400"};">${row.value}</td>
        </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${body}</table>`;
}

/** Adressblock. */
export function addressBlock(lines: string[]): string {
  return `<p style="margin:0;font-family:${fontStack};font-size:14px;line-height:1.7;color:${
    emailColors.cream
  };">${lines.filter(Boolean).map(escapeHtml).join("<br />")}</p>`;
}

/**
 * Rahmen-Layout. Der Preheader ist der Vorschautext im Posteingang und wird
 * im Body versteckt.
 */
export function renderEmail(options: EmailLayoutOptions): string {
  const { preheader, heading, eyebrow, bodyHtml, cta, footnote } = options;
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:${emailColors.black};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
      preheader,
    )}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${
      emailColors.black
    };border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${
            emailColors.anthracite
          };border:1px solid ${emailColors.border};border-collapse:collapse;">

            <!-- Kopf -->
            <tr>
              <td align="center" style="padding:36px 32px 28px;border-bottom:1px solid ${
                emailColors.border
              };">
                <p style="margin:0;font-family:${fontStack};font-size:22px;letter-spacing:5px;text-transform:uppercase;color:${
                  emailColors.gold
                };font-weight:600;">${escapeHtml(siteConfig.name)}</p>
                <p style="margin:8px 0 0;font-family:${fontStack};font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:${
                  emailColors.muted
                };">${escapeHtml(siteConfig.tagline)}</p>
              </td>
            </tr>

            <!-- Titel -->
            <tr>
              <td style="padding:34px 32px 8px;">
                ${
                  eyebrow
                    ? `<p style="margin:0 0 10px;font-family:${fontStack};font-size:11px;letter-spacing:2.2px;text-transform:uppercase;color:${
                        emailColors.gold
                      };">${escapeHtml(eyebrow)}</p>`
                    : ""
                }
                <h1 style="margin:0;font-family:${fontStack};font-size:25px;line-height:1.3;font-weight:600;color:${
                  emailColors.white
                };">${escapeHtml(heading)}</h1>
              </td>
            </tr>

            <!-- Inhalt -->
            <tr>
              <td style="padding:20px 32px 8px;">
                ${bodyHtml}
              </td>
            </tr>

            ${
              cta
                ? `<tr>
                    <td style="padding:16px 32px 28px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                        <tr>
                          <td style="background:${emailColors.gold};">
                            <a href="${escapeHtml(cta.url)}"
                               style="display:inline-block;padding:14px 28px;font-family:${fontStack};font-size:14px;font-weight:600;letter-spacing:0.6px;color:${
                                 emailColors.black
                               };text-decoration:none;">${escapeHtml(cta.label)}</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>`
                : `<tr><td style="height:16px;line-height:16px;font-size:0;">&nbsp;</td></tr>`
            }

            ${
              footnote
                ? `<tr>
                    <td style="padding:0 32px 28px;">
                      <p style="margin:0;font-family:${fontStack};font-size:12px;line-height:1.6;color:${
                        emailColors.muted
                      };">${footnote}</p>
                    </td>
                  </tr>`
                : ""
            }

            <!-- Fuss -->
            <tr>
              <td style="padding:24px 32px 30px;border-top:1px solid ${
                emailColors.border
              };background:${emailColors.black};">
                <p style="margin:0 0 6px;font-family:${fontStack};font-size:12px;line-height:1.7;color:${
                  emailColors.muted
                };">
                  ${escapeHtml(siteConfig.legalName)}<br />
                  ${
                    postalAddressLines.length > 0
                      ? `${escapeHtml(postalAddressLines.join(", "))}<br />`
                      : ""
                  }
                  <a href="mailto:${escapeHtml(siteConfig.contact.email)}" style="color:${
                    emailColors.gold
                  };text-decoration:none;">${escapeHtml(siteConfig.contact.email)}</a>
                </p>
                <p style="margin:12px 0 0;font-family:${fontStack};font-size:11px;line-height:1.7;color:#666;">
                  <a href="${siteConfig.url}/impressum" style="color:#888;text-decoration:none;">Impressum</a> &nbsp;·&nbsp;
                  <a href="${siteConfig.url}/datenschutz" style="color:#888;text-decoration:none;">Datenschutz</a> &nbsp;·&nbsp;
                  <a href="${siteConfig.url}/agb" style="color:#888;text-decoration:none;">AGB</a> &nbsp;·&nbsp;
                  <a href="${siteConfig.url}/widerruf" style="color:#888;text-decoration:none;">Widerruf</a>
                </p>
                <p style="margin:10px 0 0;font-family:${fontStack};font-size:11px;color:#555;">
                  © ${year} ${escapeHtml(siteConfig.name)}. Diese E-Mail wurde automatisch versendet.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Sehr einfache Nur-Text-Fassung als Fallback. */
export function toPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|tr|h1|h2|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}
