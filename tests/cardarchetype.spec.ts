import { Expect, Test } from "alsatian";
import * as Effects from "../main/effects";
import * as CardArchetypes from "../main/cardarchetypes";
import * as Heros from "../main/heros";

export class TestCardArchetypes{

    @Test("caAttack shouldn't match something thats not an attack")
    public caAttackTest() {
        let archetype: CardArchetypes.CardArchetype = new CardArchetypes.ca_Attack();
        let failing: Effects.Effect[] = [];
        failing.push(new Effects.he_Heal( new Heros.Amount("3")));
        Expect(archetype.checkEffects(failing)).toBe(false);
    }

    @Test("caAttack shouldn't match something that only has attack as a sub-effect")
    public caAttackTest2() {
        let archetype: CardArchetypes.CardArchetype = new CardArchetypes.ca_Attack();
        let failing: Effects.Effect[] = [];
        let attack: Effects.HeroEffect = new Effects.he_Attack([new Effects.he_MoveRandom()]);

        failing.push(new Effects.he_AllFoes([attack]));
        Expect(archetype.checkEffects(failing)).toBe(false);
    }

    @Test("caAttack should match an attack")
    public caAttackTest3() {
        let archetype: CardArchetypes.CardArchetype = new CardArchetypes.ca_Attack();
        let attack: Effects.HeroEffect = new Effects.he_Attack([new Effects.he_MoveRandom()]);

        Expect(archetype.checkEffects([attack])).toBe(true);
    }


    @Test("caNonDamaging shouldn't match something that contains damage")
    public caNonDamagingTest() {
        let archetype: CardArchetypes.CardArchetype = new CardArchetypes.ca_NonDamaging();
        let failing: Effects.Effect[] = [];
        failing.push(new Effects.he_Damage( new Heros.Amount("3")));
        Expect(archetype.checkEffects(failing)).toBe(false);
    }

    @Test("caNonDamaging shouldn't match something that contains damage, even as a sub-effect")
    public caNonDamagingTest2() {
        let archetype: CardArchetypes.CardArchetype = new CardArchetypes.ca_NonDamaging();
        let failing: Effects.Effect[] = [];
        let damage = new Effects.he_Damage( new Heros.Amount("3"));

        failing.push(new Effects.he_Attack([damage]));
        Expect(archetype.checkEffects(failing)).toBe(false);
    }

    @Test("caNonDamaging should match something that contains no damage")
    public caNonDamagingTest3() {
        let archetype: CardArchetypes.CardArchetype = new CardArchetypes.ca_NonDamaging();
        let passing: Effects.Effect[] = [];
        passing.push(new Effects.he_Move());
        Expect(archetype.checkEffects(passing)).toBe(true);
    }
}
