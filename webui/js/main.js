Vue.component("comp-outcomes", {
    data: function () {
        return {
            sampleChoices: 4,
            sampleSize: 1000,
            model: {},
            temp: {},
            choices: null,
            activeKey: ""
        }
    },
    beforeCreate: async function () {
        let outcomes = await axios.get("/outcomes")
        let noita = await axios.get("/noita")//todo make this not need restart if noita settings change
        this.$set(this, "model", outcomes.data)
        this.$set(this, "temp", outcomes.data)
        this.$set(this, "choices", noita.data.option_types)
        if (this.activeKey === "" || Object.keys(this.temp).length == 0) {
            this.activeKey = Object.keys(this.model)[0] || ""
        }
    },
    computed: {
        totalWeight: function () {
            if (Object.keys(this.temp) == 0) { return }
            let weights = {}
            Object.values(this.temp).forEach(outcome => {
                if (!outcome.enabled) { return }
                weights[outcome.type] = (weights[outcome.type] || 0) + outcome.rarity
            })
            return weights
        },
        list: function () {
            let sorted = Object.values(this.model).sort((a, b) => {
                let nameA = a.name.toUpperCase()
                let nameB = b.name.toUpperCase()
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }

                return 0;
            }).sort((a, b) => {
                let typeA = a.type.toUpperCase()
                let typeB = b.type.toUpperCase()
                if (typeA < typeB) {
                    return -1;
                }
                if (typeA > typeB) {
                    return 1;
                }

                return 0;
            })
            return sorted
        }
    },
    methods: {
        reset: function () {
            this.temp = JSON.parse(JSON.stringify(this.model))
        },
        getDefaults: async function () {
            let defaults = await axios.get("/reset/outcomes")
            this.$set(this, "model", defaults.data)
            this.$set(this, "temp", defaults.data)
        },
        calculateOdds: function (type, weight) {
            let odds = (weight / this.totalWeight[type]) * 100
            return `${odds.toFixed(2)}%`
        },
        apply: function (id) {
            axios.post(`/outcomes/${id}`, this.temp[id])
        },
        toGame: function (id) {
            axios.post(`/togame/${id}`)
        },
        isNumber(val) {
            if (typeof val == "number") {
                return true
            }
            else {
                return "Not a number"
            }
        }
    },
    template: `<div>
    <v-navigation-drawer app clipped permanent >
        <v-list-item>
            <v-list-item-content>
                <v-list-item-title class="title">
                    Outcomes <v-btn small @click="getDefaults()">Reset</v-btn>
                </v-list-item-title>
            </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>

    <v-list dense nav>
        <v-list-item v-for="item in list" :key="item.id" link>

            <v-list-item-content @click="activeKey = item.id">
                <v-list-item-title>{{ temp[item.id].name }}</v-list-item-title>
                <v-list-item-subtitle v-text="temp[item.id].type + ' - ' +
                    temp[item.id].rarity + '/' + totalWeight[item.type] +
                    ' [' + calculateOdds(temp[item.id].type, temp[item.id].rarity) + ']'"></v-list-item-subtitle>
            </v-list-item-content>

        </v-list-item>
    </v-list>

    </v-navigation-drawer>
    <v-container fluid v-if="typeof temp[activeKey] != 'undefined'">
        <v-card>
            <v-card-title>{{temp[activeKey].name}}</v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <v-row>
                    <v-col cols="6" md="4">
                        <v-text-field label="Type" v-model="temp[activeKey].type" outlined>
                        </v-text-field>
                    </v-col>
                    <v-col cols="6" md="4">
                        <v-text-field :label="'Rarity '+ calculateOdds(temp[activeKey].type, temp[activeKey].rarity)" v-model.number="temp[activeKey].rarity" type="number" :rules="[isNumber]" outlined>
                        </v-text-field>
                    </v-col>
                    <v-col cols="6" md="2">
                        <v-checkbox label="Enabled" v-model="temp[activeKey].enabled">
                        </v-checkbox>
                    </v-col>
                    <v-col cols="6" md="2">
                        <v-btn @click="toGame(temp[activeKey].id)">toGame</v-btn>
                    </v-col>
                </v-row>
                

                <v-text-field label="Name" v-model="temp[activeKey].name" outlined>
                </v-text-field>

                <v-text-field label="Description" v-model="temp[activeKey].description" outlined>
                </v-text-field>

                <v-textarea label="Comment" v-model="temp[activeKey].comment" outlined>
                </v-textarea>

                <v-divider></v-divider>

                <v-card-actions>
                    <v-row align="center" justify="center">
                    <v-btn @click="apply(temp[activeKey].id)">Apply</v-btn> <v-btn @click="reset()">Cancel</v-btn>
                    </v-row>
                </v-card-actions>
            </v-card-text>
        </v-card>
    </v-container>
    </div>`
})

Vue.component("comp-noita", {
    data: function () {
        return {
            model: {},
            temp: {},
            activeKey: ""
        }
    },
    beforeCreate: async function () {
        let noita = await axios.get("/noita")
        this.$set(this, "model", noita.data)
        this.$set(this, "temp", noita.data)
        if (this.temp.option_types.length > 0) {
            for (let option in this.temp.option_types) {
                this.temp.option_types[option].uid = (Math.random() * 100000000) + 1000
            }
        }

        if (this.activeKey === "" || Object.keys(this.temp).length == 0) {
            this.activeKey = Object.keys(this.model)[0] || ""
        }
    },
    computed: {
        totalWeight: function () {
            if (Object.keys(this.temp.option_types || {}) == 0) { return }
            if (this.temp && this.temp.option_types) {
                return this.temp.option_types.reduce((accumulator, val) => accumulator + val.rarity, 0)
            }
            else {
                return 0
            }
        }
    },
    methods: {
        reset: function () {
            this.temp = JSON.parse(JSON.stringify(this.model))
            if (this.temp.option_types.length > 0) {
                for (let option in this.temp.option_types) {
                    this.temp.option_types[option].uid = (Math.random() * 100000000) + 1000
                }
            }
        },
        getDefaults: async function () {
            let defaults = await axios.get("/reset/option_types")
            this.$set(this, "model", defaults.data)
            this.$set(this, "temp", defaults.data)
            if (this.temp.option_types.length > 0) {
                for (let option in this.temp.option_types) {
                    this.temp.option_types[option].uid = (Math.random() * 100000000) + 1000
                }
            }
        },
        calculateOdds: function (weight) {
            let odds = (weight / this.totalWeight) * 100
            return `${odds.toFixed(2)}%`
        },
        apply: function (id) {
            let toSend = JSON.parse(JSON.stringify(this.temp))
            if (toSend.option_types.length > 0) {
                for (let option in toSend.option_types) {
                    delete toSend.option_types[option].uid
                }
            }
            axios.post(`/noita`, toSend)
        },
        addOption: function () {
            this.temp.option_types.push({
                name: "unnamed",
                rarity: 50,
                uid: (Math.random() * 100000000) + 1000
            })
        },
        rmOption: function (index) {
            this.temp.option_types.splice(index, 1)
        },
        isNumber(val) {
            if (typeof val == "number") {
                return true
            }
            else {
                return "Not a number"
            }
        }
    },
    template: `<div>
    <v-container fluid>
        <v-card>
            <v-card-title>Noita Settings</v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <v-row>
                    <v-col cols="6" md="2">
                        <v-checkbox label="Enabled" v-model="temp.enabled">
                        </v-checkbox>
                    </v-col>
                    <v-col cols="6" md="2">
                        <v-checkbox label="In-Game UI" v-model="temp.game_ui">
                        </v-checkbox>
                    </v-col>
                    <v-col cols="6" md="2">
                        <v-checkbox label="OBS Overlay" v-model="temp.obs_overlay">
                        </v-checkbox>
                    </v-col>
                    <v-col cols="6" md="2">
                        <v-checkbox label="Show Votes" v-model="temp.display_votes">
                        </v-checkbox>
                    </v-col>
                </v-row>
                
                <v-row>
                    <v-col cols="4" md="3">
                        <v-text-field label="Number of Options" v-model.number="temp.options_per_vote" type="number" :rules="[isNumber]" outlined>
                        </v-text-field>
                    </v-col>
                    <v-col cols="4" md="3">
                        <v-text-field label="Voting Time" v-model.number="temp.voting_time" type="number" :rules="[isNumber]" outlined>
                        </v-text-field>
                    </v-col>
                    <v-col cols="4" md="3">
                        <v-text-field label="Time Between Votes" v-model.number="temp.time_between_votes" type="number" :rules="[isNumber]" outlined>
                        </v-text-field>
                    </v-col>
                </v-row>

                <v-divider></v-divider>
                <v-card-title>Options {{totalWeight}}/1000      <v-btn small @click="getDefaults()">Reset</v-btn></v-card-title>
                
                <v-row v-for="(item, index) in temp.option_types" :key="item.uid">
                    <v-col cols="5" md="5">
                        <v-text-field label="Name" v-model="temp.option_types[index].name" outlined>
                        </v-text-field>
                    </v-col>
                    <v-col cols="5" md="5">
                        <v-text-field :label="'Rarity '+ calculateOdds(temp.option_types[index].rarity)" v-model.number="temp.option_types[index].rarity" type="number" :rules="[isNumber]" outlined>
                        </v-text-field>
                    </v-col>
                    <v-col cols="2" md="2">
                        <v-btn align="center" justify="center" icon small @click="rmOption(index)"><v-icon>mdi-close</v-icon></v-btn>
                    </v-col>
                </v-row>
                <v-btn block @click="addOption()"><v-icon>mdi-plus</v-icon></v-btn>

                <v-divider></v-divider>

                <v-card-actions>
                    <v-row align="center" justify="center">
                        <v-btn @click="apply()">Apply</v-btn> <v-btn @click="reset()">Cancel</v-btn>
                    </v-row>
                </v-card-actions>
            </v-card-text>
        </v-card>
    </v-container>
    </div>`
})

Vue.component("comp-twitch", {
    data: function () {
        return {
            model: {},
            temp: {},
            tempId: "",
            activeKey: ""
        }
    },
    beforeCreate: async function () {
        let twitch = await axios.get("/twitch")
        this.$set(this, "model", twitch.data)
        this.$set(this, "temp", twitch.data)

        if (this.activeKey === "" || Object.keys(this.temp).length == 0) {
            this.activeKey = Object.keys(this.model)[0] || ""
        }
    },
    computed: {
        rewards: function () {
            return Object.keys(this.temp["custom-rewards"]);
        }
    },
    methods: {
        reset: function () {
            this.temp = JSON.parse(JSON.stringify(this.model))
        },
        apply: function (id) {
            axios.post(`/twitch`, this.temp)
        },
        addReward: function (id) {
            this.$set(this.temp["custom-rewards"], id, {
                enabled: false,
                name: "Unnamed",
                comment: "What does it do?",
                msg_head: "",
                msg_body: "",
                func: ""
            })
        },
        rmReward: function (id) {
            this.$set(this.temp["custom-rewards"], id, undefined)
        }
    },
    template: `
    <v-container fluid>
        <v-card >
            <v-card-title>Twitch Settings</v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <v-row>
                    <v-col cols="6" md="6">
                        <v-text-field hint="Takes effect after restarting the twitch bot" label="Twitch Channel" v-model="temp.channel_name" outlined>
                        </v-text-field>
                    </v-col>
                    <v-col cols="4" md="4">
                        <v-checkbox label="Show message in-game" v-model="temp.show_user_msg">
                        </v-checkbox>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-divider></v-divider>
            <template v-if="typeof temp['highlighted-message'] != 'undefined'">
            <v-card-title>
                <span class="title">Highlighted Messages</span>
                <v-checkbox v-model="temp['highlighted-message'].enabled">
                </v-checkbox>
            </v-card-title>
            <v-divider></v-divider>

            <v-card-text v-if="temp['highlighted-message'].enabled">
                <v-row>
                    <v-col cols="6" md="6" >
                        <v-textarea label="Comment" v-model="temp['highlighted-message'].comment" outlined>
                        </v-textarea>
                    </v-col>
                    <v-col cols="6" md="6" >
                        <v-textarea label="Function" v-model="temp['highlighted-message'].func" outlined>
                        </v-textarea>
                    </v-col>
                </v-row>
            </v-card-text>
            </template>
            <v-divider></v-divider>
            <v-card-title>Custom Rewards</v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <v-row v-for="id in rewards" :key="id">
                    <template v-if="typeof temp['custom-rewards'][id] != 'undefined'">
                    <v-col cols="12" md="12">
                        <span class="subtitle-2">
                            <v-btn @click="rmReward(id)" icon large class="ma-0"><v-icon>mdi-delete</v-icon></v-btn>
                            id: {{id}}
                        </span>
                    </v-col>
                    <v-col cols="8" md="8">
                        <v-text-field label="Reward Name" v-model="temp['custom-rewards'][id].name" outlined>
                        </v-text-field>
                    </v-col>
                    <v-col cols="4" md="4">
                        <v-checkbox label="Enabled" v-model="temp['custom-rewards'][id].enabled">
                        </v-checkbox>
                    </v-col>
                    <v-col cols="6" md="6">
                        <v-text-field label="Message Header" v-model="temp['custom-rewards'][id].msg_head" outlined>
                        </v-text-field>
                    </v-col>
                    <v-col cols="6" md="6">
                        <v-text-field label="Message Body" v-model="temp['custom-rewards'][id].msg_body" outlined>
                        </v-text-field>
                    </v-col>
                    <v-col cols="6" md="6" >
                        <v-textarea label="Comment" v-model="temp['custom-rewards'][id].comment" outlined>
                        </v-textarea>
                    </v-col>
                    <v-col cols="6" md="6">
                        <v-textarea label="Function" v-model="temp['custom-rewards'][id].func" outlined>
                        </v-textarea>
                    </v-col>
                    <v-col cols="12" md="12">
                    <v-divider></v-divider>
                    </v-col>
                    </template>
                </v-row>
            </v-card-text>
            <v-divider></v-divider>
            <v-col cols="12" md="12">
                <v-text-field label="Add Reward" hint="Reward id from the console: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                v-model="tempId" @keypress.enter="addReward(tempId)">
                    <template v-slot:append>
                        <v-btn depressed tile class="ma-0" @click="addReward(tempId)">Add</v-btn>
                    </template>
                </v-text-field>
            </v-col>
            <v-card-actions>
                    <v-row align="center" justify="center">
                        <v-btn @click="apply()">Apply</v-btn> <v-btn @click="reset()">Cancel</v-btn>
                    </v-row>
            </v-card-actions>
        </v-card>
    </v-container>
    `
})

Vue.component("comp-misc", {
    data: function () {
        return {
            plusTime: 0,
            minusTime: 0
        }
    },
    methods: {
        addTime(val) {
            if (isNaN(val)) {
                return
            }
            axios.post("/misc/timeleft", { val: Math.floor(val) })
        },
        rmTime(val) {
            if (isNaN(val)) {
                return
            }
            axios.post("/misc/timeleft", { val: Math.floor(val - val * 2) })
        },
        reloadOutcomes(val) {
            axios.post("/misc/reload_outcomes", {})
        },
        isNumber(val) {
            if (typeof val == "number") {
                return true
            }
            else {
                return "Not a number"
            }
        }
    },
    template: `<div>
    <v-container fluid>
        <v-card>
            <v-card-title>Misc Things</v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <v-row>
                    <v-col cols="6" md="6">
                        <v-text-field label="Increase time" v-model.number="plusTime"
                        :rules="[isNumber]" @keypress.enter="addTime(plusTime)">
                            <template v-slot:append>
                                <v-btn depressed tile @click="addTime(plusTime)">Send</v-btn>
                            </template>
                        </v-text-field>
                    </v-col>
                    <v-col cols="6" md="6">
                        <v-text-field label="Decrease timer" v-model.number="minusTime"
                        :rules="[isNumber]" @keypress.enter="rmTime(minusTime)">
                            <template v-slot:append>
                                <v-btn depressed tile @click="rmTime(minusTime)">Send</v-btn>
                            </template>
                        </v-text-field>
                    </v-col>
                    <v-divider></v-divider>
                    <v-col cols="4" md="4">
                        <v-btn @click="reloadOutcomes()">Reload Outcomes</v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </v-container>
    </div>`
})

let vm = new Vue({
    el: '#app',
    vuetify: new Vuetify(),
    data: {
        tab: "outcomes",
        models: {
            outcomes: {},
            twitch: {},
            noita: {},
            obs_template: {},
            misc: {}
        }
    },
    beforeCreate: async function () {
        this.$vuetify.theme.dark = true

        let outcomes = await axios.get("/outcomes")
        this.$set(this.models, "outcomes", outcomes.data)

        let twitch = await axios.get("/twitch")
        this.$set(this.models, "twitch", twitch.data)

        let noita = await axios.get("/noita")
        this.$set(this.models, "noita", noita.data)
        console.log("data")
    }
})