import { dynamic } from '../utils/dynamic';
import { appendElement } from '../utils/element';
import { checkIsRendered } from '../utils/tools';
import { css } from './customCSS';
import './notifications';
import { renderProfileMenu } from './profileMenu/profileMenu';

import style from './header.less';

css.addStyle(style);

export async function renderHeader(container: Element) {
    const nav = await dynamic(() => container.querySelector(`reddit-header-large`)?.querySelector(`nav`));

    if (!nav || checkIsRendered(nav)) return;

    const logo = await dynamic(() => container.querySelector(`#reddit-logo`));
    const logoPP = appendElement(logo!, `div`, `pp_logo`);
    logoPP.textContent = `++`;
    if (DEBUG) {
        logoPP.innerHTML = logoPP.textContent + ` <sup>(dev ${VERSION})</sup>`;
    }

    const userPanel = await dynamic(() => nav.querySelector(`span[data-part="inbox"]`)?.parentElement?.parentElement ?? nav.querySelector(`span[data-part="primary"]`)?.parentElement);

    if (userPanel) {
        userPanel.classList.add(`pp_userPanel`);
        userPanel.addEventListener(`click`, () => {
            renderProfileMenu();
        });
    }
}
