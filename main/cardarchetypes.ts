import * as Effects from "./effects";
import * as Cards from "./cards";


export abstract class CardArchetype{
    abstract checkEffects(effects:Effects.Effect[]): boolean;
    checkCard(card:Cards.ActionCard): boolean{
        return this.checkEffects(card.effects);
    }
    
    // "The hero can use any ____"
    // "When a foe uses a ____"
    // %card% is replaced with "invocation", "spell" ect. or "card"
    abstract description(): string;
}

export class PlaceholderCardArchetype extends CardArchetype{
    checkEffects(effects:Effects.Effect[]): boolean{
        throw "Placeholder being executed";
    }
    description(): string{
        //return "special %card%"
        return '<span class="placeholder placeholder--archetype">%card% matching some requirements</span>'
    }
}



export function parseCardArchetype(archetype:string){
    switch(archetype){
        case "attack":{
            return new ca_Attack();
        }
        case "non-damaging":{
            return new ca_NonDamaging();
        }
        case "placeholder":{
            return new PlaceholderCardArchetype();
        }
    }
    throw "Unknown Card Archetype "+archetype;
}

export class ca_Attack extends CardArchetype{
    checkEffects(effects:Effects.Effect[]): boolean{
        for(let e of effects){
            if(e instanceof Effects.he_Attack){
                return true;
            }
        }
        return false;
    }
    description(): string{
        return "melee attack %card%"
    }
}

export class ca_NonDamaging extends CardArchetype{
    checkEffects(effects:Effects.Effect[]): boolean{
        for(let e of effects){
            if(deepSearch(e, Effects.he_Damage.name)){
                return false;
            }
        }
        return true;
    }
    description(): string{
        return "non-damaging %card%"
    }
}


function deepSearch(effect: Effects.Effect, classString:string): boolean{
    if(effect.constructor.name == classString)return true;
    for(let child of effect.getChildEffects()){
        if(deepSearch(child, classString)){
            return true;
        }
    }
    return false;
}
