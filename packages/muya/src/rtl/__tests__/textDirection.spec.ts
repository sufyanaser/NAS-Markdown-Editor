// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { Muya } from '../../muya';
import { bootMuya, useMuyaHarness } from '../../__tests__/muyaHarness';
import {
    applyTextDirection,
    fixedLtrDirectionAttributes,
    isRtlContext,
    normalizeTextDirection,
    textBlockDirectionAttributes,
} from '../textDirection';

useMuyaHarness();

const MIXED_MARKDOWN = [
    '# مرحبا بالعالم',
    '',
    'Hello world in English.',
    '',
    'مرحبا، هذه فقرة عربية مع English words inside.',
    '',
    '- عنصر عربي',
    '- english item',
    '  - nested عربي',
    '',
    '1. first',
    '2. ثاني',
    '',
    '> اقتباس عربي',
    '',
    '| عمود | Column |',
    '| - | - |',
    '| ١ | 2 |',
    '',
    '```js',
    'const x = 1',
    '```',
    '',
].join('\n');

// Leaf text blocks carry the editor-level direction themselves.
const TEXT_SELECTORS = ['p.mu-paragraph', 'h1.mu-atx-heading', 'td.mu-table-cell'];

function dirOf(el: Element | null): string | null {
    return el ? el.getAttribute('dir') : null;
}

describe('normalizeTextDirection', () => {
    it('accepts ltr and rtl and falls back to auto for anything else', () => {
        expect(normalizeTextDirection('ltr')).toBe('ltr');
        expect(normalizeTextDirection('rtl')).toBe('rtl');
        expect(normalizeTextDirection('auto')).toBe('auto');
        expect(normalizeTextDirection('sideways')).toBe('auto');
        expect(normalizeTextDirection(undefined)).toBe('auto');
    });
});

describe('block direction attributes', () => {
    it('gives natural-language blocks the mode and fixed-LTR blocks always ltr', () => {
        const rtl = { options: { textDirection: 'rtl' } };
        const bogus = { options: { textDirection: 'bogus' } };
        expect(textBlockDirectionAttributes(rtl)).toEqual({ 'dir': 'rtl', 'data-mu-dir': 'text' });
        expect(textBlockDirectionAttributes(bogus)).toEqual({ 'dir': 'auto', 'data-mu-dir': 'text' });
        expect(fixedLtrDirectionAttributes()).toEqual({ 'dir': 'ltr', 'data-mu-dir': 'fixed-ltr' });
    });
});

describe('applyTextDirection', () => {
    function buildRoot(): HTMLElement {
        const root = document.createElement('div');
        root.innerHTML = `
            <p data-mu-dir="text" dir="auto">a</p>
            <h1 data-mu-dir="text" dir="auto">b</h1>
            <pre data-mu-dir="fixed-ltr" dir="ltr"><code>x</code></pre>
        `;
        return root;
    }

    it('sets the root and every text block but never fixed-LTR blocks', () => {
        const root = buildRoot();

        applyTextDirection(root, 'rtl');
        expect(dirOf(root)).toBe('rtl');
        expect(dirOf(root.querySelector('p'))).toBe('rtl');
        expect(dirOf(root.querySelector('h1'))).toBe('rtl');
        expect(dirOf(root.querySelector('pre'))).toBe('ltr');

        applyTextDirection(root, 'ltr');
        expect(dirOf(root.querySelector('p'))).toBe('ltr');
        expect(dirOf(root.querySelector('pre'))).toBe('ltr');
    });

    it('removes the root attribute and restores auto on text blocks', () => {
        const root = buildRoot();
        applyTextDirection(root, 'rtl');

        applyTextDirection(root, 'auto');
        expect(root.hasAttribute('dir')).toBe(false);
        expect(dirOf(root.querySelector('p'))).toBe('auto');
        expect(dirOf(root.querySelector('pre'))).toBe('ltr');
    });
});

describe('isRtlContext', () => {
    it('reads the literal direction of the nearest directional ancestor', () => {
        const rtl = document.createElement('div');
        rtl.setAttribute('dir', 'rtl');
        const child = document.createElement('span');
        rtl.appendChild(child);
        expect(isRtlContext(child)).toBe(true);

        const pre = document.createElement('pre');
        pre.setAttribute('dir', 'ltr');
        const code = document.createElement('code');
        pre.appendChild(code);
        rtl.appendChild(pre);
        expect(isRtlContext(code)).toBe(false);
    });

    it('is false without any directional ancestor', () => {
        expect(isRtlContext(document.createElement('span'))).toBe(false);
        expect(isRtlContext(null)).toBe(false);
    });
});

describe('editor-level direction on a booted Muya', () => {
    it('leaves list and quote containers without dir; their direction comes from CSS :has()', () => {
        const muya = bootMuya(MIXED_MARKDOWN);
        for (const selector of ['li', 'ul', 'ol', 'blockquote'])
            expect(muya.domNode.querySelector(selector)?.hasAttribute('dir'), selector).toBe(false);
    });

    it('gives paragraphs, headings and table cells dir="auto" in auto mode', () => {
        const muya = bootMuya(MIXED_MARKDOWN);
        const root = muya.domNode;

        expect(dirOf(root)).toBeNull();
        for (const selector of TEXT_SELECTORS) {
            const el = root.querySelector(selector);
            expect(el, selector).not.toBeNull();
            expect(dirOf(el), selector).toBe('auto');
        }
    });

    it('keeps code blocks LTR in every mode', () => {
        const muya = bootMuya(MIXED_MARKDOWN);
        const pre = muya.domNode.querySelector('pre');
        expect(pre).not.toBeNull();
        expect(dirOf(pre)).toBe('ltr');

        muya.setOptions({ textDirection: 'rtl' } as never);
        expect(dirOf(muya.domNode.querySelector('pre'))).toBe('ltr');
        muya.setOptions({ textDirection: 'auto' } as never);
        expect(dirOf(muya.domNode.querySelector('pre'))).toBe('ltr');
    });

    it('forces every text block to the chosen mode and back to auto', () => {
        const muya = bootMuya(MIXED_MARKDOWN);

        muya.setOptions({ textDirection: 'rtl' } as never);
        expect(dirOf(muya.domNode)).toBe('rtl');
        for (const selector of TEXT_SELECTORS)
            expect(dirOf(muya.domNode.querySelector(selector)), selector).toBe('rtl');

        muya.setOptions({ textDirection: 'ltr' } as never);
        expect(dirOf(muya.domNode)).toBe('ltr');
        for (const selector of TEXT_SELECTORS)
            expect(dirOf(muya.domNode.querySelector(selector)), selector).toBe('ltr');

        muya.setOptions({ textDirection: 'auto' } as never);
        expect(muya.domNode.hasAttribute('dir')).toBe(false);
        for (const selector of TEXT_SELECTORS)
            expect(dirOf(muya.domNode.querySelector(selector)), selector).toBe('auto');
    });

    it('applies the mode when the editor is booted with it', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const muya = new Muya(host, { markdown: MIXED_MARKDOWN, textDirection: 'rtl' } as never);
        muya.init();
        expect(dirOf(muya.domNode)).toBe('rtl');
        expect(dirOf(muya.domNode.querySelector('p.mu-paragraph'))).toBe('rtl');
        muya.destroy();
        host.remove();
    });

    it('never changes the Markdown source across modes', () => {
        const muya = bootMuya(MIXED_MARKDOWN);
        const original = muya.getMarkdown();

        for (const mode of ['rtl', 'ltr', 'auto'])
            muya.setOptions({ textDirection: mode } as never);

        expect(muya.getMarkdown()).toBe(original);
        expect(original).not.toMatch(/dir=/);
    });
});
