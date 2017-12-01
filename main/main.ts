import * as Cards from "./cards";
import * as $ from 'jquery'
import * as Game from "./game";

class GameRenderer{
    game: Game.Game;
    $handA: JQuery;
    $handB: JQuery;
    $boardA: JQuery;
    $boardB: JQuery;
    constructor(game:Game.Game){
        this.game = game;
        this.$boardA = $('<div/>').css('position', 'fixed')
                                  .css('bottom','200px')
                                 .appendTo('body');
        this.$boardB = $('<div/>').css('position', 'fixed')
                                  .css('top','200px')
                                 .appendTo('body');
        this.$handA = $('<div/>').css('position', 'fixed')
                                 .css('bottom', '0')
                                 .appendTo('body');
        this.$handB = $('<div/>').css('position', 'fixed')
                                 .css('top', '0')
                                 .appendTo('body');

        this.onUpdate();
    }
    onUpdate():void{
        this.$handA.empty();
        for(let c of this.game.partyA.hand){
            c.render().appendTo(this.$handA);
        }
        for(let h of this.game.partyA.heros){
            if(!h.$hero){
                h.render().addClass('animated bounceIn').appendTo(this.$boardA);
                setTimeout(()=>h.getElem().removeClass('bounceIn'), 1000);
            }else{
                h.rerender();
            }
        }

        this.$handB.empty();
        for(let c of this.game.partyB.hand){
            c.render().appendTo(this.$handB);
        }
        for(let h of this.game.partyB.heros){
            if(!h.$hero){
                h.render().addClass('animated bounceIn').appendTo(this.$boardB);
                setTimeout(()=>h.getElem().removeClass('bounceIn'), 1000);
            }else{
                h.rerender();
            }
        }
    } 
}

let all_cards_json = [
    {name:"Fighter", type:"class","role":"warrior", icon:"diamond-hilt", strength:2, arcana:0, health:12},

    {name:"Wizard", type:"class","role":"mage", icon:"pointy-hat", strength:0, arcana:2, health:8},

    {name:"Squirrel", type:"race",icon:"person", strength:1, arcana:1, health:10},
    {name:"Boar", type:"race",icon:"person", strength:1, arcana:1, health:10},

    {name:"Self Wound", type:"spell",icon:"ragged-wound", effects:[
        {type:"damage", amount:"4"}
    ]},

    {name:"Magic Missile", type:"spell",icon:"ringed-beam", effects:[
        {type:"all_foes", effects:[
            {type:"damage", amount:"A + 1"}
        ]} 
    ]},
]

let deckA:Cards.Card[] = [];
let deckB:Cards.Card[] = [];

for(let card_json of all_cards_json){
    let c = Cards.parseCard(card_json);
    deckA.push(c);
    c = Cards.parseCard(card_json);
    deckB.push(c);
}

let game = new Game.Game(deckA, deckB);
let render = new GameRenderer(game);

game.partyA.onUpdate = () => render.onUpdate(); 
game.partyB.onUpdate = () => render.onUpdate(); 
(async function(){
    await game.play();
})();

