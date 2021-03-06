import * as Heros from "./heros";
import * as Cards from "./cards";
import * as Effects from "./effects";
import * as $ from "jquery";

export function sleep(seconds: number) { 
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, seconds*1000);
  });
}

function shuffleArray<T>(array: T[]):void {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

export abstract class Choosable{
    abstract getElem(): JQuery; 
    highlight(highlightClass: string) : void{
        this.getElem().addClass('choosable');
        this.getElem().addClass('choosable--highlighted');
        this.getElem().addClass('choosable--highlighted'+highlightClass);
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
}
*/
class ChoiceFailed extends Error {
     constructor() {
        super("Choice Failed");
     }
}

export enum GameEvent{
    ON_NEW_TURN,
    ON_TURN_END,
    ON_ATTACKED,
    ON_ATTACKS,
    ON_JOIN,
    ON_SLAIN,
    ON_MOVE
}

export abstract class Party{
    opponent: Party|null = null;
    deck: Cards.Card[] = [];
    deckHeros: Cards.Card[] = [];
    hand: Cards.Card[] = [];
    handHeros: Cards.Card[] = [];
    heros: Heros.Hero[] = [];
    game: Game;
    label: 'a'|'b';

    playedHero: boolean = false;
    lockActions = false;

    onUpdate: ()=>void;
   
    constructor(label: 'a'|'b', game: Game, deck:Cards.Card[]){
        this.label = label;
        this.game = game;
        this.deck = deck.filter((c)=>c instanceof Cards.ActionCard);
        this.deckHeros = deck.filter((c)=> !(c instanceof Cards.ActionCard));
        shuffleArray(this.deck)
        shuffleArray(this.deckHeros)
        this.hand = [];
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

        if(this.heros.length < 3 && !this.playedHero && this.handHeros.some((c)=>c.type == Cards.CardType.CLASS)){
            r = r.concat(this.handHeros.filter((c)=>c.type == Cards.CardType.RACE));
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

        for(let hero of this.heros){
            if(hero.canUseActions()){
                r = r.concat(hero.getBuiltInActions().filter(
                    (action)=>action.effects[0].isValid(hero, hero)
                ));
            }
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

    async onNewTurn(): Promise<{}>{
        this.playedHero = false;
        for(let h of this.heros){
            await h.onNewTurn();
        }

        let handSize = this.hand.length;
        let toDraw = 5 - handSize;
        console.warn(handSize,"=", this.hand.map((c)=>c.name));
        for(let i = 0; i < toDraw; i++){
            this.drawCard();
        }

        handSize = this.handHeros.length;
        toDraw = 5 - handSize;
        for(let i = 0; i < toDraw; i++){
            this.drawHeroCard();
        }

        this.onUpdate();
        return new Promise((resolve)=>resolve());
    }

    drawHeroCard(): void{
        let card = this.deckHeros.pop();
        if(card)
            this.handHeros.push(card)
    }

    drawCard(): void{
        let card = this.deck.pop();
        console.log(card);
        if(card)
            this.hand.push(card)
    }

    async playTurn() : Promise<{}>{
        this.onUpdate();
        await this.onNewTurn()
        let choices:Choosable[];
        while((choices = this.getPossibleActions()).length > 0){
            choices.map((c)=>c.getElem().removeClass('active'))

            //Ensure all graphics are updated before we request choices, so that 
            //All highlighted elements exists
            this.lockActions = true;
            this.onUpdate();
            
            for(let hero of this.heros){
                if(hero.$hero)
                    hero.$hero.addClass('hero--show-actions')
            }
            let choice = await this.makeChoice(choices);
            for(let hero of this.heros){
                if(hero.$hero)
                    hero.$hero.removeClass('hero--show-actions')
            }
            this.lockActions = false;

            if(choice instanceof Cards.HeroComponent){
                let raceCard = choice;
                raceCard.getElem().addClass('active')
                let classCard = await this.makeChoice(
                    this.handHeros.filter((c)=>c.type == Cards.CardType.CLASS)
                ) as Cards.HeroComponent;

                classCard.getElem().addClass('active')
                let zone: Zone = await this.makeChoice(this.getPlaceableZones());
                this.discard(classCard);
                this.discard(raceCard);

                let h = new Heros.Hero(raceCard, classCard, zone);
                this.addHero(h);
                await zone.addHero(this.game.activeId, h);
                await h.onTrigger(GameEvent.ON_JOIN);
            }else if(choice instanceof Cards.ActionCard){
                let action = choice;
                try{
                    choice.getElem().addClass('active');
                    await sleep(1)
                    let users = this.heros
                                    .filter((h)=>h.canUseAction(action));
                    let user = await this.makeChoice(users);
                    await user.useAction(action)
                }catch(e){
                    if(e instanceof Effects.EffectFailed){
                        //Swallow Error
                    }else{
                        throw e;
                    }
                }finally{
                    this.discard(action);
                }
            }else if(choice instanceof Heros.BuiltInAction){
                let effects = choice.effects;
                let hero = choice.hero;
                try{
                    for(let e of effects){
                        await e.apply(hero, hero);
                        hero.getParty().onUpdate();
                    }
                }catch(e){
                    if(e instanceof Effects.EffectFailed){
                        //Swallow Error
                    }else{
                        throw e;
                    }
                }
                hero.usedAction = true;
            }else{
                console.error("Choice:",choice,"not supported");
                break;
            }
            this.onUpdate();
        }

        for(let h of this.heros){
            await h.onTrigger(GameEvent.ON_TURN_END);
        }

        console.log("Ending turn");
        return new Promise((resolve)=>resolve()) 
    }
    discard(c: Cards.Card) : void{
        let index = this.hand.indexOf(c);
        if(index !== -1)
            this.hand.splice(index, 1);

        index = this.handHeros.indexOf(c);
        if(index !== -1)
            this.handHeros.splice(index, 1);

        this.onUpdate();
    }
    abstract async makeChoice<T extends Choosable>(options:T[], highlightClass?:string|undefined): Promise<T>;
}
export class UIParty extends Party{
    async makeChoice<T extends Choosable>(options:T[], highlightClass?:string|undefined): Promise<T>{
        if(options.length == 0){
            throw new ChoiceFailed()
        }
        for(let c of options){
            c.highlight(highlightClass||""); 
        }
        let p = new Promise<T>((resolve)=>{
            for(let c of options){
                c.getElem().click(function(c: T){
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
    async makeChoice<T extends Choosable>(options:T[], highlightClass?:string|undefined): Promise<T>{
        await sleep(0.5)
        return await this.game.randomChoice(options);
    }
}

export class Game{
    partyA: Party;
    partyB: Party;
    zones: Zone[];
    activeId: 'a'|'b' = 'a';
    constructor(deckA:Cards.Card[], deckB:Cards.Card[]){
        this.partyA = new UIParty('a', this, deckB);
        this.partyB = new RandomParty('b', this, deckA);
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
    
    //When networking is implemented, this will ensure all clients recieve the same random response
    async randomChoice<T extends Choosable>(options:T[], highlightClass?:string|undefined): Promise<T>{
        if(options.length == 0){
            return new Promise<T>((resolve, reject) => reject())
        }
        return new Promise<T>((resolve)=>{
            resolve(options[Math.floor(Math.random()*options.length)])
        })
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

    async addHero(player:"a"|"b", hero:Heros.Hero ): Promise<{}>{
        hero.zone = this;

        if(player == "a"){
            this.heroA = hero;
            this.getElem().find('.zone__A').append(hero.render())
        }else{
            this.heroB = hero;
            this.getElem().find('.zone__B').append(hero.render())
        }
        hero.getElem().addClass('animated bounceIn');
        return new Promise((resolve)=>{
            setTimeout(()=>{
                hero.getElem().removeClass('bounceIn')
                resolve();
            }, 1000);
        })
    }

    empty(player:"a"|"b"): void{
        if(player == "a"){
            this.heroA = undefined;
        }else{
            this.heroB = undefined;
        }
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
