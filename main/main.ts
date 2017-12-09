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
                                 .appendTo('body');
        this.$handB = $('<div/>').css('position', 'fixed')
                                 .css('top', '0')
                                 .appendTo('body');

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
            c.render().appendTo(this.$handA);
        }
        this.$handB.empty();
        for(let c of this.game.partyB.hand){
            c.render().appendTo(this.$handB);
        }
        this.$board.empty(); 
        for(let z of this.game.zones){
            z.getElem().appendTo(this.$board);
        }
    } 
}

let all_cards_json = [
    {name:"Fighter", type:"class","role":"warrior", icon:"diamond-hilt", strength:2, arcana:0, health:12, effects:[
        {type:"on_attacks", effects:[
            {type:"move_random"} 
        ]} 
    ]},

    {name:"Thief", type:"class","role":"warrior", icon:"diamond-hilt", strength:1, arcana:0, health:12, effects:[
        {type:"on_join", effects:[
            {type:"until_attacks", effects:[
                {type:"invisible"}, 
                {type:"armored"}, 
            ]},
        ]},
    ]},

    {name:"Wizard", type:"class","role":"mage", icon:"pointy-hat", strength:0, arcana:2, health:8, effects:[
        {type:"while_alone", effects:[
            {type:"invisible"}, 
        ]} 
    ]}, 

    {name:"Squirrel", type:"race",icon:"person", strength:1, arcana:1, health:10, effects:[
        {type:"while_damaged", effects:[
            {type:"on_attacked", effects:[
                {type:"move_random"}, 
            ]} 
        ]} 
    ]},
    {name:"Boar", type:"race",icon:"person", strength:1, arcana:1, health:10, effects:[
        {type:"on_join", effects:[
            {type:"attack", effects:[
                {type:"damage", amount:"2"}
            ]} 
        ]} 
    ]},

    {name:"Hermit Crab", type:"race",icon:"person", strength:1, arcana:1, health:10, effects:[
        {type:"on_new_turn", effects:[
            {type:"until_attacks", effects:[
                {type:"armored"}, 
            ]} 
        ]} 
    ]},


    {name:"Teleport", type:"spell",icon:"teleport", effects:[
        {type:"move"}
    ]},

    {name:"Magic Missile", type:"spell",icon:"ringed-beam", effects:[
        {type:"all_foes", effects:[
            {type:"damage", amount:"A + 1"}
        ]} 
    ]},

    {name:"Flaming Arrow", type:"spell",icon:"flaming-arrow", effects:[
        {type:"ranged_attack", effects:[
            {type:"damage", amount:"A"}
        ]} 
    ]},

    {name:"Smite", type:"spell",icon:"winged-sword", effects:[
        {type:"attack", effects:[
            {type:"damage", amount:"A + S"}
        ]} 
    ]},

    {name:"Smite", type:"spell",icon:"winged-sword", effects:[
        {type:"attack", effects:[
            {type:"damage", amount:"A + S"}
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

