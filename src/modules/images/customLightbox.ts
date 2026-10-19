import { appendElement } from '../../utils/element';
import { NONE_COLOR, appendSvg } from '../../utils/svg';
import { settings } from '../settings/settings';
import { imageZoom } from './imageZoom';

import imageCloseButtonSvg from '@resources/imageCloseButton.svg';

class CustomLightbox {
    private openned: boolean = false;
    private lightbox!: HTMLElement;
    private background!: HTMLImageElement;
    private container!: HTMLElement;
    private target!: HTMLImageElement;

    open(src: string) {
        if (this.openned) return;

        this.openned = true;

        if (this.lightbox == undefined) {
            this.build();
        }

        this.target.src = src;
        this.background.src = src;

        imageZoom.setImage(this.target);

        document.body.appendChild(this.lightbox);
    }

    private close() {
        this.lightbox.remove();

        imageZoom.clearImage();

        this.target.src = ``;
        this.background.src = ``;

        this.container.classList.toggle(`pp_image_drag`, false);

        this.openned = false;
    }

    private build() {
        this.lightbox = document.createElement(`div`);
        this.lightbox.classList.add(`pp_customLightbox`);
        this.lightbox.dataset.open = String(false);

        // background
        this.background = appendElement(this.lightbox, `img`, [`pp_customLightbox_background`, `post-background-image-filter`, `opacity-30`, `object-cover`, `scale-[1.2]`]) as HTMLImageElement;

        // close button
        const closeButton = appendElement(this.lightbox, `button`);
        closeButton.className = `absolute top-sm end-sm z-10 opacity-100 button-large px-[calc(var(--rem16)-var(--button-border-width,0px))] button-media items-center justify-center button inline-flex`;

        const closeButtonSpan = appendElement(closeButton, `span`);
        closeButtonSpan.className = `flex items-center justify-center`;

        const closeButtonSpanSpan = appendElement(closeButtonSpan, `span`);
        closeButtonSpanSpan.className = `flex items-center gap-xs`;

        appendSvg(closeButtonSpanSpan, imageCloseButtonSvg, 20, 20, { strokeColor: NONE_COLOR });

        // target
        this.container = appendElement(this.lightbox, `div`, `pp_customLightbox_container`);

        this.target = appendElement(this.container, `img`, [`pp_customLightbox_target`, `pp_lightbox_target`]) as HTMLImageElement;
        this.target.alt = `Zoomable image`;
        this.target.ondragstart = function () {
            return false;
        };

        // close
        closeButton.addEventListener('click', () => {
            this.close();
        });

        if (settings.LIGHTBOX_CLOSE.isEnabled()) {
            this.background.classList.add(`pp_image_pointer`);

            this.lightbox.addEventListener('click', e => {
                if (e.target != this.target) {
                    this.close();
                }
            });
        }
    }
}

export const lightbox = new CustomLightbox();
