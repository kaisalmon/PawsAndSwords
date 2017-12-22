import { Expect, Test } from "alsatian";
import * as Effects from "../main/effects";

function get_placeholder_obj(e:string, effectlist:any):any{
    let obj:any = {"type":e};
    let fields = effectlist[e];
    for(let f of fields){
        if(f == "hero_effects"){
            obj["effects"] = [{"type":"placeholder_hero_effect"}]
        }
        if(f == "hero_passives"){
            obj["effects"] = [{"type":"placeholder_hero_passive"}]
        }
        if(f == "amount"){
            obj["amount"] = "X";
        }
    }
    return obj;
}

export class TestEffectConfig{
    @Test("Hero Effects should load with correct config")
    public EffectConfigTest() {
        let effectlist = require('../json/effectlist.json')
        for(let e in effectlist.hero_effects){
            let obj:any = get_placeholder_obj(e, effectlist.hero_effects);
            let effect = Effects.parseEffects([obj],"","");
            Expect(effect[0]).toBeDefined;
            Expect(effect[0].description()).toBeDefined;
        }
    }

    @Test("Hero Passives should load with correct config")
    public PassiveConfigTest() {
        let effectlist = require('../json/effectlist.json')
        for(let e in effectlist.hero_passives){
            let obj:any = get_placeholder_obj(e, effectlist.hero_passives);
            let effect = Effects.parseEffects([obj],"","");
            Expect(effect[0]).toBeDefined;
            Expect(effect[0].description()).toBeDefined;
        }
    }

}
