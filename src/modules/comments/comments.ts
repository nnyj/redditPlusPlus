import { PROFILE_USER_DATA, SHOW_RENDERED_COMMENTS, profiler_comments } from '../../_debug/debug';
import { ContentType, MAX_LOAD_LAG } from '../../defines';
import { dynamic } from '../../utils/dynamic';
import { checkIsRendered, observeChildren } from '../../utils/tools';
import { renderCommentBookmark } from '../bookmark';
import { css } from '../customCSS';
import { filterComment } from '../filters/filters';
import { lightbox } from '../images/customLightbox';
import { renderResScore } from '../resLayout/resLayout';
import { settings } from '../settings/settings';
import { renderUserInfo } from '../users/userInfo';
import { renderContextMenu } from './contextMenu';
import { registerInlineThreads } from './inline_thread';
import { OnCommentsTreeLoaded, renderCommentsSortButtons } from './sortButtons';
import { renderUserTags } from './userTags';

import style from './comments.less';
import hideShareStyle from './hideShare.less';
import hideStickyComposerStyle from './hideStickyComposer.less';

let rootIntersector: IntersectionObserver | null = null;
let commentsIntersector: IntersectionObserver | null = null;
let commentsMutations: MutationObserver | null = null;

export async function renderComments(container: Element) {
    css.addStyle(style, `comments`);

    registerInlineThreads();

    if (settings.HIDE_SHARE.isEnabled()) {
        css.addStyle(hideShareStyle, `hideShare`);
    }

    if (settings.HIDE_STICKY_COMPOSER.isEnabled()) {
        css.addStyle(hideStickyComposerStyle, `hideStickyComposer`);
    }

    // intersections
    if (rootIntersector != null) {
        rootIntersector.disconnect();

        if (DEBUG && PROFILE_USER_DATA) {
            profiler_comments.observedRoots = 0;
        }
    } else {
        rootIntersector = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    const comment = entry.target;
                    if (entry.isIntersecting) {
                        renderComment(comment);

                        // registry childs when root becomes visible
                        registerAllComments(comment);

                        if (DEBUG && PROFILE_USER_DATA) {
                            profiler_comments.observedRoots--;
                        }

                        rootIntersector?.unobserve(entry.target);
                    }
                }
            },
            { threshold: 0 }
        );
    }

    if (commentsIntersector != null) {
        commentsIntersector.disconnect();

        if (DEBUG && PROFILE_USER_DATA) {
            profiler_comments.observedChilds = 0;
        }
    } else {
        commentsIntersector = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    const comment = entry.target;
                    if (entry.isIntersecting) {
                        renderComment(comment);

                        if (DEBUG && PROFILE_USER_DATA) {
                            profiler_comments.observedChilds--;
                        }

                        commentsIntersector!.unobserve(entry.target);
                    }
                }
            },
            { threshold: 0 }
        );
    }

    // mutations
    if (commentsMutations != null) {
        commentsMutations.disconnect();
    } else {
        commentsMutations = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof HTMLElement) {
                        // static comments
                        const commentTree = node.parentElement?.querySelector(`shreddit-comment-tree`);

                        if (commentTree != null) {
                            registerAllRoots(commentTree);

                            // singal to commentsSort buttons that comments refreshed
                            OnCommentsTreeLoaded();
                        }

                        // dynamic comments, also the ones inside an added wrapper
                        const addedComments = node.matches(`shreddit-comment`) ? [node, ...node.querySelectorAll(`shreddit-comment`)] : node.querySelectorAll(`shreddit-comment`);
                        for (const comment of addedComments) {
                            if (comment.getAttribute(`depth`) == `0`) {
                                registerRoot(comment);
                            } else {
                                registerComment(comment);
                            }
                        }

                        if (settings.HIDE_RELATED_POSTS.isEnabled() && node.matches(`h2`) && node.textContent?.includes(`Related posts`)) {
                            const relatedHeader = node;
                            const relatedPosts = relatedHeader.nextSibling;

                            relatedHeader.remove();
                            relatedPosts?.remove();
                        }
                    }
                }
            }
        });
    }

    commentsMutations.observe(container, { childList: true, subtree: true });

    // sort buttons

    renderCommentsSortButtons(container);
}

function registerAllRoots(container: Element) {
    container.querySelectorAll(`shreddit-comment[depth="0"]`).forEach(comment => {
        registerRoot(comment);
    });
}

function registerRoot(comment: Element) {
    if (checkIsRendered(comment)) return;

    // the comment itself, an observed summary stops firing if Reddit replaces it
    rootIntersector!.observe(comment);

    if (DEBUG && PROFILE_USER_DATA) {
        profiler_comments.observedRoots++;
    }
}

function registerAllComments(container: Element) {
    container.querySelectorAll(`shreddit-comment`).forEach(comment => {
        registerComment(comment);
    });
}

function registerComment(comment: Element) {
    if (checkIsRendered(comment)) return;

    commentsIntersector!.observe(comment);

    if (DEBUG && PROFILE_USER_DATA) {
        profiler_comments.observedChilds++;
    }
}

export async function renderComment(comment: Element) {
    renderResScore(comment);

    // skip [deleted]
    if (comment.getAttribute(`author`) == `[deleted]`) return;

    const commentBody = comment.querySelector(`div[slot="comment"]`)!;
    const commentMeta = comment.querySelector(`div[slot="commentMeta"]`)!;

    if (DEBUG && SHOW_RENDERED_COMMENTS) {
        commentBody.classList.add(`pp_debug_rendered`);
    }

    // filter
    filterComment(comment, commentBody);

    // collapse automoderator and pinned mods
    if (settings.COLLAPSE_AUTOMODERATOR.isEnabled()) {
        const author = comment.getAttribute(`author`);
        if (author != null && author == `AutoModerator`) {
            comment.setAttribute(`collapsed`, ``);
            return;
        }

        dynamic(() => {
            const isMod = commentMeta.querySelector(`shreddit-comment-author-modifier-icon[distinguished-as="MODERATOR"]`) != null;
            const isPinned = comment.querySelector(`shreddit-comment-badges`)?.shadowRoot?.querySelector(`svg[icon-name="pin-fill"]`) != null;

            return isMod && isPinned ? true : null;
        }, MAX_LOAD_LAG).then(result => {
            if (result) {
                comment.querySelector(`details`)?.toggleAttribute(`open`, false);
            }
        });
    }

    // add anchors
    const commentAuthor = commentMeta.querySelector(`faceplate-tracker[noun="comment_author"]`);
    const nickname = commentAuthor?.parentElement?.parentElement;

    if (!nickname || !nickname.parentElement) return;

    const tagsAnchor = document.createElement(`div`);
    tagsAnchor.setAttribute(`pp-anchor`, `tags`);
    const OPTag = nickname.parentElement.querySelector(`.ml-2xs`);
    if (OPTag != null) {
        OPTag.after(tagsAnchor);
    } else {
        nickname.after(tagsAnchor);
    }

    const time = await dynamic(() => commentMeta?.querySelector(`faceplate-tracker[noun="comment_time"]`), MAX_LOAD_LAG);

    const infoAnchor = document.createElement(`div`);
    infoAnchor.setAttribute(`pp-anchor`, `info`);
    time?.before(infoAnchor);

    // make ghosted when karma below zero
    if (settings.GHOSTED_COMMENTS.isEnabled() && parseInt(comment.getAttribute(`score`) ?? `0`) < 0) {
        comment.querySelector(`div[slot="commentAvatar"]`)!.classList.add(`pp_muted_avatar`);
        commentAuthor.querySelector(`a`)!.style.color = `#a5a5a5`;
        commentBody.classList.add(`pp_muted_content`);
    }

    // register image
    const imageContainer = commentBody.querySelector(`figure[class="rte-media"]`);
    if (imageContainer != null && settings.LIGHTBOX.isEnabled()) {
        const imageAnchor = imageContainer.querySelector(`a`) as HTMLAnchorElement;
        const href = imageAnchor.href;
        imageAnchor.removeAttribute(`href`);

        let image = imageContainer.querySelector(`img`) as HTMLImageElement | HTMLVideoElement | any;
        if (image == null) {
            image = imageContainer.querySelector(`shreddit-player`);
        }
        image.classList.add(`pp_image_pointer`);

        imageAnchor.addEventListener(`click`, () => {
            lightbox.open(href);
        });
    }

    renderUserTags(comment);

    const userId = comment.getAttribute(`author`)!;
    const userName = commentAuthor.querySelector(`a`)!;

    renderUserInfo(userId, ContentType.Comment, {
        commentMeta: commentMeta,
        nickName: userName,
        tagsAnchor: tagsAnchor,
        infoAnchor: infoAnchor
    });

    waitActionRow(comment);
}

async function waitActionRow(comment: Element) {
    await observeChildren(ownElement(comment, `div[slot="actionRow"]`)!);

    const contextMenuButton = await dynamic(() => ownElement(comment, `shreddit-overflow-menu`)?.shadowRoot?.querySelector(`rpl-dropdown`));

    if (!contextMenuButton) return;

    renderCommentBookmark(comment, contextMenuButton);

    contextMenuButton.addEventListener(
        `click`,
        () => {
            renderContextMenu(comment);
        },
        { once: true }
    );
}

// querySelector on a comment also reaches its replies, which render first when the comment's own row is late
function ownElement(comment: Element, selector: string): Element | null {
    return [...comment.querySelectorAll(selector)].find(element => element.closest(`shreddit-comment`) == comment) ?? null;
}
