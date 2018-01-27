import * as $ from 'jquery'
import * as Effects from "./effects";
import * as CardArchetypes from "./cardarchetypes";

function get_placeholder_text(e:string, effectlist:any):string{
    let obj:any = {"type":e};
    let fields = effectlist[e];
    for(let f of fields){
        if(f == "hero_effects"){
            obj["effects"] = [{"type":"placeholder_hero_effect"}]
        }
        if(f == "hero_passives"){
            obj["effects"] = [{"type":"placeholder_hero_passive"}]
        }
        if(f == "card_archetype"){
            obj["card_archetype"] = "placeholder" 
        }
        if(f == "amount"){
            obj["amount"] = "X";
        }
    }
    let descr =  Effects.parseEffects([obj],"","")[0].descr_root();
    descr = descr.replace("%target%", "a target");
    descr = descr.replace("%to target%", "to a target");
    return descr;
}

function random_effects(effectlist: any, catagory:"hero_effects"|"hero_passives"):any{
    let r = Math.random();
    if(r < 0.9)
        return [random_effect(effectlist, catagory)]
    else 
        return [random_effect(effectlist, catagory), random_effect(effectlist, catagory)]
}
function random_effect(effectlist: any, catagory:"hero_effects"|"hero_passives"):any{
    let heroeffects = effectlist[catagory];
    let keys = Object.keys(heroeffects);
    let type = keys[Math.floor(keys.length * Math.random())];
    let fields = heroeffects[type];

    let result:any = {type};
    
    if(fields.indexOf("hero_effects") != -1){
        result.effects = random_effects(effectlist, "hero_effects"); 
    }else if(fields.indexOf("hero_passives") != -1){
        result.effects = random_effects(effectlist, "hero_passives"); 
    }

    if(fields.indexOf("amount") != -1){
        result.amount = ""+(Math.floor(Math.random()*4)+1);
    }
    if(fields.indexOf("card_archetype") != -1){
        if(Math.random() > 0.25)
            result.card_archetype = effectlist.card_archetypes[Math.floor(Math.random()*effectlist.card_archetypes.length)]
    }
    if(fields.indexOf("card_type") != -1){
        if(Math.random() > 0.33)
            result.card_type = effectlist.card_types[Math.floor(Math.random()*effectlist.card_types.length)]
    }

    return result;
}

$(document).ready(function(){
    let effectlist = require('../json/effectlist.json')
    for(let e in effectlist.hero_effects){
        let $e = $("<div/>").addClass('entry').appendTo('body');
        $('<h3/>').addClass("title--heroEffect").text(e).appendTo($e);
        $('<div/>').html(get_placeholder_text(e, effectlist.hero_effects)).appendTo($e);

    }
    for(let e in effectlist.hero_passives){
        let $e = $("<div/>").addClass('entry').appendTo('body');
        $('<h3/>').addClass("title--heroPassive").text(e).appendTo($e);
        $('<div/>').html(get_placeholder_text(e, effectlist.hero_passives)).appendTo($e);
    }
    for(let ca of effectlist.card_archetypes){
        let $ca = $("<div/>").addClass('entry').appendTo('body');
        $('<h3/>').addClass("title--archetype").text(ca).appendTo($ca);
        let description = CardArchetypes.parseCardArchetype(ca).description();
        description = description.replace("%card%",'<span class="placeholder--type">action / spell / trick / invocation / manoeuvre</span>')
        $('<div/>').html(description).appendTo($ca);
    }

    for(let i = 0; i < 10; i++){
        let json = random_effects(effectlist, i%2==0 ? "hero_effects":"hero_passives")
        let e = Effects.parseEffects(json,"","")
        $('body').append(e[0].descr_root().replace(/%target%/g,"the hero").replace(/%to target%/g, "to the hero"));
        $('body').append("<br>")
        $('body').append("<br>")
    }
})
