import { dynamic } from '../../utils/dynamic';
import { appendElement } from '../../utils/element';
import { checkIsRendered } from '../../utils/tools';
import { css } from '../customCSS';
import { settings } from '../settings/settings';
import { imageZoom } from './imageZoom';

import style from './images.less';

let galleryObserver: MutationObserver | null = null;
let galleryImages: Array<HTMLElement> = [];

export function renderNativeLightbox() {
    if (settings.LIGHTBOX.isDisabled()) return;

    css.addStyle(style, `images`);

    const app = document.body.querySelector(`shreddit-app`)!;

    new MutationObserver((mutations, _observer) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node instanceof HTMLElement && node.id == `shreddit-media-lightbox`) {
                    resolveLightboxType(node);
                }
            }

            for (const node of mutation.removedNodes) {
                if (node instanceof HTMLElement && node.id == `shreddit-media-lightbox`) {
                    imageZoom.clearImage();

                    if (galleryObserver) {
                        galleryObserver.disconnect();
                        galleryObserver = null;
                    }

                    if (galleryImages.length > 0) {
                        galleryImages.forEach(img => {
                            renderGalleryImage(img, false);
                        });

                        galleryImages = [];
                    }
                }
            }
        }
    }).observe(app, { childList: true });
}

function resolveLightboxType(lightboxRoot: HTMLElement) {
    new MutationObserver((mutations, observer) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node instanceof HTMLElement && node.matches(`div`) && node.classList.contains(`media-lightbox-img`)) {
                    renderSingleImage(node);
                    observer.disconnect();
                }

                if (node instanceof HTMLElement && node.matches(`gallery-carousel`)) {
                    renderGalleryCarousel(node);
                    observer.disconnect();
                }
            }
        }
    }).observe(lightboxRoot, { childList: true, subtree: true });
}

async function renderSingleImage(lightbox: HTMLElement) {
    const content = await dynamic(() => lightbox.querySelector(`.lightboxed-content`));
    const img = await dynamic(() => content?.querySelector(`img`));

    if (!content || !img) return;

    if (img.parentElement?.matches(`zoomable-img`)) {
        const zoomable = img.parentElement!;

        const container = appendElement(content, `div`);
        container.className = zoomable.className;
        container.append(img);

        zoomable.remove();
    }

    img.classList.toggle(`pp_lightbox_target`, true);

    imageZoom.setImage(img);

    // background actions
    if (settings.LIGHTBOX_CLOSE.isEnabled()) {
        const background = lightbox.querySelector(`img[role="presentation"]`);

        if (background && !checkIsRendered(background)) {
            background.classList.toggle(`pp_image_pointer`, true);

            const closeButton = await dynamic(() => lightbox.parentElement?.parentElement?.querySelector(`button[aria-label="Close lightbox"]`) as HTMLElement);

            lightbox.querySelector(`img[role="presentation"]`)?.addEventListener(`click`, () => {
                closeButton?.click();
            });
        }
    }
}

async function renderGalleryCarousel(gallery: HTMLElement) {
    const ul = gallery.querySelector(`ul`)!;
    const items = ul.querySelectorAll(`li`);

    galleryObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.attributeName == `style` && mutation.target instanceof HTMLElement) {
                let visibleItems: number = 0;
                let latestItem: HTMLElement;

                items.forEach(li => {
                    if (li.style.visibility == `visible`) {
                        visibleItems++;
                        latestItem = li;
                    }
                });

                if (visibleItems == 1) {
                    const img = latestItem!.querySelector(`figure`)?.querySelector(`img`);

                    if (img) {
                        imageZoom.setImage(img);
                    }
                }
            }
        }
    });

    const prevButton = await dynamic(() => gallery.shadowRoot?.querySelector(`span[slot="prevButton"]`)?.querySelector(`button`));
    const nextButton = await dynamic(() => gallery.shadowRoot?.querySelector(`span[slot="nextButton"]`)?.querySelector(`button`));
    const closeButton = await dynamic(() => gallery.parentElement?.parentElement?.querySelector(`button[aria-label="Close lightbox"]`) as HTMLElement);

    const bgClose = settings.LIGHTBOX_CLOSE.isEnabled();
    const bgNavigation = settings.LIGHTBOX_NAVIGATION.isEnabled();

    items.forEach(li => {
        galleryObserver!.observe(li, { attributes: true });

        const figure = li.querySelector(`figure`)!;
        const img = figure?.querySelector(`img`)!;

        renderGalleryImage(img, true);
        galleryImages.push(img);

        if ((bgClose || bgNavigation) && !checkIsRendered(figure)) {
            figure.classList.toggle(`pp_image_pointer`, true);

            figure.addEventListener(`click`, event => {
                if (event.target != figure) return;

                const button = event.clientX < window.innerWidth / 2 ? prevButton : nextButton;

                if (button?.getAttribute(`aria-disabled`) == `true`) {
                    if (bgClose) {
                        setTimeout(() => {
                            closeButton?.click();
                        }, 50);
                    }
                } else {
                    if (bgNavigation) {
                        button?.click();
                    } else if (bgClose) {
                        setTimeout(() => {
                            closeButton?.click();
                        }, 50);
                    }
                }
            });
        }
    });
}

function renderGalleryImage(img: HTMLElement, enabled: boolean) {
    img.classList.toggle(`pp_lightbox_target`, enabled);
    img.parentElement?.classList.toggle(`pp_lightbox_galleryFigure`, enabled);

    if (!enabled) {
        img.removeAttribute(`style`);
    }
}
