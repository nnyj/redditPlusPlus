class Mouse {
    public x!: number;
    public y!: number;
}

class Drag {
    public enabled!: boolean;
    public start!: Mouse;
    public current!: Mouse;
    public scale!: number;
}

class ImageZoom {
    canvas: HTMLElement | null = null;
    mouse: Mouse;
    drag: Drag;

    constructor() {
        this.mouse = { x: 0, y: 0 };
        this.drag = {
            enabled: false,
            start: { x: 0, y: 0 },
            current: { x: 0, y: 0 },
            scale: 1
        };

        this.scrollImage = this.scrollImage.bind(this);
        this.startDrag = this.startDrag.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.endDrag = this.endDrag.bind(this);
    }

    setImage(image: HTMLElement) {
        if (image == this.canvas) return;

        if (this.canvas) {
            this.clearImage();
        }

        window.addEventListener('wheel', this.scrollImage, { passive: false });
        image.addEventListener('mousedown', this.startDrag);
        document.addEventListener('mousemove', this.mouseMove);
        image.addEventListener('mouseup', this.endDrag);
        image.addEventListener('mouseleave', this.endDrag);

        image.ondragstart = function () {
            return false;
        };

        // reset pos
        this.drag.current = { x: 0, y: 0 };
        this.drag.scale = 1;

        this.canvas = image;
        this.updateTransform();
    }

    clearImage() {
        window.removeEventListener('wheel', this.scrollImage);
        this.canvas?.removeEventListener('mousedown', this.startDrag);
        document.removeEventListener('mousemove', this.mouseMove);
        this.canvas?.removeEventListener('mouseup', this.endDrag);
        this.canvas?.removeEventListener('mouseleave', this.endDrag);

        this.canvas = null;
    }

    private updateTransform() {
        this.canvas!.style.transform = `translate(${this.drag.current.x}px, ${this.drag.current.y}px) scale(${this.drag.scale}, ${this.drag.scale})`;
    }

    private startDrag(event: any) {
        this.drag.start.x = event.screenX - this.drag.current.x;
        this.drag.start.y = event.screenY - this.drag.current.y;
        this.drag.enabled = true;

        this.canvas!.classList.toggle(`pp_image_drag`, true);
    }

    private mouseMove(event: any) {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;

        if (this.drag.enabled) {
            this.drag.current.x = event.screenX - this.drag.start.x;
            this.drag.current.y = event.screenY - this.drag.start.y;

            this.updateTransform();
        }
    }

    private endDrag() {
        this.fit(1);

        this.drag.enabled = false;

        this.canvas!.classList.toggle(`pp_image_drag`, false);
    }

    private scrollImage(e: any) {
        const m = Math.max(1.0, 1.0 + Math.log2(this.drag.scale * this.drag.scale));

        const prevScale = this.drag.scale;

        this.drag.scale = Math.max(0.5, this.drag.scale + (-e.deltaY / 1000) * m);

        const rect = this.canvas!.getBoundingClientRect();

        const hh = rect.height / 2;
        const hw = rect.width / 2;

        const dy = rect.y + hh;
        const dx = rect.x + hw;

        const os = this.drag.scale / prevScale - 1;
        this.drag.current.y -= Math.min(Math.max(this.mouse.y - dy, -hh), hh) * os;
        this.drag.current.x -= Math.min(Math.max(this.mouse.x - dx, -hw), hw) * os;

        if (e.deltaY > 0) {
            this.drag.current.y /= 1.1;
            this.drag.current.x /= 1.1;
        }

        this.fit(0.33);

        e.preventDefault();
    }

    private fit(force: number) {
        const offset = 0;
        const rect = this.canvas!.getBoundingClientRect();

        const left = offset - rect.left;
        const right = rect.right - window.innerWidth + offset;

        if (left > 0 && right < 0) {
            this.drag.current.x += (rect.width > window.innerWidth ? -right : left) * force;
        } else if (left < 0 && right > 0) {
            this.drag.current.x += (rect.width > window.innerWidth ? left : -right) * force;
        }

        const top = offset - rect.top;
        const bottom = rect.bottom - window.innerHeight + offset;

        if (top > 0 && bottom < 0) {
            this.drag.current.y += (rect.height > window.innerHeight ? -bottom : top) * force;
        } else if (top < 0 && bottom > 0) {
            this.drag.current.y += (rect.height > window.innerHeight ? top : -bottom) * force;
        }

        this.updateTransform();
    }
}

export const imageZoom = new ImageZoom();
