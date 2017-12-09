import * as Heros from "./heros";
import * as Game from "./game";

export abstract class Effect {
    abstract description(): string;
}
export abstract class HeroEffect extends Effect {
    abstract async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>;
    abstract isValid(user:Heros.Hero, target:Heros.Hero): boolean;
}

export abstract class HeroPassive extends Effect {}

export class EffectFailed extends Error {
     constructor() {
        super("Effect Failed");
     }
}

export function parseEffects(json: any): Effect[]{
    return json.map((json_e: any) => {
        var amount : Heros.Amount| undefined = json_e.amount ? new Heros.Amount(json_e.amount) : undefined;
        var value : number| undefined = json_e.value;
        var effects : Effect[] | undefined = json_e.effects ? parseEffects(json_e.effects) : undefined;
        switch(json_e.type){
            //Hero Effects
            case "damage":{
                if(amount)
                    return new he_Damage(amount);
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
            //Hero Passives
            case "strength":{
                return new hp_Strength(value||1);
            }
            case "action":{
                return new hp_Action(effects as HeroEffect[]);
            }
            case "on_new_turn":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_NEW_TURN ,"At the start of each turn");
            }
            case "on_attacked":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_ATTACKED ,"When %target% is attacked");
            }
            case "on_join":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_JOIN ,"When %target% enters the arena");
            }
            default:{
                throw "Unknown effect "+json_e.type;
            }
        }
    });
}

export class he_Damage extends HeroEffect{
    amount: Heros.Amount;
    
    constructor(amount: Heros.Amount){
        super();
        this.amount = amount;
    }

    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        return new Promise((resolve)=>
            {
                let val = this.amount.val(user);
                target.damage += val;
                if(target.$hero){
                    target.$hero.addClass('animated shake')
                    target.rerender();
                    setTimeout(()=>{
                        if(target.$hero){
                            target.$hero.removeClass('shake');
                        }
                        resolve();
                    },1000)
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
            (e) => e.description().replace(/%target%/, "all foes").replace(/%to target%/, "to all foes")
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
        if(foe){
            await foe.onTrigger(Game.GameEvent.ON_ATTACKED)
            
            // In case the melee target has changed
            foe = target.getMeleeFoe()
            if(!foe){
                throw new EffectFailed();
            }
            for(let e of this.effects){
                await e.apply(user, foe);
            }
            return new Promise((resolve)=>resolve());
        }
        throw new EffectFailed()
    }

    //If the target has a foe in melee range, and that foe is a valid target for the first effect
    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        var foe = target.getMeleeFoe();
        if(!foe){
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
        let foes = target.getParty().getOpponent().heros;
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
        return target.getParty().getOpponent().heros.some((h)=>this.effects[0].isValid(user, target));
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


class hp_Strength extends HeroPassive{
    value: number;
    constructor(value: number){
        super();
        this.value = value; 
    }
    description(): string{
        return "%target% has +"+this.value+" <b>Strength</b>";
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
