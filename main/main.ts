import * as Cards from "./cards";
import * as $ from 'jquery'
import * as Game from "./game";

class GameRenderer{
    game: Game.Game;
    $handA: JQuery;
    $handB: JQuery;
    $board: JQuery;

    constructor(game:Game.Game){
        this.game = game;
        this.$board = $('<div/>').addClass('zones')
                                 .appendTo('body');
        this.$handA = $('<div/>').css('position', 'fixed')
                                 .css('bottom', '0')
                                .css('display','flex')
                                 .appendTo('body');
        this.$handB = $('<div/>').css('position', 'absolute')
                                .addClass('hand--B')
                                .css('display','flex')
                                 .css('top', '0')
                                 .appendTo('body');

        this.$board.empty(); 
        for(let z of this.game.zones){
            z.getElem().appendTo(this.$board);
        }

        this.onUpdate();
    }
    onUpdate():void{
        try{
            for(let h of this.game.partyA.heros){
                h.rerender();
            }
            for(let h of this.game.partyB.heros){
                h.rerender();
            }
        }catch(e){}
        this.$handA.empty();
        for(let c of this.game.partyA.hand){
            let $c = c.render().appendTo(this.$handA);
            Cards.fitText($c)
        }
        for(let c of this.game.partyA.handHeros){
            let $c =c.render().appendTo(this.$handA);
            Cards.fitText($c)
        }
        this.$handB.empty();
        for(let c of this.game.partyB.hand){
            let $c =c.render().appendTo(this.$handB);
            Cards.fitText($c)
        }
        for(let c of this.game.partyB.handHeros){
            let $c =c.render().appendTo(this.$handB);
            Cards.fitText($c)
        }
    } 
}

let all_cards_json = require("../json/cards.json");

let deckA:Cards.Card[] = [];
let deckB:Cards.Card[] = [];

for(let card_json of all_cards_json){
    let c = Cards.parseCard(card_json);
    let count = c instanceof Cards.ActionCard ? 3 : 1;
    for(let i = 0; i < count; i++){
        c = Cards.parseCard(card_json);
        deckA.push(c);
        c = Cards.parseCard(card_json);
        deckB.push(c);
    }
}

let game = new Game.Game(deckA, deckB);
let render = new GameRenderer(game);

game.partyA.onUpdate = () => render.onUpdate(); 
game.partyB.onUpdate = () => render.onUpdate(); 
(async function(){
    await game.play();
})();

