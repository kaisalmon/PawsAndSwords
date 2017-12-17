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

let all_cards_json = [
    {name:"Fighter", type:"class","role":"warrior", icon:"diamond-hilt", strength:2, arcana:0, health:12, effects:[
        {type:"on_attacks", effects:[
            {type:"move_random"} 
        ]} 
    ]},

    {name:"Thief", type:"class","role":"rogue", icon:"robber", strength:1, arcana:0, health:2, effects:[
        {type:"action", effects:[
            {type:"until_attacks", effects:[
                {type:"invisible"}
            ]},
        ]},
    ]},

    {name:"Warlock", type:"class","role":"mage", icon:"warlock-eye", strength:0, arcana:2, health:9, effects:[
        {type:"action", effects:[
            {type:"until_new_turn", effects:[
                {type:"all_allies_have", effects:[
                    {type:"on_end_turn", effects:[
                        {type:"damage", amount:"2"}, 
                    ]},
                ]},
            ]},

            {type:"ranged_attack", effects:[
                {type:"damage", amount:"A"}, 
            ]} 
        ]} 
    ]}, 
    {name:"Wizard", type:"class","role":"mage", icon:"pointy-hat", strength:0, arcana:2, health:8, effects:[
        {type:"all_allies_have", effects:[
            {type:"action", effects:[
                {type:"ranged_attack", effects:[
                    {type:"damage", amount:"3"}, 
                ]} 
            ]} 
        ]} 
    ]}, 

    {name:"Barbarian", type:"class","role":"warrior", icon:"barbarian", strength:2, arcana:0, health:12, effects:[
        {type:"on_join", effects:[
            {type:"move_random"}, 
            {type:"attack", effects:[
                {type:"damage", amount:"S"},
            ]} 
        ]} 
    ]}, 

    {name:"Cat", type:"race",icon:"white-cat", strength:1, arcana:1, health:10, effects:[
        {type:"while_damaged", effects:[
            {type:"on_attacked", effects:[
                {type:"once_per_turn", effects:[
                    {type:"move_random"}, 
                ]} 
            ]} 
        ]} 
    ]},
    {name:"Bear", type:"race",icon:"bear-head", strength:1, arcana:1, health:10, effects:[
        {type:"action", effects:[
            {type:"heal", amount:"8"},
            {type:"until_attacked", effects:[
                {type:"staggered"}
            ]} 
        ]} 
    ]},

    {name:"Spider", type:"race",icon:"spider", strength:1, arcana:1, health:10, effects:[
        {type:"on_join", effects:[
            {type:"ranged_attack", effects:[
                {type:"damage", amount:"2"},
                {type:"until_turn_ends", effects:[
                    {type:"staggered"},
                ]}
            ]} 
        ]} 
    ]},

    {name:"Hermit Crab", type:"race",icon:"crab", strength:1, arcana:1, health:10, effects:[
        {type:"on_new_turn", effects:[
            {type:"until_attacks", effects:[
                {type:"armored"}, 
            ]} 
        ]} 
    ]},

    {name:"Turtle", type:"race",icon:"turtle", strength:1, arcana:1, health:10, effects:[
        {type:"on_move", effects:[
            {type:"until_new_turn", effects:[
                {type:"armored"}, 
            ]} 
        ]} 
    ]},


    {name:"Magic Missile", type:"spell",icon:"ringed-beam", effects:[
        {type:"all_foes", effects:[
            {type:"damage", amount:"A"}
        ]} 
    ]},

    {name:"Flaming Arrow", type:"spell",icon:"flaming-arrow", effects:[
        {type:"ranged_attack", effects:[
            {type:"damage", amount:"A + 1"}
        ]} 
    ]},

    {name:"Hold Person", type:"spell",icon:"teleport", effects:[
        {type:"ranged_attack", effects:[
            {type:"until_moves", effects:[
                {type:"staggered"}
            ]} 
        ]} 
    ]},
    {name:"Smite", type:"invo",icon:"winged-sword", effects:[
        {type:"attack", effects:[
            {type:"damage", amount:"A+S"}
        ]} 
    ]},

    {name:"Shockwave", type:"mano",icon:"sonic-boom", effects:[
        {type:"attack", effects:[
            {type:"damage", amount:"S"}
        ]}, 
        {type:"all_foes", effects:[
            {type:"until_turn_ends", effects:[
                {type:"staggered"}
            ]} 
        ]} 
    ]},
]

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

