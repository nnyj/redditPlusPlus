import { MAX_LOAD_LAG } from '../defines';
import { dynamic } from '../utils/dynamic';
import { AwardsMode } from './collapseAwardsMode';
import { CustomCSS } from './customCSS';
import { settings } from './settings/settings';

import style from './collapseAwards.less';

const awardsCss = new CustomCSS();
awardsCss.register(document);
awardsCss.addStyle(style);

// Comments hide awards with CSS, a timed lookup missed comments whose action row rendered late
const commentAwardsMode = settings.COLLAPSE_AWARDS.get() as AwardsMode;

if (commentAwardsMode == AwardsMode.RemoveCompletely) {
    awardsCss.addStyle(`shreddit-comment-action-row award-button { display: none !important; }`);
}

if (commentAwardsMode == AwardsMode.WhenUpvoted) {
    // Reddit sets vote-state at load only, after a vote click pp-vote holds the current state
    awardsCss.addStyle(
        `shreddit-comment-action-row:not([vote-state='UP']):not([pp-vote]) award-button[count='0'], shreddit-comment-action-row[pp-vote='none'] award-button[count='0'] { display: none !important; }`
    );
    document.addEventListener(`click`, onCommentVoteClick, true);
}

function onCommentVoteClick(event: MouseEvent) {
    const path = event.composedPath() as Element[];
    const isVote = path.some(element => element.matches?.(`button[upvote], button[downvote]`));
    const actionRow = path.find(element => element.matches?.(`shreddit-comment-action-row`));
    if (!isVote || !actionRow) return;

    setTimeout(() => {
        const isUpvoted = actionRow.shadowRoot?.querySelector(`button[upvote]`)?.getAttribute(`aria-pressed`) == `true`;
        actionRow.setAttribute(`pp-vote`, isUpvoted ? `up` : `none`);
    }, 50);
}

export async function renderCollapseAward(target: Element) {
    const mode = settings.COLLAPSE_AWARDS.get() as AwardsMode;

    if (mode == AwardsMode.Default) return;

    let awardButton = await dynamic(() => target.shadowRoot?.querySelector(`award-button`), MAX_LOAD_LAG * 2);

    if (awardButton == null) return;

    if (mode == AwardsMode.RemoveCompletely) {
        awardButton.remove();
        return;
    }

    if (awardButton.getAttribute(`count`) == `0`) {
        awardsCss.register(target.shadowRoot);

        const upVoteButton = await dynamic(() => target.shadowRoot?.querySelector(`button[upvote]`), MAX_LOAD_LAG);

        if (upVoteButton == null) return;

        awardButton.classList.toggle(`pp_awardButton_hidden`, isCollapsed(upVoteButton));
        awardButton.classList.toggle(`pp_awardButton_collapsed`, isCollapsed(upVoteButton));
        setTimeout(() => {
            awardButton.classList.add(`pp_awardButton`);
        }, 500);

        upVoteButton.addEventListener(`click`, () => {
            awardButton.classList.toggle(`pp_awardButton_hidden`, isCollapsed(upVoteButton));

            setTimeout(() => {
                awardButton.classList.toggle(`pp_awardButton_collapsed`, isCollapsed(upVoteButton));
            }, 10);
        });
    }
}

function isCollapsed(upVoteButton: Element): boolean {
    return upVoteButton.getAttribute(`aria-pressed`) != `true`;
}
