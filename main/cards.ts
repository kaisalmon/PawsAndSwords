import * as $ from 'jquery'
import * as Effects from "./effects";
import * as Heros from "./heros";
import * as Game from "./game";

export enum CardType {
    RACE = 'Race',
    CLASS = 'Class',
    SPELL = 'Spell',
    MANO = 'Maneuver',
    INVO = 'Invocation',
    TRICK = 'Trick',
}
export enum Role {
    WARRIOR = 'Warrior',
    MAGE = 'Mage',
    ROGUE = 'Rogue',
    PRIEST = 'Priest',
    NO_ROLE = 'none',
}


export function fitText($e: JQuery){
    $e.each((i, element:HTMLElement)=>{
        if (element.offsetHeight - 5 < element.scrollHeight){
            $(element).addClass('fit-text')
        } 
    });
}

export function parseCard(json:any) : Card{
    if(json.type == "class" || json.type == "race"){
        let type : CardType = CardType.RACE;
        if(json.type == "class"){
            type = CardType.CLASS;
        }
        let role:Role;
        switch(json.role) { 
           case 'warrior': { 
                role = Role.WARRIOR; 
                break; 
           } 
           case 'mage': { 
                role = Role.MAGE; 
                break; 
           } 
           case 'priest': { 
                role = Role.PRIEST; 
                break; 
           } 
           case 'rogue': { 
                role = Role.ROGUE; 
                break; 
           }
           case undefined: { 
                role = Role.NO_ROLE;
                break;
           }
           default: { 
              throw "Unknown role " + json.role;    
           } 
        } 
        return new HeroComponent(json.name, json.icon, type, role,
                                 json.strength, json.arcana, json.health,
                                 Effects.parseEffects(json.effects || [], json.name, json.icon) as Effects.HeroPassive[]);

    }else if(["spell", "trick", "mano", "invo"].indexOf(json.type) !== -1){
        let type: CardType|undefined = undefined;
        switch(json.type) { 
           case 'spell': { 
                type = CardType.SPELL; 
                break; 
            }
           case 'invo': { 
                type = CardType.INVO; 
                break; 
            }
           case 'mano': { 
                type = CardType.MANO; 
                break; 
           }
           case 'trick': { 
                type = CardType.TRICK; 
                break; 
           }
        }
        if(!type){
            throw "Unknown card type "+json.type;
        }
        return new ActionCard(json.name, json.icon, type, Effects.parseEffects(json.effects, json.name, json.icon) as Effects.HeroEffect[]);
    }
    throw "Unknown card type "+json.type;
}
 
export abstract class Card extends Game.Choosable{
    name: string;
    icon: string;
    type: CardType;
    $card: JQuery | undefined;

    render(): JQuery {
        if(this.$card){
            return this.$card;
        }
        this.$card = $('<div/>').addClass('card--'+this.type).addClass('card');
        $(this.$card).ready(()=>{
            if(this.$card)
                fitText(this.$card);
        });
        $('<div/>').addClass('card__titlebar').text(this.type + " - " + this.name).appendTo(this.$card);
        $('<img/>').addClass('card__icon').appendTo(this.$card).attr('src','http://kaisalmon.com/cardgame/include/loadImage.php?icon='+this.icon)
        this.addDetails();
        return this.$card;
    }
    getElem() : JQuery{
        if(this.$card){
            return this.$card;
        }
        throw "Card is not rendered"
    }

    abstract addDetails(): void;

    constructor(name:string, icon:string, type:CardType){
        super();
        this.name = name;
        this.icon = icon;
        this.type = type;
    } 
}
export class ActionCard extends Card{
    effects: Effects.HeroEffect[];
    constructor(name:string, icon:string, type:CardType, effects: Effects.HeroEffect[]){
        super(name, icon, type);
        this.effects = effects;
    }
    addDetails(): void{
        if(!this.$card)
            return

        var $card = this.$card;
        var descriptions: string[] = this.effects.map(
            (e) => {
                let descr = e.descr_root();
                return descr.charAt(0).toUpperCase() + descr.slice(1)
            }
        );
        var description = descriptions.join(". <br/>").replace(/%to target%/g,"to this hero").replace(/%target%/g,"this hero");
        $('<div/>').addClass('card__description').appendTo($card).html(description);
    }

    async apply(hero: Heros.Hero): Promise<{}>{
        for(let e of this.effects){
            await e.apply(hero, hero);
            hero.getParty().onUpdate();
        }
        return new Promise<{}>(resolve=>resolve())
    }

}
export class HeroComponent extends Card{
    role: Role;
    strength: number;
    arcana: number;
    health: number;
    effects: Effects.HeroPassive[];
    constructor(name:string, icon:string, type:CardType, role:Role, strength:number, arcana:number, health:number, effects:Effects.HeroPassive[]){
        super(name, icon, type);
        this.role = role;
        this.strength = strength;
        this.arcana = arcana;
        this.health = health;
        this.effects = effects;
    }
    addDetails(): void{
        if(!this.$card)
            return

        var $card = this.$card;
        $card.addClass('card--'+this.role);
        var $row = $('<div/>').addClass('card__stats').appendTo($card);
        $('<div/>').addClass('card__strength').appendTo($row).text(this.strength)
        $('<div/>').addClass('card__arcana').appendTo($row).text(this.arcana)
        $('<div/>').addClass('card__health').appendTo($row).text(this.health)
        var descriptions: string[] = this.effects.map(
            (e) => e.description()
        );
        var description = descriptions.join(".<br>").replace(/%to target%/g,"to this hero").replace(/%target%/g,"the "+this.name);
        description = description.charAt(0).toUpperCase() + description.slice(1);
        $('<div/>').addClass('card__description').appendTo($card).html(description);
    }
}
