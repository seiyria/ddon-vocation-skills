
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

axios.get('skills.yml')
    .then(res => {
        vue.vocationData = formatData(YAML.parse(res.data));
        vue.loading = false;

        loadFromHash();
    });
