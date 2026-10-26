import { css } from './customCSS';
import { settings } from './settings/settings';

import style from './notifications.less';

if (settings.NOTIFY_POPUP.isEnabled()) {
    css.addStyle(style);
}
