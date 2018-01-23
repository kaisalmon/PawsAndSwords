"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const alsatian_1 = require("alsatian");
const Effects = require("../main/effects");
function get_placeholder_obj(e, effectlist) {
    let obj = { "type": e };
    let fields = effectlist[e];
    for (let f of fields) {
        if (f == "hero_effects") {
            obj["effects"] = [{ "type": "placeholder_hero_effect" }];
        }
        if (f == "hero_passives") {
            obj["effects"] = [{ "type": "placeholder_hero_passive" }];
        }
        if (f == "amount") {
            obj["amount"] = "X";
        }
    }
    return obj;
}
class TestEffectConfig {
    EffectConfigTest() {
        let effectlist = require('../json/effectlist.json');
        for (let e in effectlist.hero_effects) {
            let obj = get_placeholder_obj(e, effectlist.hero_effects);
            let effect = Effects.parseEffects([obj], "", "");
            alsatian_1.Expect(effect[0]).toBeDefined;
            alsatian_1.Expect(effect[0].descr_root()).toBeDefined;
        }
    }
    PassiveConfigTest() {
        let effectlist = require('../json/effectlist.json');
        for (let e in effectlist.hero_passives) {
            let obj = get_placeholder_obj(e, effectlist.hero_passives);
            let effect = Effects.parseEffects([obj], "", "");
            alsatian_1.Expect(effect[0]).toBeDefined;
            alsatian_1.Expect(effect[0].descr_root()).toBeDefined;
        }
    }
}
__decorate([
    alsatian_1.Test("Hero Effects should load with correct config")
], TestEffectConfig.prototype, "EffectConfigTest", null);
__decorate([
    alsatian_1.Test("Hero Passives should load with correct config")
], TestEffectConfig.prototype, "PassiveConfigTest", null);
exports.TestEffectConfig = TestEffectConfig;
//# sourceMappingURL=load_effects.spec.js.map