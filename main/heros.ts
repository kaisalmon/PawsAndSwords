import * as Cards from "./cards";
import * as Game from "./game"
import * as $ from 'jquery'

function sleep(seconds: number) { 
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, seconds*1000);
  });
}

export class Hero extends Game.Choosable{
    classCard: Cards.HeroComponent; 
    raceCard: Cards.HeroComponent;
    damage: number;
    party: Game.Party;
    $hero: JQuery | undefined;
    zone: Game.Zone;

    //status flags
    usedAction: boolean = false;
    justJoined: boolean = true;

    constructor(raceCard: Cards.HeroComponent, classCard: Cards.HeroComponent, zone: Game.Zone){
        super();
        this.classCard = classCard;
        this.raceCard = raceCard;
        this.damage = 0;
        this.zone = zone;
    }
    onNewTurn() : void{
        this.usedAction = false;
        this.justJoined = false;
    }

    getName() : string{
        return this.raceCard.name+" "+this.classCard.name;
    }
    getStrength() : number{
        return this.raceCard.strength + this.classCard.strength;
    }
    getArcana() : number{
        return this.raceCard.arcana + this.classCard.arcana;
    }
    getMaxHealth() : number{
        return this.raceCard.health + this.classCard.health;
    }
    getHealth() : number{
        return this.getMaxHealth() - this.damage;
    }
    getRoles() : Cards.Role[]{
        return [this.classCard.role]
    }
    getParty() : Game.Party{
        if(this.party){
            return this.party;
        }
        throw "Party requested but not defined";
    }

    getMeleeFoe(): Hero|undefined{
        return this.zone.getHero(this.party.label == 'a' ? 'b' : 'a');
    }

    canUseAction(a: Cards.ActionCard){
        if(this.justJoined || this.usedAction){
            return false;
        }
        return true;
    }
    async useAction(action: Cards.ActionCard) : Promise<{}>{
        console.log(this.getName()+" uses "+action.name);
        this.usedAction = true;
        if(this.$hero){
            this.$hero.addClass('animated tada');
            await sleep(1);
            this.$hero.removeClass('animated tada');
        }
        return await action.apply(this);
    }

    render(): JQuery {
        this.$hero = $('<div/>').addClass('hero');
        this.rerender();
        return this.$hero;
    }
    rerender(): void{
        if(!this.$hero){
            throw "Hero not rendered";
        } 
        this.$hero.empty();
        $('<div/>').addClass('hero__titlebar').text(this.getName()).appendTo(this.$hero);
        let $row = $('<div/>').addClass('hero__stats').appendTo(this.$hero);
        $('<div/>').addClass('hero__strength').appendTo($row).text(this.getStrength())
        $('<div/>').addClass('hero__arcana').appendTo($row).text(this.getArcana())
        let damaged = this.getHealth() < this.getMaxHealth();
        $('<div/>').addClass('hero__health').appendTo($row).text(this.getHealth()).addClass(damaged ? "hero__health--damaged" : "")
 
    }
    getElem() : JQuery{
        if(this.$hero){
            return this.$hero;
        }
        throw "Card is not rendered"
    }
}

export class Amount{
    string:string;
    constructor(string:string){
        this.string = string;
    }

    val(hero: Hero): number{
        var str = this.string;
        str = str.replace("A", String(hero.getArcana()));
        str = str.replace("S", String(hero.getStrength()));
        var total= 0, s= str.match(/[+\-]*(\.\d+|\d+(\.\d+)?)/g) || [];
        while(s.length){
            total+= parseInt(s.shift()||"0");
        }
        return total;
    }

    toString(): string{
        return this.string;
    }
}
