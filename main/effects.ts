import * as Heros from "./heros";
import * as Game from "./game";
import * as CardArchetypes from "./cardarchetypes";
import * as Cards from "./cards";

export enum Keyword{
    ARMORED="Armored",
    INVISIBLE="Invisible",
    STAGGERED="Staggered"
}

export abstract class Effect {
    sourceIcon: string;
    sourceName: string;

    abstract descr_instruction(): string;
    abstract descr_description(): string;
    /*

    description():string{
        return "<b>!?!?!?</b>";
    }
    descr_instruction():string{
        return this.description();
    }
    descr_description():string{
        return this.description();
    }

    */
    descr_root(): string{
        return this.descr_instruction();
    }
    getChildEffects():Effect[]{
        return [];
    }
    join(strings:string[], finalSep:string = "and"){
        let last = strings.pop();
        if(!last){
            return "???";
        }else{ 
            if(strings.length == 0){
                return last;
            }
            return strings.join(", ")+" "+finalSep+" "+last;
        } 
    }
}

export class PlaceholderEffect extends Effect{
    descr: string;
    
    constructor(descr:string){
        super();
        this.descr = descr;
    }
    descr_instruction():string{
        return this.descr;
    }
    descr_description():string{
        return this.descr;
    }
    apply(target: Heros.Hero, user: Heros.Hero):any{
        throw "Placeholder being executed";
    }
    isValid(target: Heros.Hero, user: Heros.Hero):any{
        throw "Placeholder being executed";
    }
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
    abstract description(): string;
    descr_description(): string{
        return this.description();
    }
    descr_instruction(): string{
        return this.description();
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

export function parseCardType(cardType: string): Cards.CardType{
    switch(cardType){
        case "spell":{
            return Cards.CardType.SPELL; 
        }
        case "mano":{
            return Cards.CardType.MANO; 
        }
        case "invo":{
            return Cards.CardType.INVO; 
        }
        case "trick":{
            return Cards.CardType.TRICK; 
        }
    }    
    throw "Unknown Card Type "+cardType;
}

function _parseEffects(json: any, sourceName:string, sourceIcon:string): Effect[]{
    return json.map((json_e: any) => {
        var amount : Heros.Amount| undefined = json_e.amount ? new Heros.Amount(json_e.amount) : undefined;
        var effects : Effect[] | undefined = json_e.effects ? parseEffects(json_e.effects, sourceName, sourceIcon) : undefined;
        var cardType : Cards.CardType | undefined = json_e.card_type ? parseCardType(json_e.card_type) : undefined;
        var cardArchetype : CardArchetypes.CardArchetype | undefined = json_e.card_archetype ? CardArchetypes.parseCardArchetype(json_e.card_archetype) : undefined;
        switch(json_e.type){
            //Hero Effects
            case "debug":{
                return new he_Debug();
            }
            case "placeholder_hero_effect":{
                return new PlaceholderEffect('<span class="placeholder placeholder--heroEffect">do something</span> %to target%') as HeroEffect;
            }
            case "damage":{
                if(amount)
                    return new he_Damage(amount);
            }
            case "heal":{
                if(amount)
                    return new he_Heal(amount);
            }
            case "each_foe":{
                return new he_EachFoe(effects as HeroEffect[]);
            }
            case "each_ally":{
                return new he_EachAlly(effects as HeroEffect[]);
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
            case "until_moves":{
                return new he_UntilEvent(effects as HeroPassive[], Game.GameEvent.ON_MOVE ,"for as long they do not move zone");
            }
            case "once_per_turn":{
                return new he_OncePerTurn(effects as HeroEffect[]);
            }
            case "draw_action":{
                return new he_DrawCard();
            }
            case "draw_archetype":{
                return new he_DrawArchetypeCard(cardType, cardArchetype);
            }
            case "discard_archetype":{
                return new he_DiscardArchetypeCard(effects as HeroEffect[], cardType, cardArchetype);
            }

            //Hero Passives
            case "placeholder_hero_passive":{
                return new PlaceholderEffect('<span class="placeholder placeholder--heroPassive">some passive effects</span>') as HeroEffect;
            }
            case "action":{
                return new hp_Action(effects as HeroEffect[]);
            }
            case "can_use_action":{
                return new hp_CanUseAction(cardType, cardArchetype);
            }
            case "on_new_turn":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_NEW_TURN ,"at the start of each turn");
            }
            case "on_end_turn":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_TURN_END ,"at the end of each turn");
            }
            case "on_attacked":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_ATTACKED ,"when %target% is attacked");
            }
            case "on_attacks":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_ATTACKS ,"when %target% makes an attack");
            }
            case "on_join":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_JOIN ,"when %target% enters the arena");
            }
            case "on_slain":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_SLAIN ,"when %target% is slain");
            }
            case "on_move":{
                return new hp_OnEvent(effects as HeroEffect[], Game.GameEvent.ON_MOVE ,"when %target% moves zone");
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
    descr_instruction(): string{
        return "PRINT DEBUG INFO FOR %target%";
    }
    descr_description(): string{
        return "PRINTS DEBUG INFO FOR %target%";
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

    descr_description(): string{
        return "deals "+this.amount+" damage %to target%";
    }
    descr_instruction(): string{
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

    descr_instruction(): string{
        return "remove "+this.amount+" damage from %target%";
    }
    descr_description(): string{
        return "removes "+this.amount+" damage from %target%";
    }
}


export class he_EachFoe extends HeroEffect{
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

    descr_description(): string{
        let descr = this.effects.map(
            (e) => e.descr_description().replace(/%target%/, "each foe").replace(/%to target%/, "to each foe")
        ); 
        return this.join(descr,"then");
    }
    descr_instruction(): string{
        let descr = this.effects.map(
            (e) => e.descr_instruction().replace(/%target%/, "each foe").replace(/%to target%/, "to each foe")
        ); 
        return this.join(descr,"then");
    }

    getChildEffects(): Effect[]{
        return this.effects;
    }
}

export class he_EachAlly extends HeroEffect{
    effects: HeroEffect[];
    
    constructor(effects: HeroEffect[]){
        super();
        this.effects = effects;
    }

    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        let foes: Heros.Hero[] = [];
        foes = target.getParty().heros;
        for(let f of foes){
            if(f == user)
                continue
            for(let e of this.effects){
                await e.apply(user, f);
            }
        }
        return new Promise((resolve)=>resolve());
    }

    //Is valid as long as at least one foe is a valid target for the first effect
    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        return target.getParty().heros.some((h)=>this.effects[0].isValid(user, target));
    }

    descr_description(): string{
        let descr = this.effects.map(
            (e) => e.descr_description().replace(/%target%/, "each ally").replace(/%to target%/, "to each ally")
        ); 
        return this.join(descr,"then");
    }
    descr_instruction(): string{
        let descr = this.effects.map(
            (e) => e.descr_instruction().replace(/%target%/, "each ally").replace(/%to target%/, "to each ally")
        ); 
        return this.join(descr,"then");
    }
    getChildEffects(): Effect[]{
        return this.effects;
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
            if(target.$hero){
                target.$hero.addClass('animated attack');
                await Game.sleep(1);
                target.$hero.removeClass('attack');
            } 
            await foe.onTrigger(Game.GameEvent.ON_ATTACKED)
            
            // In case the melee target has changed
            foe = target.getMeleeFoe()
            if(!foe || foe.hasKeyword(Keyword.INVISIBLE)){
                throw new EffectFailed();
            }
            for(let e of this.effects){
                await e.apply(target, foe);
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

    descr_root(): string{
        let descr = this.effects.map(
            (e) => e.descr_instruction().replace(/%to target%/, "").replace(/%target%/, "target")
        );
        return '<b>Attack: </b>'+this.join(descr, "then"); 
    }
    
    descr_description(): string{
        let descr = this.effects.map(
            (e) => e.descr_description().replace(/%to target%/, "").replace(/%target%/, "target")
        );
        return '%target% makes an attack which '+this.join(descr, "then");
    }
    
    descr_instruction(): string{
        let descr = this.effects.map(
            (e) => e.descr_description().replace(/%to target%/, "").replace(/%target%/, "target")
        );
        return 'force %target% to make an attack which '+this.join(descr, "then");
    }


    getChildEffects(): Effect[]{
        return this.effects;
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

    descr_root(): string{
        let descr = this.effects.map(
            (e) => e.descr_instruction().replace(/%to target%/, "").replace(/%target%/, "target")
        );
        return '<b>Ranged Attack: </b>'+this.join(descr, "then"); 
    }
    
    descr_description(): string{
        let descr = this.effects.map(
            (e) => e.descr_description().replace(/%to target%/, "").replace(/%target%/, "target")
        );
        return '%target% makes a ranged attack which '+this.join(descr, "then");
    }
    
    descr_instruction(): string{
        let descr = this.effects.map(
            (e) => e.descr_description().replace(/%to target%/, "").replace(/%target%/, "target")
        );
        return 'force the %target% to make a ranged attack which '+this.join(descr, "then");
    }

    getChildEffects(): Effect[]{
        return this.effects;
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
    descr_description(): string{
        return "%target% moves zone";
    }
    descr_instruction(): string{
        return "forces %target% to move zone";
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
    descr_description(): string{
        return "%target% moves to a random zone";
    }
    descr_instruction(): string{
        return "force %target% to move to a random zone";
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
    descr_description(): string{
        return 'gives %target% '+ this.join(this.effects.map((e)=>e.description()))+" "+this.description_text; 
    }
    descr_instruction(): string{
        /*
         * Should this be "the target has"
         */
        return 'give %target% <i>"'+ this.join(this.effects.map((e)=>e.description()))+'"</i> '+this.description_text; 
    }
    getChildEffects(): Effect[]{
        return this.effects;
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

    descr_instruction(): string{
        return this.effects.map(
            (e) => e.descr_instruction()
        ).join(", ")+' <i> (Max once per turn)</i>'; 
    }
    descr_description(): string{
        return this.effects.map(
            (e) => e.descr_description()
        ).join(", ")+' <i> (Max once per turn)</i>'; 
    }
    getChildEffects(): Effect[]{
        return this.effects;
    }
}

export class he_DrawCard extends HeroEffect{
    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        try{
            target.party.drawCard();
            return new Promise<{}>(resolve=>resolve());
        }catch(e){
            throw new EffectFailed();
        }
    }

    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        return true;
    }
    descr_instruction(): string{
        return "%target%'s party draws a card";
    }
    descr_description(): string{
        return "allows %target%'s party to draw a card";
    }
}

export class he_DrawArchetypeCard extends HeroEffect{
    cardType: Cards.CardType|undefined;
    cardArchetype: CardArchetypes.CardArchetype|undefined;

    constructor(cardType: Cards.CardType|undefined, cardArchetype:CardArchetypes.CardArchetype|undefined){
        super();
        this.cardType = cardType;
        this.cardArchetype = cardArchetype;
    }

    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        try{
            let deck = target.party.deck;
            let f_deck = deck.filter((c)=>{
                return (this.cardArchetype == undefined || this.cardArchetype.checkCard(c as Cards.ActionCard))
                    && (this.cardType == undefined || c.type == this.cardType)
            });
            
            console.log(f_deck)
            //TODO: Do not rely on the deck being shuffled
            let c = f_deck.pop();
            if(c){
                target.party.hand.push(c);
                target.party.onUpdate();
            }
            return new Promise<{}>(resolve=>resolve());
        }catch(e){
            throw new EffectFailed();
        }
    }

    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        return true;
    }

    descr_instruction(): string{
        let card_string = "card";
        if(this.cardType){
            card_string = this.cardType;
        }
        if(this.cardArchetype){
            return "%target%'s party draws a random "+this.cardArchetype.description().replace("%card%", card_string)+" from their deck";
        }
        return "%target%'s party draws a random "+ card_string+" from their deck";
    }

    descr_description(): string{
        let card_string = "card";
        if(this.cardType){
            card_string = this.cardType;
        }
        if(this.cardArchetype){
            return "allows %target%'s party to draw a random "+this.cardArchetype.description().replace("%card%", card_string)+" from their deck";
        }
        return "allows %target%'s party to draw a random "+ card_string+" from their deck";
    }

}

export class he_DiscardArchetypeCard extends HeroEffect{
    effects: HeroEffect[];
    cardType: Cards.CardType|undefined;
    cardArchetype: CardArchetypes.CardArchetype|undefined;

    constructor(effects: HeroEffect[], cardType: Cards.CardType|undefined, cardArchetype:CardArchetypes.CardArchetype|undefined){
        super();
        this.effects = effects;
        this.cardType = cardType;
        this.cardArchetype = cardArchetype;
    }

    async apply(user:Heros.Hero, target:Heros.Hero): Promise<{}>{
        try{
            let hand = user.party.hand;
            let f_hand = hand.filter((c)=>{
                return (this.cardArchetype == undefined || this.cardArchetype.checkCard(c as Cards.ActionCard))
                    && (this.cardType == undefined || c.type == this.cardType)
            });
            
            //TODO: Do not rely on the deck being shuffled
            let c = f_hand[0]
            if(f_hand.length != 1){
                c = await user.party.makeChoice(f_hand);
            }

            if(c){
                if(c.$card)
                    c.$card.addClass("selected");
                await Game.sleep(1)
                user.party.discard(c);
                target.party.onUpdate();
                for(let e of this.effects){
                    e.apply(user, target);
                }
                target.party.onUpdate();
            }else{
                throw new EffectFailed();
            }
            return new Promise<{}>(resolve=>resolve());
        }catch(e){
            throw new EffectFailed();
        }
    }

    //Is valid if a card which matches the archetype is in the party's hand
    isValid(user:Heros.Hero, target:Heros.Hero): boolean{
        let hand = user.party.hand;
        let f_hand = hand.filter((c)=>{
            return (this.cardArchetype == undefined || this.cardArchetype.checkCard(c as Cards.ActionCard))
                && (this.cardType == undefined || c.type == this.cardType)
        });
        return f_hand.length > 0;
    }
    
    descr_instruction(): string{
        let card_string = "card";
        if(this.cardType){
            card_string = this.cardType;
        }

        if(this.cardArchetype){
            return "discard a "+this.cardArchetype.description().replace("%card%", card_string)+": " + this.join(this.effects.map((e)=>e.descr_instruction()));
        } 
        return "discard a "+ card_string+": "+ this.join(this.effects.map((e)=>e.descr_instruction()));
    }

    descr_description(): string{
        let card_string = "card";
        if(this.cardType){
            card_string = this.cardType;
        }

        if(this.cardArchetype){
            return "forces you to discard a "+this.cardArchetype.description().replace("%card%", card_string)+" in order to " + this.join(this.effects.map((e)=>e.descr_instruction()));
        } 
        return "forces you to discard a "+ card_string+" in order to "+ this.join(this.effects.map((e)=>e.descr_instruction()));
    }
}


export class hp_Action extends HeroPassive{
    effects: HeroEffect[];
    constructor(effects: HeroEffect[]){
        super();
        this.effects = effects; 
    }
    description(): string{
        return "<b>Action:</b> "+this.join(this.effects.map((e)=>e.descr_instruction())); 
    }
    getChildEffects(): Effect[]{
        return this.effects;
    }
}
export class hp_CanUseAction extends HeroPassive{
    cardType: Cards.CardType|undefined;
    cardArchetype: CardArchetypes.CardArchetype|undefined;
    constructor(cardType: Cards.CardType|undefined, cardArchetype:CardArchetypes.CardArchetype|undefined){
        super();
        this.cardType = cardType;
        this.cardArchetype = cardArchetype;
    }

    description(): string{
        let card_string = "card";
        if(this.cardType){
            card_string = this.cardType;
        }

        if(this.cardArchetype){
            return "%target% can use any "+this.cardArchetype.description().replace("%card%", card_string);
        }
        return "%target% can use any "+ card_string;

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
        return this.description_text +' '+ this.join(this.effects.map((e)=>e.descr_instruction())); 
    }
    getChildEffects(): Effect[]{
        return this.effects;
    }
}

export class hp_AllAlliesHave extends HeroPassive{
    effects: HeroPassive[];
    
    constructor(effects: HeroPassive[]){
        super();
        this.effects = effects;
    }

    description(): string{
        return "all allies have <i>\""+this.effects.map(
            (e) => e.description().replace(/%to target%/, "")
        ).join(",")+"\"</i>"; 
    }
    getChildEffects(): Effect[]{
        return this.effects;
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
             return first_effect.description_text +' '+this.description_text+' '+ this.join(grandchildren_effects.map((e)=>e.descr_instruction())); 
        }else{
            return this.effects.map((e)=>e.description()).join(", ")+" "+this.description_text; 
        }
    }
    getChildEffects(): Effect[]{
        return this.effects;
    }
}
