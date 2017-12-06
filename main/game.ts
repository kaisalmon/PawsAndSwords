import * as Heros from "./heros";
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
    heros: Heros.Hero[] = [];
    game: Game;
    label: 'a'|'b';

    playedHero: boolean = false;

    onUpdate: ()=>void;
   
    constructor(label: 'a'|'b', game: Game, deck:Cards.Card[]){
        this.label = label;
        this.game = game;
        this.deck = deck;
        this.hand = deck.slice();
        this.onUpdate = ()=>{};
    }
    addHero(hero: Heros.Hero){
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

    getPlaceableZones(): Zone[]{
        let empty = this.game.zones.filter(z => z.getHero(this.label)==undefined)
        let opposite_foes = empty.filter(z => z.heroA || z.heroB);
        if(opposite_foes.length > 0){
            return opposite_foes;
        }
        let adjecent_allies = empty.filter(z => z.adjacent().filter(a=>a.getHero(this.label)).length > 0);
        if(adjecent_allies.length > 0){
            return adjecent_allies;
        }
        return empty.filter(z => z.center);
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

                classCard.getElem().addClass('active')
                let zone: Zone = await this.makeChoice(this.getPlaceableZones()) as Zone;
                this.discard(classCard);
                this.discard(raceCard);

                let h = new Heros.Hero(raceCard, classCard, zone);
                this.addHero(h);
                zone.addHero(this.game.activeId, h);
            }else if(choice instanceof Cards.ActionCard){
                let action = choice;
                choice.getElem().addClass('active');
                let users = this.heros
                                .filter((h)=>h.canUseAction(action));
                let user = await this.makeChoice(users) as Heros.Hero;
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
    activeId: 'a'|'b' = 'a';
    constructor(deckA:Cards.Card[], deckB:Cards.Card[]){
        this.partyA = new UIParty('a', this, deckA);
        this.partyB = new RandomParty('b', this, deckB);
        this.partyA.opponent = this.partyB;
        this.partyB.opponent = this.partyA;

        this.zones = [new Zone(),new Zone(true),new Zone()]; //3 zones, with center zone marked
        for(let i = 0; i < this.zones.length - 1; i++){ /*0 & 1, not 2. Thus i and (i+1) are valid indexs*/
            this.zones[i].left = this.zones[i+1];
            this.zones[i+1].right = this.zones[i];
        }
    }
    async play(): Promise<{}>{
        const limit = 30;
        for(let i = 0; i < limit; i++){
            this.activeId = 'a';
            await this.partyA.playTurn();
            this.activeId = 'b';
            await this.partyB.playTurn();
        }
        return new Promise((resolve)=>resolve());
    }
}

export class Zone extends Choosable{
    center: boolean;
    heroA: Heros.Hero|undefined;
    heroB: Heros.Hero|undefined;
    $zone: JQuery|undefined;
    left: Zone|undefined;
    right: Zone|undefined;
    
    constructor(center: boolean = false){
        super();
        this.center = center;
    }

    getElem(): JQuery{
        if(!this.$zone){
            this.$zone = $('<div/>').addClass('zone')
            $('<div/>').appendTo(this.$zone).addClass('zone__B')
            $('<div/>').appendTo(this.$zone).addClass('zone__A')
        }
        return this.$zone; 
    }

    addHero(player:"a"|"b", hero:Heros.Hero ){
        if(player == "a"){
            this.heroA = hero;
            this.getElem().find('.zone__A').append(hero.render())
        }else{
            this.heroB = hero;
            this.getElem().find('.zone__B').append(hero.render())
        }
        hero.getElem().addClass('animated bounceIn');
        setTimeout(()=>
            hero.getElem().removeClass('bounceIn')
        , 1000);
    }

    getHero(label: 'a'|'b'): Heros.Hero|undefined{
        if(label == 'a'){
            return this.heroA;
        }else{
            return this.heroB;
        }
    }

    adjacent(): Zone[]{
        let result: Zone[] = []; 
        if(this.left){
            result.push(this.left);
        }
        if(this.right){
            result.push(this.right);
        }
        return result;
    }
}
