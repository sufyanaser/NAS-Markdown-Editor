/**
 * Editor-level text direction for natural-language blocks.
 *
 * - `auto`: every text block gets `dir="auto"`, so the browser's Unicode bidi
 *   algorithm resolves each paragraph from its first strong character.
 * - `ltr` / `rtl`: forced for the whole document, including every text block.
 *
 * Code, math, diagram, HTML and front-matter blocks are always LTR regardless of
 * mode. Direction lives only in DOM attributes and never reaches the Markdown
 * serialisation, so the source text is not affected by it.
 */

export type TextDirectionMode = 'auto' | 'ltr' | 'rtl';

export const TEXT_DIRECTION_MODES: readonly TextDirectionMode[] = ['auto', 'ltr', 'rtl'];

export const TEXT_DIRECTION_ATTR = 'data-mu-dir';

const TEXT_KIND = 'text';
const FIXED_LTR_KIND = 'fixed-ltr';

export function normalizeTextDirection(value: unknown): TextDirectionMode {
    return value === 'ltr' || value === 'rtl' ? value : 'auto';
}

/** Attributes for a natural-language block; follow the editor's current direction mode. */
export function textBlockDirectionAttributes(muya: { options: { textDirection?: unknown } }): Record<string, string> {
    return { dir: normalizeTextDirection(muya.options.textDirection), [TEXT_DIRECTION_ATTR]: TEXT_KIND };
}

/** Attributes for a block whose content is always LTR (code, math, diagram, HTML, front matter). */
export function fixedLtrDirectionAttributes(): Record<string, string> {
    return { dir: 'ltr', [TEXT_DIRECTION_ATTR]: FIXED_LTR_KIND };
}

/** Applies a mode to the editor root and to every natural-language block already in the DOM. */
export function applyTextDirection(root: HTMLElement, mode: TextDirectionMode): void {
    if (mode === 'auto')
        root.removeAttribute('dir');
    else
        root.setAttribute('dir', mode);

    root.querySelectorAll<HTMLElement>(`[${TEXT_DIRECTION_ATTR}="${TEXT_KIND}"]`).forEach((el) => {
        el.setAttribute('dir', mode);
    });
}

/**
 * Whether the nearest directional ancestor resolves to RTL.
 * Uses the browser's resolved `:dir()` state, which covers `dir="auto"`.
 * Falls back to the literal attribute where `:dir()` is unsupported (e.g. jsdom).
 */
export function isRtlContext(node: Element | null | undefined | void): boolean {
    const host = node?.closest('[dir]');
    if (!host)
        return false;

    try {
        if (host.matches(':dir(rtl)'))
            return true;
        if (host.matches(':dir(ltr)'))
            return false;
    }
    catch {
        // :dir() not supported in this environment; use the literal attribute below.
    }

    return host.getAttribute('dir') === 'rtl';
}
