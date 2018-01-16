import * as $ from 'jquery'
import * as Cards from "./cards";

$(document).ready(function(){
    let all_cards = require('../json/cards.json')
    for(let json of all_cards){
        Cards.parseCard(json).render().appendTo('body')
    } 
})
