import * as Cards from "./cards";
import * as Effects from "./effects";
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
    async onTrigger(trigger: Game.GameEvent) : Promise<{}>{
        let on_events = this.getPassivesOfType(Effects.hp_OnEvent).filter((hp)=>hp.trigger == trigger);
        if(on_events.length >0){
            if(this.$hero){
                this.$hero.addClass('animated flash');
                await sleep(1);
                this.$hero.removeClass('animated flash');
            }
            for(let ov of on_events){
                for(let e of ov.effects){
                    await e.apply(this, this);
                }
            }
        }
        return new Promise((resolve)=>resolve());
    }
    async onNewTurn() : Promise<{}>{
        this.usedAction = false;
        this.justJoined = false;
        await this.onTrigger(Game.GameEvent.ON_NEW_TURN)
        return new Promise((resolve)=>resolve());
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
    getGame() : Game.Game{
        if(this.party){
            return this.party.game;
        }
        throw "Party requested but not defined";
    }

    getMeleeFoe(): Hero|undefined{
        return this.zone.getHero(this.party.label == 'a' ? 'b' : 'a');
    }

    getMoveableZones(): Game.Zone[]{
        let zones = this.getGame().zones;
        return zones.filter((z)=> (z.heroA || z.heroB) && z != this.zone )
    }
    
    getPassives(): Effects.HeroPassive[]{
       var effects: Effects.HeroPassive[] = [];
       return effects.concat(this.raceCard.effects).concat(this.classCard.effects);
    }

    getPassivesOfType<T extends Effects.HeroPassive>(t: new (...args: any[]) => T): T[] {
        let result: T[] = [];
        for (let child of this.getPassives()) {
            if (child instanceof t)
                result.push(<T>child);
            }
        return result;
    }

    canUseAction(a: Cards.ActionCard){
        if(this.justJoined || this.usedAction){
            return false;
        }
        return a.effects[0].isValid(this, this);
    }
    async useAction(action: Cards.ActionCard) : Promise<{}>{
        console.log(this.getName()+" uses "+action.name);
        this.usedAction = true;
        if(this.$hero){
            this.$hero.addClass('animated tada');
            await sleep(1);
            this.$hero.removeClass('animated tada');
        }
        try{
            return await action.apply(this);
        }catch(e){
            console.error(e)
            return new Promise((r)=>r());
        }
    }
    async moveZone(zone: Game.Zone) : Promise<{}>{
        return new Promise((resolve)=>{
            let oldZone = this.zone;
            let ally = zone.getHero(this.getParty().label)
            if(this.$hero){
                this.$hero.addClass('animated bounceOut') 
            }
            if(ally){
                if(ally.$hero){
                    ally.$hero.addClass('animated bounceOut') 
                }
            }else{
                oldZone.empty(this.getParty().label);
            }
            setTimeout(()=>{
                if(this.$hero){
                    this.$hero.removeClass('bounceOut').remove() 
                }
                if(ally){
                    console.log(ally)
                    if(ally.$hero){
                        ally.$hero.removeClass('bounceOut').remove() 
                    }
                    oldZone.addHero(this.getParty().label, ally);      
                }
                zone.addHero(this.getParty().label, this)
                resolve();
            },1000)
        })
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
