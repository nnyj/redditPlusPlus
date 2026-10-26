import { settings } from '../settings/settings';
import { notify } from '../toaster';

const LINK_SELECTOR = `a[slot="more-comments-permalink"]`;

let isRegistered = false;

export function registerInlineThreads() {
    if (isRegistered || settings.INLINE_DEEP_THREADS.isDisabled()) return;
    isRegistered = true;

    // capture phase, so Reddit's router never sees the click
    window.addEventListener(`click`, onClick, true);
}

function onClick(event: MouseEvent) {
    // middle, ctrl, shift, meta clicks keep the native new tab behavior
    if (event.button != 0 || event.ctrlKey || event.shiftKey || event.metaKey || event.altKey) return;

    const link = (event.target as Element | null)?.closest?.(LINK_SELECTOR) as HTMLAnchorElement | null;
    if (!link) return;

    const parentComment = link.closest(`shreddit-comment`);
    const parentId = parentComment?.getAttribute(`thingid`);
    if (!parentComment || !parentId) return;

    event.preventDefault();
    event.stopPropagation();

    if (link.dataset.ppLoading != null) return;

    loadThread(link, parentComment, parentId);
}

async function loadThread(link: HTMLAnchorElement, parentComment: Element, parentId: string) {
    const label = findLabel(link);
    const labelText = label?.textContent ?? null;

    link.dataset.ppLoading = ``;
    if (label) label.textContent = `Loading…`;

    try {
        // the permalink page loads its comments later, this partial is the comment tree it requests
        // force-legacy-sct starts the tree at the comment, without it logged-in users get the full chain from the top comment
        const match = new URL(link.href).pathname.match(/^\/r\/([^/]+)\/comments\/([^/]+)\/comment\/([^/]+)/);
        if (!match) throw new Error(`unknown link ${link.href}`);
        const [, sub, postId, commentId] = match;

        const response = await fetch(`/svc/shreddit/comments/r/${sub}/t3_${postId}/t1_${commentId}?render-mode=partial&force-legacy-sct=1`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const page = parseHtml(await response.text());
        const fetchedParent = page.querySelector(`shreddit-comment[thingid="${parentId}"]`);
        if (!fetchedParent) throw new Error(`parent ${parentId} not found`);

        // server markup nests replies in #comment-children, not as direct children
        const replies = [...fetchedParent.querySelectorAll(`shreddit-comment`)].filter(comment => comment.parentElement?.closest(`shreddit-comment`) == fetchedParent);
        if (replies.length == 0) throw new Error(`no replies under ${parentId}`);

        // the fetched page starts its own depth count, shift it to the current tree
        const depthOffset = depthOf(parentComment) - depthOf(fetchedParent);
        for (const reply of replies) {
            for (const comment of [reply, ...reply.querySelectorAll(`shreddit-comment`)]) {
                comment.setAttribute(`depth`, String(depthOf(comment) + depthOffset));
            }
        }

        // the link sits in a narrow flex row after the replies container, so replies go into the container
        const fetchedChildren = replies[0].parentElement!;
        const children = [...parentComment.querySelectorAll(`#comment-children`)].find(element => element.closest(`shreddit-comment`) == parentComment);
        const linkBlock = link.closest(`.fold-more`) ?? link;

        if (children) {
            children.append(...replies);
        } else {
            linkBlock.before(fetchedChildren);
        }

        linkBlock.remove();
    } catch (error) {
        console.log(`Reddit++: inline thread failed`, error);
        notify(`Unable to load thread: ${(error as Error).message}`, { seconds: 8 });

        if (label) label.textContent = labelText;
        delete link.dataset.ppLoading;
    }
}

function parseHtml(html: string): Document {
    // parseHTMLUnsafe keeps declarative shadow roots, DOMParser drops them
    const parseUnsafe = (Document as unknown as { parseHTMLUnsafe?: (html: string) => Document }).parseHTMLUnsafe;
    return parseUnsafe ? parseUnsafe(html) : new DOMParser().parseFromString(html, `text/html`);
}

function depthOf(comment: Element): number {
    return Number(comment.getAttribute(`depth`) ?? 0);
}

function findLabel(link: Element): Element | null {
    const textElements = [...link.querySelectorAll(`*`)].filter(element => element.childElementCount == 0 && /repl/i.test(element.textContent ?? ``));
    return textElements[0] ?? null;
}
