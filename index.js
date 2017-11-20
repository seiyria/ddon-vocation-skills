
var vue = new Vue({
    el: '#app',
    data: {
        selectedVocation: '',
        allVocations: [
            { name: 'Fighter',          color: 'danger' },
            { name: 'Hunter',           color: 'danger' },
            { name: 'Priest',           color: 'warning' },
            { name: 'Shield Sage',      color: 'info' },
            { name: 'Seeker',           color: 'danger' },
            { name: 'Sorcerer',         color: 'danger' },
            { name: 'Element Archer',   color: 'warning' },
            { name: 'Warrior',          color: 'danger' },
            { name: 'Alchemist',        color: 'info' },
            { name: 'Spirit Lancer',    color: 'warning' },
        ],
        showData: { baseSkills: true, unlockedSkills: true, baseAugs: true, unlockedAugs: true },
        translations: { enemy: {}, skills: {}, augments: {} },
        vocationData: {},
        neededData: [],
        loading: true
    },
    methods: {
        selectVocation(vocation, ignoreHashUpdate) {
            this.selectedVocation = vocation;
            if(!ignoreHashUpdate) {
                updateHash();
            }
        },
        selectSkill(skillName) {
            updateHash(skillName);
        },
        scrollTo(id) {
            document.getElementById(id).scrollIntoView();
        }
    }
});

function loadFromHash() {
    if(!window.location.hash) return;

    var baseHash = decodeURIComponent(window.location.hash.substring(1));

    if(baseHash.indexOf('-') !== -1) {

        var vocation = baseHash.split('-')[0];
        if(!vue.vocationData[vocation]) return;

        vue.selectedVocation = vocation;

        Vue.nextTick(() => {
            document.getElementById(baseHash).scrollIntoView();
        });

    } else {

        if(!vue.vocationData[baseHash]) return;

        vue.selectedVocation = baseHash;
    }

}

function updateHash(skillName) {
    window.location.hash = encodeURIComponent(vue.selectedVocation + (skillName ? '-' + skillName : ''));
}

function formatData(data) {
    return data;
}

function translationXMLToHash(xmlData) {
    var translations = {};

    _.each(xmlData.resource[0].message, ({ original, translation }) => {
        translations[translation[0]._text] = original[0]._text;
    });

    return translations;
}

function loadKey(key) {
    return JSON.parse(localStorage.getItem(key));
}

function saveKey(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

axios.get('skills.yml')
    .then(res => {
        var data = formatData(YAML.parse(res.data));

        var translations = data.translations;

        delete data.translations;

        vue.vocationData = data;
        vue.loading = false;

        loadFromHash();

        return {
            _commit: translations.commit,
            enemy: 'https://cdn.rawgit.com/' + translations.repo + '/' + translations.commit + '/ui/00_message/enemy/enemy_name.xml',
            augments: 'https://cdn.rawgit.com/' + translations.repo + '/' + translations.commit + '/ui/00_message/skill/ability_name.xml',
            skills: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                var padl = _.padStart('' + num, 2, '0');
                return 'https://cdn.rawgit.com/' + translations.repo + '/' + translations.commit + '/ui/00_message/skill/custom_skill_name_' + padl + '.xml'
            })
        };
    })
    .then(({ _commit, enemy, augments, skills }) => {
        var oldEnemyTranslationData = loadKey(_commit + '-enemyTranslation');
        var oldAugmentsTranslationData = loadKey(_commit + '-augmentsTranslation');
        var oldSkillsTranslationData = loadKey(_commit + '-skillsTranslation');

        var enemyPromise = oldEnemyTranslationData ? Promise.resolve(oldEnemyTranslationData) : axios.get(enemy);
        var augmentsPromise = oldAugmentsTranslationData ? Promise.resolve(oldAugmentsTranslationData) : axios.get(augments);
        var skillsPromises = oldSkillsTranslationData ? [Promise.resolve(oldSkillsTranslationData)] : skills.map(url => axios.get(url));

        return Promise.all([Promise.resolve(_commit), enemyPromise, augmentsPromise, ...skillsPromises]);
    }).then(([ _commit, enemy, augments, ...skills ]) => {

        if(enemy.data) {
            vue.translations.enemy = translationXMLToHash(xmlToJSON.parseString(enemy.data));
        } else {
            vue.translations.enemy = enemy;
        }

        if(augments.data) {
            vue.translations.augments = translationXMLToHash(xmlToJSON.parseString(augments.data));
        } else {
            vue.translations.augments = augments;
        }

        if(skills && skills[0].data) {
            vue.translations.skills = _.reduce(skills, (prev, cur) => {
                _.extend(prev, translationXMLToHash(xmlToJSON.parseString(cur.data)));
                return prev;
            }, {});
        } else {
            vue.translations.skills = skills;
        }

        saveKey(_commit + '-enemyTranslation', vue.translations.enemy);
        saveKey(_commit + '-augmentsTranslation', vue.translations.augments);
        saveKey(_commit + '-skillsTranslation', vue.translations.skills);
    });
