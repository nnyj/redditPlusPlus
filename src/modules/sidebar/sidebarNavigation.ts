import { MAX_LOAD_LAG } from '../../defines';
import { dynamic } from '../../utils/dynamic';
import { pascalCase } from '../../utils/tools';
import { settings } from '../settings/settings';

export enum SidebarNavigation {
    Home = `home`,
    Popular = `popular`,
    News = `news`,
    Explore = `explore`
}

export interface SidebarNavigationConfig {
    tittle: string;
    removeById?: string;
}

export const navigationConfigs: Map<SidebarNavigation, SidebarNavigationConfig> = new Map<SidebarNavigation, SidebarNavigationConfig>([
    [SidebarNavigation.Home, { tittle: `Home` }],
    [SidebarNavigation.Popular, { tittle: `Popular` }],
    [SidebarNavigation.News, { tittle: `News`, removeById: `news-posts` }],
    [SidebarNavigation.Explore, { tittle: `Explore` }]
]);

export async function RenderSidebarNavigations(sidebar: Element) {
    if (sidebar == null) {
        sidebar = document.body.querySelector(`#left-sidebar-container`)!;
    }

    const section = await dynamic(() => sidebar.querySelector(`left-nav-top-section`), MAX_LOAD_LAG * 2);

    if (!section) return;

    Object.values(SidebarNavigation).forEach(name => {
        const setting = settings.SIDEBAR_NAV_BUTTON.getChild(pascalCase(name), true);
        const config = navigationConfigs.get(name)!;

        section.toggleAttribute(name, setting.isEnabled());

        if (config.removeById && setting.isDisabled()) {
            dynamic(() => section?.shadowRoot?.querySelector(`#${config.removeById}`), MAX_LOAD_LAG).then(news => news?.remove());
        }
    });
}
