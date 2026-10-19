import { buildElement } from '../../utils/element';
import { NONE_COLOR, buildSvg } from '../../utils/svg';
import { CustomCSS, css } from '../customCSS';
import { settings } from '../settings/settings';

import feedStyle from './resFeed.less';
import postShadowStyle from './resFeedShadow.less';

// Old reddit post rows built from shreddit-post attributes. The native card stays in the shadow root, hidden,
// and the row forwards votes, save, hide and report to its buttons.

const ARROW_SVG = `<svg viewBox="0 0 14 13"><polygon points="7,0 14,7 10,7 10,13 4,13 4,7 0,7"/></svg>`;

const postShadowCss = new CustomCSS();
postShadowCss.addStyle(postShadowStyle);

// Added when the bundle loads at document-start, so Reddit's cards and banner never show before the rows replace them
if (settings.RES_LAYOUT.isEnabled()) {
    css.addStyle(feedStyle, `resFeed`);
}

export function renderResPost(post: Element) {
    if (settings.RES_LAYOUT.isDisabled() || !post.closest(`shreddit-feed`) || !post.shadowRoot) return;

    postShadowCss.register(post.shadowRoot);

    // The row takes over the full-post-link slot, which otherwise holds a link covering the whole card
    post.querySelector(`:scope > a[slot="full-post-link"]`)?.remove();
    post.append(buildRow(post));
}

function buildRow(post: Element): HTMLElement {
    const row = buildElement(`div`, `pp_res_post`);
    row.setAttribute(`slot`, `full-post-link`);
    // Clicks on empty row space would reach the card's own click-to-open handler
    row.addEventListener(`click`, event => event.stopPropagation());

    const entry = buildElement(`div`, `pp_res_entry`);
    entry.append(buildTitle(post), buildMeta(post));

    row.append(buildVotes(post), buildThumbnail(post), entry);
    return row;
}

function buildVotes(post: Element): HTMLElement {
    const votes = buildElement(`div`, `pp_res_votes`);
    const up = buildArrow(`pp_res_up`);
    const score = buildElement(`span`, `pp_res_score`);
    const down = buildArrow(`pp_res_down`);

    const refresh = () => {
        const isUp = nativeVoteButton(post, `upvote`)?.getAttribute(`aria-pressed`) == `true`;
        const isDown = nativeVoteButton(post, `downvote`)?.getAttribute(`aria-pressed`) == `true`;
        const number = post.shadowRoot?.querySelector(`shreddit-vote-animations faceplate-number`)?.getAttribute(`number`);
        votes.classList.toggle(`pp_res_upvoted`, isUp);
        votes.classList.toggle(`pp_res_downvoted`, isDown);
        score.textContent = formatScore(parseInt(number ?? post.getAttribute(`score`) ?? ``) || 0);
    };

    up.addEventListener(`click`, () => forward(nativeVoteButton(post, `upvote`), refresh));
    down.addEventListener(`click`, () => forward(nativeVoteButton(post, `downvote`), refresh));

    refresh();
    votes.append(up, score, down);
    return votes;
}

function buildArrow(className: string): HTMLElement {
    const button = buildElement(`button`, [`pp_res_arrow`, className]);
    button.append(buildSvg(ARROW_SVG, 11, 10, { strokeColor: NONE_COLOR }));
    return button;
}

function buildThumbnail(post: Element): HTMLElement {
    const thumbnail = buildElement(`a`, `pp_res_thumb`) as HTMLAnchorElement;
    thumbnail.href = post.getAttribute(`content-href`) ?? post.getAttribute(`permalink`)!;

    const source = post.querySelector(`[slot="thumbnail"] img`)?.getAttribute(`src`);
    if (source) {
        const image = buildElement(`img`) as HTMLImageElement;
        image.src = source;
        image.loading = `lazy`;
        thumbnail.append(image);
    } else {
        thumbnail.classList.add(`pp_res_thumb_self`);
        thumbnail.textContent = post.getAttribute(`post-type`) == `text` ? `self` : `link`;
    }

    // A plain click previews the media inline, modified clicks still open the link
    thumbnail.addEventListener(`click`, event => {
        if (event.button != 0 || event.ctrlKey || event.metaKey || event.shiftKey || !nativeExpandoButton(post)) return;
        event.preventDefault();
        togglePreview(post);
    });

    return thumbnail;
}

// Reddit's own expando loads the media, the shadow stylesheet then shows only its slot under the row
function togglePreview(post: Element) {
    nativeExpandoButton(post)?.click();
    const isExpanded = post.classList.toggle(`pp_res_expanded`);
    const label = post.querySelector(`.pp_res_preview`);
    if (label) label.textContent = isExpanded ? `close` : `preview`;
}

function nativeExpandoButton(post: Element): HTMLElement | null {
    return post.shadowRoot?.querySelector(`.toggle__expando-button`) ?? null;
}

function buildTitle(post: Element): HTMLElement {
    const title = buildElement(`p`, `pp_res_title`);

    const link = buildElement(`a`, `pp_res_title_link`) as HTMLAnchorElement;
    link.href = post.getAttribute(`content-href`) ?? post.getAttribute(`permalink`)!;
    link.textContent = post.getAttribute(`post-title`);
    title.append(link);

    const flair = post.querySelector(`shreddit-post-flair .flair-content`)?.closest(`span`);
    if (flair) {
        const flairCopy = flair.cloneNode(true) as HTMLElement;
        flairCopy.classList.add(`pp_res_flair`);
        title.append(flairCopy);
    }

    const domain = buildElement(`span`, `pp_res_domain`);
    domain.textContent = `(${post.getAttribute(`domain`)})`;
    title.append(domain);

    return title;
}

function buildMeta(post: Element): HTMLElement {
    const meta = buildElement(`div`, `pp_res_meta`);
    const info = buildElement(`span`, `pp_res_info`);

    const created = new Date(post.getAttribute(`created-timestamp`)!);
    const time = buildElement(`time`);
    time.setAttribute(`title`, created.toLocaleString());
    time.textContent = formatAge(created);

    const author = buildElement(`a`, `pp_res_author`) as HTMLAnchorElement;
    author.href = `/user/${post.getAttribute(`author`)}/`;
    author.textContent = `u/${post.getAttribute(`author`)}`;

    info.append(time, author);

    // Subreddit feeds leave out the subreddit, mixed feeds like home and popular show it
    if (post.getAttribute(`view-context`) != `SubredditFeed`) {
        const subreddit = buildElement(`a`, `pp_res_subreddit`) as HTMLAnchorElement;
        subreddit.href = `/${post.getAttribute(`subreddit-prefixed-name`)}/`;
        subreddit.textContent = post.getAttribute(`subreddit-prefixed-name`);
        info.append(subreddit);
    }

    const actions = buildElement(`span`, `pp_res_actions`);

    const comments = buildElement(`a`) as HTMLAnchorElement;
    comments.href = post.getAttribute(`permalink`)!;
    const count = parseInt(post.getAttribute(`comment-count`) ?? `0`);
    comments.textContent = count == 0 ? `comment` : `${count} ${count == 1 ? `comment` : `comments`}`;

    const share = buildTextButton(`share`);
    share.addEventListener(`click`, async () => {
        await navigator.clipboard.writeText(new URL(post.getAttribute(`permalink`)!, location.origin).href);
        share.textContent = `copied`;
        setTimeout(() => (share.textContent = `share`), 1500);
    });

    actions.append(comments, share, ...[`save`, `hide`, `report`].map(testId => buildMenuButton(post, testId)));

    if (nativeExpandoButton(post)) {
        const preview = buildTextButton(`preview`);
        preview.classList.add(`pp_res_preview`);
        preview.addEventListener(`click`, () => togglePreview(post));
        actions.prepend(preview);
    }
    meta.append(info, actions);
    return meta;
}

function buildTextButton(label: string): HTMLElement {
    const button = buildElement(`button`, `pp_res_text_button`);
    button.textContent = label;
    return button;
}

// Save and hide flip their native label to unsave and unhide, the row copies that label back
function buildMenuButton(post: Element, testId: string): HTMLElement {
    const button = buildTextButton(testId);
    const refresh = () => {
        const label = nativeMenuButton(post, testId)?.textContent?.trim().toLowerCase();
        if (label) button.textContent = label;
        post.classList.toggle(`pp_res_hidden_post`, testId == `hide` && label == `unhide`);
    };

    button.addEventListener(`click`, () => forward(nativeMenuButton(post, testId), refresh));
    refresh();
    return button;
}

function nativeVoteButton(post: Element, direction: `upvote` | `downvote`): HTMLElement | null {
    return post.shadowRoot?.querySelector(`button[${direction}]`) ?? null;
}

function nativeMenuButton(post: Element, testId: string): HTMLElement | null {
    return post.querySelector(`unpacking-overflow-menu`)?.shadowRoot?.querySelector(`[data-testid="${testId}"]`) ?? null;
}

function forward(target: HTMLElement | null, refresh: () => void) {
    target?.click();
    for (const delay of [300, 1000]) setTimeout(refresh, delay);
}

// RES shows scores under 10000 in full, and larger ones as 16.7k
function formatScore(score: number): string {
    return Math.abs(score) < 10000 ? String(score) : `${(score / 1000).toFixed(1)}k`;
}

const AGE_UNITS: Array<[string, number]> = [
    [`year`, 365 * 24 * 3600],
    [`month`, 30 * 24 * 3600],
    [`day`, 24 * 3600],
    [`hour`, 3600],
    [`minute`, 60]
];

function formatAge(created: Date): string {
    const seconds = (Date.now() - created.getTime()) / 1000;

    for (const [unit, unitSeconds] of AGE_UNITS) {
        const count = Math.floor(seconds / unitSeconds);
        if (count >= 1) return `${count} ${unit}${count == 1 ? `` : `s`} ago`;
    }

    return `just now`;
}
