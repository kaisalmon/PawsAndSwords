import * as Heros from "./heros";

export abstract class Effect {
    abstract description(): string;
}
export abstract class HeroEffect extends Effect {
    abstract async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>;
}

class EffectFailed extends Error {
     constructor() {
        super("Effect Failed");
     }
}

export function parseEffects(json: any): Effect[]{
    return json.map((json_e: any) => {
        var amount : Heros.Amount| undefined = json_e.amount ? new Heros.Amount(json_e.amount) : undefined;
        var effects : Effect[] | undefined = json_e.effects ? parseEffects(json_e.effects) : undefined;
        switch(json_e.type){
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

    description(): string{
        return "deal "+this.amount+" damage %to target%";
    }
}

export class he_AllFoes extends HeroEffect{
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
            for(let e of this.effects){
                await e.apply(user, foe);
            }
            return new Promise((resolve)=>resolve());
        }
        throw new EffectFailed()
    }

    description(): string{
        return this.effects.map(
            (e) => '<b>Attack: </b>'+e.description().replace(/%to target%/, "")
        ).join(","); 
    }
}

export class he_RangedAttack extends HeroEffect{
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

    description(): string{
        return this.effects.map(
            (e) => '<b>Ranged Attack: </b>'+e.description().replace(/%to target%/, "")
        ).join(","); 
    }
}

export class he_Move extends HeroEffect{
    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        return new Promise(async (resolve, reject)=>{
            try{
                let zone = await target.getParty().makeChoice(target.getMoveableZones());
                await target.moveZone(zone);
                resolve();
            }catch(e){
                throw new EffectFailed();
            }
        })
    }

    description(): string{
        return "%target% moves zone";
    }
}


