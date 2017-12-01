import * as Hero from "./hero";

export abstract class Effect {
    abstract description(): string;
}
export abstract class HeroEffect extends Effect {
    abstract async apply(user:Hero.Hero, target:Hero.Hero): Promise<{}>;
}

export function parseEffects(json: any): Effect[]{
    return json.map((json_e: any) => {
        var amount : Hero.Amount| undefined = json_e.amount ? new Hero.Amount(json_e.amount) : undefined;
        var effects : Effect[] | undefined = json_e.effects ? parseEffects(json_e.effects) : undefined;
        switch(json_e.type){
            case "damage":{
                if(amount)
                    return new he_Damage(amount);
            }
            case "all_foes":{
                return new he_AllFoes(effects as HeroEffect[]);
            }
            default:{
                throw "Unknown effect "+json_e.type;
            }
        }
    });
}

export class he_Damage extends HeroEffect{
    amount: Hero.Amount;
    
    constructor(amount: Hero.Amount){
        super();
        this.amount = amount;
    }

    async apply(user:Hero.Hero, target:Hero.Hero): Promise<{}>{
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
        return "deal "+this.amount+" damage to %to target%";
    }
}

export class he_AllFoes extends HeroEffect{
    effects: HeroEffect[];
    
    constructor(effects: HeroEffect[]){
        super();
        this.effects = effects;
    }

    async apply(user:Hero.Hero, target:Hero.Hero): Promise<{}>{
        let foes: Hero.Hero[] = [];
        foes = user.getParty().getOpponent().heros;
        for(let f of foes){
            for(let e of this.effects){
                await e.apply(user, f);
            }
        }
        return new Promise((resolve)=>resolve());
    }

    description(): string{
        return this.effects.map(
            (e) => e.description().replace(/%target%/, "all foes")
        ).join(","); 
    }
}
