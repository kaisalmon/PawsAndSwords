import * as Hero from "./hero";
import * as Cards from "./cards";
import * as $ from "jquery";

export abstract class Choosable{
    abstract getElem(): JQuery; 
    highlight() : void{
        this.getElem().addClass('choosable');
        this.getElem().addClass('choosable--highlighted');
    }
    unhighlight() : void{
        this.getElem().addClass('choosable');
        this.getElem().removeClass('choosable--highlighted');
    }
}

/*class ChoosableCancelled extends Error {
     constructor() {
        super("Choice Cancelled");
     }
}*/
class ChoiceFailed extends Error {
     constructor() {
        super("Choice Failed");
     }
}


export abstract class Party{
    opponent: Party|null = null;
    deck: Cards.Card[] = [];
    hand: Cards.Card[] = [];
    heros: Hero.Hero[] = [];
    game: Game;

    playedHero: boolean = false;

    onUpdate: ()=>void;
   
    constructor(game: Game, deck:Cards.Card[]){
        this.game = game;
        this.deck = deck;
        this.hand = deck.slice();
        this.onUpdate = ()=>{};
    }
    addHero(hero: Hero.Hero){
        this.playedHero = true;
        this.heros.push(hero);
        hero.party = this;

        this.onUpdate();
    }
    getOpponent() : Party{
        if(this.opponent){
            return this.opponent;
        }
        throw "Opponent requested but not defined";
    }
    getPossibleActions() : Choosable[]{
        let r : Choosable[] = [];
        if(!this.playedHero && this.hand.some((c)=>c.type == Cards.CardType.CLASS)){
            r = r.concat(this.hand.filter((c)=>c.type == Cards.CardType.RACE));
        }
        if(this.heros.length > 0){
            let usableActions = this.hand
                .filter((c) => {
                    if(c instanceof Cards.ActionCard){
                        return this.heros.some((h)=>h.canUseAction(c)); 
                    }
                    return false;
                });
            r = r.concat(usableActions);
        }
        return r;
    }

    onNewTurn(): void{
        this.playedHero = false;
        for(let h of this.heros){
            h.onNewTurn();
        }
        /*
        let handSize = this.hand.length;
        let toDraw = 5 - handSize;
        for(let i = 0; i < toDraw; i++){
            this.drawCard();
        }
        */
    }

    async playTurn() : Promise<{}>{
        this.onNewTurn()
        let choices:Choosable[];
        while((choices = this.getPossibleActions()).length > 0){
            choices.map((c)=>c.getElem().removeClass('active'))
            let choice = await this.makeChoice(choices);
            if(choice instanceof Cards.HeroComponent){
                let raceCard = choice;
                raceCard.getElem().addClass('active')
                let classCard = await this.makeChoice(
                    this.hand.filter((c)=>c.type == Cards.CardType.CLASS)
                ) as Cards.HeroComponent;
                let zone: Zone = await this.makeChoice(this.game.zones) as Zone;
                this.discard(classCard);
                this.discard(raceCard);
                this.addHero(new Hero.Hero(raceCard, classCard, zone));
            }else if(choice instanceof Cards.ActionCard){
                let action = choice;
                choice.getElem().addClass('active');
                let users = this.heros
                                .filter((h)=>h.canUseAction(action));
                let user = await this.makeChoice(users) as Hero.Hero;
                await user.useAction(action)
                this.discard(action);
            }
        }
        console.log("Ending turn");
        return new Promise((resolve)=>resolve()) 
    }
    discard(c: Cards.Card) : void{
        let index = this.hand.indexOf(c);
        this.hand.splice(index, 1);

        this.onUpdate();
    }
    abstract async makeChoice(options:Choosable[]): Promise<Choosable>;
}
export class UIParty extends Party{
    async makeChoice(options:Choosable[]): Promise<Choosable>{
        if(options.length == 0){
            throw new ChoiceFailed();
        }
        for(let c of options){
            c.highlight(); 
        }
        let p = new Promise<Choosable>((resolve, reject)=>{
            for(let c of options){
                c.getElem().click(function(c: Choosable){
                    resolve(c)
                }.bind(null, c)); 
            }
        });
        p.then(()=>{
            for(let c of options){
                c.unhighlight(); 
            }
        })
        return p;
    }
}
export class RandomParty extends Party{
    async makeChoice(options:Choosable[]): Promise<Choosable>{
        if(options.length == 0){
            throw new ChoiceFailed();
        }
        return new Promise<Choosable>((resolve)=>{
            console.log("Whaaat!?\n",options)
            resolve(options[Math.floor(Math.random()*options.length)])
        })
    }
}

export class Game{
    partyA: Party;
    partyB: Party;
    zones: Zone[];
    constructor(deckA:Cards.Card[], deckB:Cards.Card[]){
        this.partyA = new UIParty(this, deckA);
        this.partyB = new RandomParty(this, deckB);
        this.partyA.opponent = this.partyB;
        this.partyB.opponent = this.partyA;
        this.zones = [new Zone()];
    }
    async play(): Promise<{}>{
        const limit = 30;
        for(let i = 0; i < limit; i++){
            await this.partyA.playTurn();
            await this.partyB.playTurn();
        }
        return new Promise((resolve)=>resolve());
    }
}

export class Zone extends Choosable{
    heroA: Hero.Hero|undefined;
    heroB: Hero.Hero|undefined;
    $zone: JQuery|undefined;

    getElem(): JQuery{
        if(!this.$zone){
            this.$zone = $('<div/>').addClass('zone')
            $('<div/>').appendTo(this.$zone).addClass('zone__A')
            $('<div/>').appendTo(this.$zone).addClass('zone__B')
        }
        return this.$zone; 
    }

    addHero(player:"a"|"b", hero:Hero.Hero ){
        if(player == "a"){
            this.heroA = hero;
            this.getElem().find('.zone__A').append(hero.render())
        }else{
            this.heroB = hero;
            this.getElem().find('.zone__B').append(hero.render())
        }
    }
}
