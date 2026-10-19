import { css } from '../customCSS';
import { settings } from '../settings/settings';

import commentsStyle from './resComments.less';
import sidebarStyle from './resSidebar.less';
import themeStyle from './resTheme.less';

// Sampled from RES night mode comment boxes
const BAR_COLORS = [`#4584f6`, `#9c28b1`, `#4cb050`, `#ff9700`, `#ea1e63`];

// Runs once when the bundle loads at document-start, before the page paints. Settings changes reload the page.
if (settings.RES_LAYOUT.isEnabled()) {
    css.addStyle(themeStyle, `resTheme`);
    css.addStyle(sidebarStyle, `resSidebar`);
    css.addStyle(commentsStyle, `resComments`);
    css.addStyle(
        Array.from(
            { length: 17 },
            (_, depth) => `shreddit-comment[depth="${depth}"] { --pp-res-bar: ${BAR_COLORS[depth % BAR_COLORS.length]}; background-color: var(--pp-res-bg-${depth % 2 == 0 ? `even` : `odd`}); }`
        ).join(`\n`),
        `resDepth`
    );

    document.addEventListener(`click`, onEdgeClick, true);
    document.addEventListener(`mouseover`, event => setEdgeHover(event, true));
    document.addEventListener(`mouseout`, event => setEdgeHover(event, false));
}

// The comment element itself is only exposed through its ::before strip, its content belongs to descendants
function setEdgeHover(event: MouseEvent, isHovered: boolean) {
    const comment = event.target;
    if (comment instanceof Element && comment.matches(`shreddit-comment`)) {
        comment.toggleAttribute(`pp-res-edge-hover`, isHovered);
    }
}

// Clicks on the 5px depth bar land on shreddit-comment itself through its ::before overlay
function onEdgeClick(event: MouseEvent) {
    const comment = event.target;
    if (!(comment instanceof Element) || !comment.matches(`shreddit-comment`)) return;
    if (event.clientX - comment.getBoundingClientRect().left >= 5) return;

    const details = comment.querySelector(`:scope > details`) as HTMLDetailsElement | null;
    if (!details) return;

    event.preventDefault();
    event.stopPropagation();

    details.open = !details.open;
    if (details.open) return;

    // Keep a collapsed comment in view when its top had scrolled under the header
    const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue(`--shreddit-header-height`)) || 56;
    const top = comment.getBoundingClientRect().top;
    if (top < headerHeight) window.scrollBy(0, top - headerHeight);
}

export function renderResScore(comment: Element) {
    if (settings.RES_LAYOUT.isDisabled() || comment.querySelector(`:scope > details > summary .pp_res_score`)) return;

    const time = comment.querySelector(`:scope > details > summary faceplate-tracker[noun="comment_time"]`);
    const score = comment.getAttribute(`score`);
    if (!time || score == null) return;

    const scoreLabel = document.createElement(`span`);
    scoreLabel.className = `pp_res_score`;
    scoreLabel.textContent = `${score} ${score == `1` ? `point` : `points`}`;
    time.before(scoreLabel);
}
