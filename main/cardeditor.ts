import * as $ from 'jquery'
import * as Effects from "./effects";

function get_placeholder_text(e:string, effectlist:any):string{
    let obj:any = {"type":e};
    let fields = effectlist[e];
    console.log(fields);
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
    let descr =  Effects.parseEffects([obj],"","")[0].description();
    descr = descr.replace("%target%", "a target");
    descr = descr.replace("%to target%", "to a target");
    return descr;
}

$(document).ready(function(){
    let effectlist = require('../json/effectlist.json')
    for(let e in effectlist.hero_effects){
        $('<h3/>').addClass("title--heroEffect").text(e).appendTo('body');
        $('<div/>').html(get_placeholder_text(e, effectlist.hero_effects)).appendTo('body');

    }
    for(let e in effectlist.hero_passives){
        $('<h3/>').addClass("title--heroPassive").text(e).appendTo('body');
        $('<div/>').html(get_placeholder_text(e, effectlist.hero_passives)).appendTo('body');

    }

})
