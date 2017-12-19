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
const CardArchetypes = require("../main/cardarchetypes");
const Heros = require("../main/heros");
class TestCardArchetypes {
    caAttackTest() {
        let archetype = new CardArchetypes.ca_Attack();
        let failing = [];
        failing.push(new Effects.he_Heal(new Heros.Amount("3")));
        alsatian_1.Expect(archetype.checkEffects(failing)).toBe(false);
    }
    caAttackTest2() {
        let archetype = new CardArchetypes.ca_Attack();
        let failing = [];
        let attack = new Effects.he_Attack([new Effects.he_MoveRandom()]);
        failing.push(new Effects.he_AllFoes([attack]));
        alsatian_1.Expect(archetype.checkEffects(failing)).toBe(false);
    }
    caAttackTest3() {
        let archetype = new CardArchetypes.ca_Attack();
        let attack = new Effects.he_Attack([new Effects.he_MoveRandom()]);
        alsatian_1.Expect(archetype.checkEffects([attack])).toBe(true);
    }
    caNonDamagingTest() {
        let archetype = new CardArchetypes.ca_NonDamaging();
        let failing = [];
        failing.push(new Effects.he_Damage(new Heros.Amount("3")));
        alsatian_1.Expect(archetype.checkEffects(failing)).toBe(false);
    }
    caNonDamagingTest2() {
        let archetype = new CardArchetypes.ca_NonDamaging();
        let failing = [];
        let damage = new Effects.he_Damage(new Heros.Amount("3"));
        failing.push(new Effects.he_Attack([damage]));
        alsatian_1.Expect(archetype.checkEffects(failing)).toBe(false);
    }
    caNonDamagingTest3() {
        let archetype = new CardArchetypes.ca_NonDamaging();
        let passing = [];
        passing.push(new Effects.he_Move());
        alsatian_1.Expect(archetype.checkEffects(passing)).toBe(true);
    }
}
__decorate([
    alsatian_1.Test("caAttack shouldn't match something thats not an attack")
], TestCardArchetypes.prototype, "caAttackTest", null);
__decorate([
    alsatian_1.Test("caAttack shouldn't match something that only has attack as a sub-effect")
], TestCardArchetypes.prototype, "caAttackTest2", null);
__decorate([
    alsatian_1.Test("caAttack should match an attack")
], TestCardArchetypes.prototype, "caAttackTest3", null);
__decorate([
    alsatian_1.Test("caNonDamaging shouldn't match something that contains damage")
], TestCardArchetypes.prototype, "caNonDamagingTest", null);
__decorate([
    alsatian_1.Test("caNonDamaging shouldn't match something that contains damage, even as a sub-effect")
], TestCardArchetypes.prototype, "caNonDamagingTest2", null);
__decorate([
    alsatian_1.Test("caNonDamaging should match something that contains no damage")
], TestCardArchetypes.prototype, "caNonDamagingTest3", null);
exports.TestCardArchetypes = TestCardArchetypes;
//# sourceMappingURL=cardarchetype.spec.js.map