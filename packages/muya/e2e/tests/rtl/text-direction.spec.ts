import { expect, test } from '../fixtures/muya';
import { getMarkdown } from '../helpers/api';
import { editor } from '../helpers/selectors';
import { focusEditor, lineEndKey, lineStartKey, loadMarkdown } from '../helpers/keyboard';

const SAMPLE = [
    'مرحبا بالعالم',
    '',
    'Hello world in English',
    '',
    'مرحبا English mixed paragraph',
    '',
    'English first then مرحبا',
    '',
    '```js',
    'const x = 1',
    '```',
    '',
].join('\n');

/** Resolved direction of the element as the browser computes it (covers dir="auto"). */
async function resolvedDirection(page: import('@playwright/test').Page, index: number, selector = editor.paragraph): Promise<'rtl' | 'ltr'> {
    return page.locator(selector).nth(index).evaluate((el) => {
        return el.matches(':dir(rtl)') ? 'rtl' : 'ltr';
    });
}

test.describe('text direction: auto mode', () => {
    test.beforeEach(async ({ page }) => {
        await focusEditor(page);
        await loadMarkdown(page, SAMPLE);
        await page.evaluate(() => window.muya!.setOptions({ textDirection: 'auto' } as never));
    });

    test('Arabic paragraph resolves RTL and English paragraph resolves LTR', async ({ page }) => {
        expect(await resolvedDirection(page, 0)).toBe('rtl');
        expect(await resolvedDirection(page, 1)).toBe('ltr');
    });

    test('mixed paragraphs follow their first strong character', async ({ page }) => {
        expect(await resolvedDirection(page, 2)).toBe('rtl');
        expect(await resolvedDirection(page, 3)).toBe('ltr');
    });

    test('code blocks stay LTR', async ({ page }) => {
        const pre = page.locator(editor.codeBlock).first();
        await expect(pre).toBeVisible();
        const dir = await pre.evaluate(el => el.matches(':dir(ltr)'));
        expect(dir).toBe(true);
    });
});

test.describe('text direction: forced modes', () => {
    test('rtl forces English paragraphs RTL but keeps code LTR', async ({ page }) => {
        await focusEditor(page);
        await loadMarkdown(page, SAMPLE);
        await page.evaluate(() => window.muya!.setOptions({ textDirection: 'rtl' } as never));

        expect(await resolvedDirection(page, 1)).toBe('rtl');
        const codeLtr = await page.locator(editor.codeBlock).first().evaluate(el => el.matches(':dir(ltr)'));
        expect(codeLtr).toBe(true);
    });

    test('ltr forces Arabic paragraphs LTR', async ({ page }) => {
        await focusEditor(page);
        await loadMarkdown(page, SAMPLE);
        await page.evaluate(() => window.muya!.setOptions({ textDirection: 'ltr' } as never));

        expect(await resolvedDirection(page, 0)).toBe('ltr');
    });
});

test.describe('caret and selection', () => {
    test('Home and End move to the logical line boundaries in an Arabic paragraph', async ({ page }) => {
        await focusEditor(page);
        await loadMarkdown(page, SAMPLE);

        const paragraph = page.locator(editor.paragraph).first();
        await paragraph.click();
        await page.keyboard.press(lineEndKey());
        const endOffset = await page.evaluate(() => window.getSelection()!.anchorOffset);
        const endLength = await page.evaluate(() => window.getSelection()!.anchorNode!.textContent!.length);
        expect(endOffset).toBe(endLength);

        await page.keyboard.press(lineStartKey());
        const startOffset = await page.evaluate(() => window.getSelection()!.anchorOffset);
        expect(startOffset).toBe(0);
    });

    test('Home and End work on a mixed Arabic/English paragraph', async ({ page }) => {
        await focusEditor(page);
        await loadMarkdown(page, SAMPLE);

        await page.locator(editor.paragraph).nth(2).click();
        await page.keyboard.press(lineStartKey());
        expect(await page.evaluate(() => window.getSelection()!.anchorOffset)).toBe(0);
        await page.keyboard.press(lineEndKey());
        const length = await page.evaluate(() => window.getSelection()!.anchorNode!.textContent!.length);
        expect(await page.evaluate(() => window.getSelection()!.anchorOffset)).toBe(length);
    });
});

test.describe('typing and source integrity', () => {
    test('typing Arabic in rtl mode leaves Markdown source free of direction markup', async ({ page }) => {
        await focusEditor(page);
        await loadMarkdown(page, 'start');
        await page.evaluate(() => window.muya!.setOptions({ textDirection: 'rtl' } as never));

        const paragraph = page.locator(editor.paragraph).first();
        await paragraph.click();
        await page.keyboard.press(lineEndKey());
        await page.keyboard.type(' مرحبا');

        const markdown = await getMarkdown(page);
        expect(markdown).toContain('start مرحبا');
        expect(markdown).not.toMatch(/dir=|data-mu-dir/);
    });
});
