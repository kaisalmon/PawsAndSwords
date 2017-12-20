import { Expect, Test } from "alsatian";
import * as Cards from "../main/cards";

export class TestCardLoading{

    @Test("Cards should load")
    public LoadCardsTest() {
        try{
            let json = require("../json/cards.json");
            for(let c of json)
                Expect(Cards.parseCard(c)).toBeDefined()
        }catch(e){
            console.error(e);
            throw e;
        }
    }
}
