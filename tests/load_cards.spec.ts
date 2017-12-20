import { Expect, Test } from "alsatian";
import * as Cards from "../main/cards";

export class TestCardLoading{

    @Test("Cards should load")
    public LoadCardsTest() {
        try{
            let json = require("../json/cards.json");
            console.error(json)
            let obj = JSON.parse(json);
            for(let c in obj)
                Expect(Cards.parseCard(c)).not.toBeDefined()
        }catch(e){
            console.error(e);
        }
    }
}
