"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const alsatian_1 = require("alsatian");
const Cards = require("../main/cards");
class TestCardLoading {
    LoadCardsTest() {
        try {
            let json = require("../json/cards.json");
            console.error(json);
            let obj = JSON.parse(json);
            for (let c in obj)
                alsatian_1.Expect(Cards.parseCard(c)).not.toBeDefined();
        }
        catch (e) {
            console.error(e);
        }
    }
}
__decorate([
    alsatian_1.Test("Cards should load")
], TestCardLoading.prototype, "LoadCardsTest", null);
exports.TestCardLoading = TestCardLoading;
//# sourceMappingURL=load_cards.spec.js.map