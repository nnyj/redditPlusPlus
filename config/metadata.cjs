const { author, repository, version } = require('../package.json');

module.exports = {
    name: {
        $: 'Reddit++ RES',
        ru: 'Reddit++ RES'
    },
    description: {
        $: 'Upgrade your Reddit experience: remove annoying elements, make the UI cleaner and user-friendly, and enjoy powerful features like keyword filtering — highly customizable to fit your needs.',
        ru: 'Множество улучшений Reddit: удаление раздражающих элементов, более удобный интерфейс и продвинутые функции вроде фильтрации по ключевым словам с гибкой настройкой под ваши нужды.'
    },
    namespace: 'nnyj/redditPlusPlus',
    version: version,
    author: author,
    require: [],
    icon: 'https://raw.githubusercontent.com/lnm95/redditPlusPlus/main/public/icon/redditPlusPlusIcon.png',
    source: repository.url,
    downloadURL: 'https://github.com/nnyj/redditPlusPlus/releases/latest/download/redditPlusPlus.user.js',
    updateURL: 'https://github.com/nnyj/redditPlusPlus/releases/latest/download/redditPlusPlus.user.js',
    license: 'MIT',
    match: ['*://*.reddit.com/*'],
    grant: ['unsafeWindow', 'GM_getValue', 'GM_setValue', 'GM_deleteValue'],
    'run-at': 'document-start'
};
