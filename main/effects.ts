import * as Heros from "./heros";
import * as Game from "./game";

export enum Keyword{
    ARMORED="Armored",
    INVISIBLE="Invisible",
    STAGGERED="Staggered"
}

export abstract class Effect {
    sourceIcon: string;
    sourceName: string;
    abstract description(): string;
}
export abstract class HeroEffect extends Effect {
    abstract async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>;
    abstract isValid(user:Heros.Hero, target:Heros.Hero): boolean;
}

export abstract class HeroPassive extends Effect {
    //this is used to allow conditional passives to expose their children instead of themselves
    getActivePassives(h: Heros.Hero): HeroPassive[]{
        return [this];
    } 
}

export class EffectFailed extends Error {
     constructor() {
        super("Effect Failed");
     }
}

export function parseEffects(json: any, sourceName:string, sourceIcon:string): Effect[]{
    var effects: Effect[] = _parseEffects(json, sourceName, sourceIcon);
    for(let e of effects){
        e.sourceName = sourceName;
        e.sourceIcon = sourceIcon;
    }
    return effects;
}

function _parseEffects(json: any, sourceName:string, sourceIcon:string): Effect[]{
    return json.map((json_e: any) => {
        var amount : Heros.Amount| undefined = json_e.amount ? new Heros.Amount(json_e.amount) : undefined;
        var effects : Effect[] | undefined = json_e.effects ? parseEffects(json_e.effects, sourceName, sourceIcon) : undefined;
        switch(json_e.type){
            //Hero Effects
            case "debug":{
                return new he_Debug();
            }
            case "damage":{
                if(amount)
                    return new he_Damage(amount);
            }
            case "heal":{
                if(amount)
                    return new he_Heal(amount);
            }
            case "all_foes":{
                return new he_AllFoes(effects as HeroEffect[]);
            }
            case "attack":{
                return new he_Attack(effects as HeroEffect[]);
            }
            case "ranged_attack":{
                return new he_RangedAttack(effects as HeroEffect[]);
            }
            case "move":{
                return new he_Move();
            }
            case "move_random":{
                return new he_MoveRandom();
            }
            case "until_new_turn":{
                return new he_UntilEvent(effects as HeroPassive[], Game.GameEvent.ON_NEW_TURN ,"until the start of their next turn");
            }
            case "until_turn_ends":{
                return new he_UntilEvent(effects as HeroPassive[], Game.GameEvent.ON_TURN_END ,"until the end of their turn");
            }
            case "until_attacked":{
                return new he_UntilEvent(effects as HeroPassive[], Game.GameEvent.ON_ATTACKED ,"until the next time they are attacked");
            }
            case "until_attacks":{
                return new he_UntilEvent(effects as HeroPassive[], Game.GameEvent.ON_ATTACKS ,"until after their next attack");
            }
            case "once_per_turn":{
                return new he_OncePerTurn(effects as HeroEffect[]);
            }

            //Hero Passives
            case "action":{
                return new hp_Action(effects as HeroEffect[]);
            }
            case "on_new_turn":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_NEW_TURN ,"At the start of each turn");
            }
            case "on_end_turn":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_TURN_END ,"At the end of each turn");
            }
            case "on_attacked":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_ATTACKED ,"When %target% is attacked");
            }
            case "on_attacks":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_ATTACKS ,"When %target% makes an attack");
            }
            case "on_join":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_JOIN ,"When %target% enters the arena");
            }
            case "on_slain":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_SLAIN ,"When %target% is slain");
            }
            case "all_allies_have":{
                return new hp_AllAlliesHave(effects as HeroPassive[]);
            }
            case "armored":{
                return new hp_Keyword(Keyword.ARMORED);
            }
            case "invisible":{
                return new hp_Keyword(Keyword.INVISIBLE);
            }
            case "staggered":{
                return new hp_Keyword(Keyword.STAGGERED);
            }
            case "while_damaged":{
                return new hp_WhileCond(effects as HeroPassive[], (h)=>h.damage > 0, "while damaged");
            }
            case "while_alone":{
                return new hp_WhileCond(effects as HeroPassive[], (h)=>h.getParty().heros.length == 1, "while alone");
            }
            default:{
                throw "Unknown effect "+json_e.type;
            }
        }
    });
}
export class he_Debug extends HeroEffect{
    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        alert("Debug!")
        console.warn(this, user, target);
        return new Promise<{}>(resolve=>setTimeout(()=>resolve(), 1000));
    }

    //is valid if the hero can move
    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        return true;
    }
    description(): string{
        return "PRINT DEBUG INFO FOR %target%";
    }
}
export class he_Damage extends HeroEffect{
    amount: Heros.Amount;
    
    constructor(amount: Heros.Amount){
        super();
        this.amount = amount;
    }

    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        return new Promise(async (resolve)=>
            {
                let val = this.amount.val(user);
                if(target.hasKeyword(Keyword.ARMORED)){
                    val-=1;
                }
                if(val > 0){
                    target.damage += val;
                    if(target.$hero){
                        target.$hero.addClass('animated shake')
                        target.rerender();
                        if(target.getHealth() <= 0){
                            await target.slay();
                        }  
                        setTimeout(()=>{
                            if(target.$hero){
                                target.$hero.removeClass('shake');
                            }
                            resolve();
                        },1000)
                    }else{
                        resolve();     
                    }
                }else{
                    resolve();     
                }
            })
    }

    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        return true;      
    }

    description(): string{
        return "deal "+this.amount+" damage %to target%";
    }
}

export class he_Heal extends HeroEffect{
    amount: Heros.Amount;
    
    constructor(amount: Heros.Amount){
        super();
        this.amount = amount;
    }

    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        return new Promise(async (resolve)=>
            {
                let val = this.amount.val(user);
                if(val > 0){
                    target.damage -= val;
                    if(target.damage < 0){
                        target.damage = 0;
                    }
                    if(target.$hero){
                        target.$hero.addClass('animated rubberBand')
                        target.rerender();
                        setTimeout(()=>{
                            if(target.$hero){
                                    target.$hero.removeClass('rubberBand');
                            }
                            resolve();
                        },1000)
                    }else{
                        resolve();     
                    }
                }else{
                    resolve();     
                }
            })
    }

    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        return target.damage != 0;      
    }

    description(): string{
        return "remove "+this.amount+" damage from %target%";
    }
}


class he_AllFoes extends HeroEffect{
    effects: HeroEffect[];
    
    constructor(effects: HeroEffect[]){
        super();
        this.effects = effects;
    }

    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        let foes: Heros.Hero[] = [];
        foes = target.getParty().getOpponent().heros;
        for(let f of foes){
            for(let e of this.effects){
                await e.apply(user, f);
            }
        }
        return new Promise((resolve)=>resolve());
    }

    //Is valid as long as at least one foe is a valid target for the first effect
    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        return target.getParty().getOpponent().heros.some((h)=>this.effects[0].isValid(user, target));
    }

    description(): string{
        return this.effects.map(
            (e) => e.description().replace(/%target%/, "each foe").replace(/%to target%/, "to all foe")
        ).join(","); 
    }
}

export class he_Attack extends HeroEffect{
    effects: HeroEffect[];
    
    constructor(effects: HeroEffect[]){
        super();
        this.effects = effects;
    }

    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        let foe = target.getMeleeFoe()
        if(foe && !foe.hasKeyword(Keyword.INVISIBLE)){
            await foe.onTrigger(Game.GameEvent.ON_ATTACKED)
            
            // In case the melee target has changed
            foe = target.getMeleeFoe()
            if(!foe || foe.hasKeyword(Keyword.INVISIBLE)){
                throw new EffectFailed();
            }
            for(let e of this.effects){
                await e.apply(user, foe);
            }
            await target.onTrigger(Game.GameEvent.ON_ATTACKS)
            return new Promise((resolve)=>resolve());
        }
        throw new EffectFailed()
    }

    //If the target has a foe in melee range, and that foe is a valid target for the first effect
    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        var foe = target.getMeleeFoe();
        if(!foe || foe.hasKeyword(Keyword.INVISIBLE)){
            return false
        }
        return this.effects[0].isValid(user, foe);
    }

    description(): string{
        return this.effects.map(
            (e) => '<b>Attack: </b>'+e.description().replace(/%to target%/, "")
        ).join(","); 
    }
}

class he_RangedAttack extends HeroEffect{
    effects: HeroEffect[];
    
    constructor(effects: HeroEffect[]){
        super();
        this.effects = effects;
    }

    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        let foes = target.getParty().getOpponent().heros.filter((f)=>!f.hasKeyword(Keyword.INVISIBLE));
        let foe = await target.getParty().makeChoice(foes, '--red'); 
        if(foe){
            for(let e of this.effects){
                await e.apply(user, foe);
            }
            return new Promise((resolve)=>resolve());
        }
        throw new EffectFailed()
    }

    //Is valid as long as at least one foe is a valid target for the first effect
    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        return target.getParty().getOpponent().heros
            .filter((f)=>!f.hasKeyword(Keyword.INVISIBLE)) 
            .some((h)=>this.effects[0].isValid(user, target));
    }

    description(): string{
        return this.effects.map(
            (e) => '<b>Ranged Attack: </b>'+e.description().replace(/%to target%/, "")
        ).join(","); 
    }
}

export class he_Move extends HeroEffect{
    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        try{
            let zone = await target.getParty().makeChoice(target.getMoveableZones());
            await target.moveZone(zone);
            return new Promise<{}>(resolve=>resolve());
        }catch(e){
            throw new EffectFailed();
        }
    }

    //is valid if the hero can move
    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        return target.getMoveableZones().length > 0;
    }
    description(): string{
        return "%target% moves zone";
    }
}
export class he_MoveRandom extends HeroEffect{
    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        try{
            let zone = await target.getGame().randomChoice(target.getMoveableZones());
            await target.moveZone(zone);
            return new Promise<{}>(resolve=>resolve());
        }catch(e){
            throw new EffectFailed();
        }
    }

    //is valid if the hero can move
    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        return target.getMoveableZones().length > 0;
    }
    description(): string{
        return "%target% moves to a random zone";
    }
}
export class he_UntilEvent extends HeroEffect{
    effects: HeroPassive[];
    trigger: Game.GameEvent;
    description_text: string;
    constructor(effects: HeroPassive[], trigger: Game.GameEvent, description:string){
        super();
        this.effects = effects; 
        this.trigger = trigger;
        this.description_text = description;
    }
    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        target.addTempPassive(new Heros.TempPassive(this.effects, this.trigger)) 
        return new Promise<{}>(resolve=>resolve());
    }

    //is valid if the hero can move
    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        return true;
    }
    description(): string{
        return '%target% has '+ this.effects.map((e)=>e.description()).join(", ")+" "+this.description_text; 
    }
}

export class he_OncePerTurn extends HeroEffect{
    effects: HeroEffect[];
    
    constructor(effects: HeroEffect[]){
        super();
        this.effects = effects;
    }

    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        if(user.turnDisabledEffects.indexOf(this) == -1){ 
            user.turnDisabledEffects.push(this); 
            
            for(let e of this.effects){
                await e.apply(user, target);
            }
        }
        return new Promise((resolve)=>resolve());
    }

    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        return this.effects[0].isValid(user, target) && user.turnDisabledEffects.indexOf(this) == -1;
    }

    description(): string{
        return this.effects.map(
            (e) => e.description()
        ).join(", ")+'<i>(Max once per turn)</i>'; 
    }
}

export class hp_Action extends HeroPassive{
    effects: HeroEffect[];
    constructor(effects: HeroEffect[]){
        super();
        this.effects = effects; 
    }
    description(): string{
        return "<b>Action:</b> "+this.effects.map((e)=>e.description()).join(", "); 
    }
}

export class hp_OnEvent extends HeroPassive{
    effects: HeroEffect[];
    trigger: Game.GameEvent;
    description_text: string;
    constructor(effects: HeroEffect[], trigger: Game.GameEvent, description:string){
        super();
        this.effects = effects; 
        this.trigger = trigger;
        this.description_text = description;
    }
    description(): string{
        return this.description_text +' '+ this.effects.map((e)=>e.description()).join(", "); 
    }
}

export class hp_AllAlliesHave extends HeroPassive{
    effects: HeroPassive[];
    
    constructor(effects: HeroPassive[]){
        super();
        this.effects = effects;
    }

    description(): string{
        return "All allies have <i>\""+this.effects.map(
            (e) => e.description().replace(/%to target%/, "")
        ).join(",")+"\"</i>"; 
    }
}


export class hp_Keyword extends HeroPassive{
    keyword: Keyword;
    constructor(keyword: Keyword){
        super();
        this.keyword = keyword;
    }

    description(): string{
        return "<b>"+this.keyword.toString().toLowerCase()+"</b>";
    }
}
export class hp_WhileCond extends HeroPassive{
    effects: HeroPassive[];
    cond: (h: Heros.Hero)=>boolean;
    description_text: string;

    constructor(effects: HeroPassive[], cond: (h: Heros.Hero)=>boolean, text: string){
        super();
        this.effects = effects;
        this.cond = cond;
        this.description_text = text;
    }
    
    getActivePassives(h: Heros.Hero): HeroPassive[]{
        if(this.cond(h)){
            return this.effects;
        }else{
            return [];
        }
    }
    
    description(): string{
        let first_effect = this.effects[0];
        //Improved grammar for when the only effect is an onEvent 
        if(this.effects.length == 1 && first_effect instanceof hp_OnEvent){
             var grandchildren_effects = first_effect.effects;
             return first_effect.description_text +' '+this.description_text+' '+ grandchildren_effects.map((e)=>e.description()).join(", "); 
        }else{
            return this.effects.map((e)=>e.description()).join(", ")+" "+this.description_text; 
        }
    }
}
