import { getCurrentCustomFeed } from '../customFeed/customFeed';
import { getCurrentSub } from '../subs/subs';
import { customFeedData, defaultFeedData, defaultSorts, generateFeedHref, subsFeedData, subsLatestSort } from './feed';
import { FeedLocation, getFeedLocation } from './feedLocation';
import { FeedSort } from './feedSort';

export interface RedirectConfig {
    tittle: string;
    descriptionLabel: string;
    isOverridable: boolean;
    isOptional: boolean;
}

export const redirectConfigs = new Map<FeedLocation, RedirectConfig>([
    [FeedLocation.Sub, { tittle: `Subreddits`, descriptionLabel: `Subreddits`, isOverridable: true, isOptional: true }],
    [FeedLocation.Home, { tittle: `Home`, descriptionLabel: `Home`, isOverridable: false, isOptional: false }],
    [FeedLocation.Popular, { tittle: `Popular`, descriptionLabel: `r/Popular`, isOverridable: false, isOptional: false }],
    [FeedLocation.All, { tittle: `All`, descriptionLabel: `r/All`, isOverridable: false, isOptional: false }],
    [FeedLocation.Custom, { tittle: `Custom feeds`, descriptionLabel: `Custom`, isOverridable: true, isOptional: false }]
]);

function isRedirectable() {
    if (window.location.href == `https://www.reddit.com/`) return true;

    if (window.location.href.includes(`/?f=flair_name`)) return false;

    if (window.location.href.includes(`?feed=home`)) {
        return window.location.href.includes(`reddit.com/?feed=home`);
    }

    // only feed front pages, pathname excludes query so `/r/sub/search?q=` is not a front page
    const parts = window.location.pathname.split(`/`).filter(Boolean);
    const isSubFront = parts.length == 2 && parts[0] == `r`;
    const isCustomFront = parts.length == 4 && parts[0] == `user` && parts[2] == `m`;

    return isSubFront || isCustomFront;
}

export function initializeFeedRedirect() {
    checkFeedRedirect();

    let oldHref = document.location.href;
    const observer = new MutationObserver(mutations => {
        if (oldHref !== document.location.href) {
            oldHref = document.location.href;

            checkFeedRedirect();
        }
    });

    window.addEventListener('load', () => {
        const body = document.querySelector('body');

        if (!body) return;

        observer.disconnect();
        observer.observe(body, { childList: true, subtree: true });
    });
}

function checkFeedRedirect() {
    if (!isRedirectable()) return;

    const location = getFeedLocation();
    const data = defaultFeedData.get(FeedLocation[location]);
    const defaultSort = defaultSorts.get(location);

    if (location == FeedLocation.Sub) {
        const sub = getCurrentSub();

        if (!sub) return;

        const latest = subsLatestSort.get(sub);
        const subData = subsFeedData.get(sub);

        if (subData != null) {
            if (subData.defaultSort == latest || !subData.redirect) return;

            document.location.replace(sortedHref(subData.defaultSort));
            return;
        }

        if (!data.redirect) return;

        if (latest != null && data.defaultSort != latest) {
            document.location.replace(sortedHref(data.defaultSort));
            return;
        }
    }

    if (location == FeedLocation.Custom) {
        const custom = getCurrentCustomFeed();
        const customData = custom ? customFeedData.get(custom) : null;

        if (customData != null) {
            if (customData.defaultSort == defaultSort || !customData.redirect) return;

            document.location.replace(sortedHref(customData.defaultSort));
            return;
        }
    }

    if (data.defaultSort == defaultSort) return;

    document.location.replace(`https://www.reddit.com${generateFeedHref(location, data.defaultSort)}`);
}

// sort goes into the path, before the query, and the path may lack its trailing slash
function sortedHref(sort: FeedSort): string {
    const path = document.location.pathname.endsWith(`/`) ? document.location.pathname : `${document.location.pathname}/`;
    return `${path}${sort.toString().toLowerCase()}/${document.location.search}`;
}
