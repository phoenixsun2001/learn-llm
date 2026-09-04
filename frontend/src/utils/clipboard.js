/**
 * copyTextToClipboard – copy text in any context.
 *
 * The async Clipboard API only exists in secure contexts (HTTPS /
 * localhost). On plain-HTTP LAN deployments navigator.clipboard is
 * undefined, so fall back to the legacy execCommand path, which works
 * inside a user gesture. Throws only if both paths fail.
 */
export async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  /* Keep it off-screen but selectable */
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  try {
    if (!document.execCommand('copy')) {
      throw new Error('execCommand copy returned false');
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
