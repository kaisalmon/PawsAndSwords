import * as $ from 'jquery'
import * as Effects from "./effects";
import * as Hero from "./hero";
import * as Game from "./game";

export enum CardType {
    RACE = 'Race',
    CLASS = 'Class',
    SPELL = 'Spell',
}
export enum Role {
    WARRIOR = 'Warrior',
    MAGE = 'mage',
    NO_ROLE = 'none',
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
           case undefined: { 
                role = Role.NO_ROLE;
                break;
           }
           default: { 
              throw "Unknown role " + json.role;    
           } 
        } 
        return new HeroComponent(json.name, json.icon, type, role,
                                 json.strength, json.arcana, json.health);
    }else if(json.type == "spell"){
        return new ActionCard(json.name, json.icon, CardType.SPELL, Effects.parseEffects(json.effects) as Effects.HeroEffect[]);

    }else{
        throw "Unknown card type "+json.type;
    }
}

export class Card extends Game.Choosable{
    name: string;
    icon: string;
    type: CardType;
    $card: JQuery | undefined;

    render(): JQuery {
        this.$card = $('<div/>').addClass('card--'+this.type).addClass('card');
        $('<div/>').addClass('card__titlebar').text(this.type + " - " + this.name).appendTo(this.$card);
        //$('<img/>').addClass('card__icon').appendTo($card).attr('src','http://kaisalmon.com/cardgame/include/loadImage.php?icon='+this.icon)
        return this.$card;
    }
    getElem() : JQuery{
        if(this.$card){
            return this.$card;
        }
        throw "Card is not rendered"
    }
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
    render(): JQuery{
        var $card = super.render();
        var descriptions: string[] = this.effects.map(
            (e) => e.description()
        );
        var description = descriptions.join(", ").replace(/%target%/g,"this hero");
        description = description.charAt(0).toUpperCase() + description.slice(1);
        $('<div/>').addClass('card__description').appendTo($card).text(description);
        return $card;
    }

    async apply(hero: Hero.Hero): Promise<{}>{
        for(let e of this.effects){
            await e.apply(hero, hero);
        }
        return new Promise((resolve)=>resolve());
    }

}
export class HeroComponent extends Card{
    role: Role;
    strength: number;
    arcana: number;
    health: number;
    constructor(name:string, icon:string, type:CardType, role:Role, strength:number, arcana:number, health:number){
        super(name, icon, type);
        this.role = role;
        this.strength = strength;
        this.arcana = arcana;
        this.health = health;
    }
    render(): JQuery{
        var $card = super.render();
        var $row = $('<div/>').addClass('card__stats').appendTo($card);
        $('<div/>').addClass('card__strength').appendTo($row).text(this.strength)
        $('<div/>').addClass('card__arcana').appendTo($row).text(this.arcana)
        $('<div/>').addClass('card__health').appendTo($row).text(this.health)
        return $card;
    }
}