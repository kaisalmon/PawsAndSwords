import * as Cards from "./cards";
import * as Effects from "./effects";
import * as Game from "./game"
import * as $ from 'jquery'

function sleep(seconds: number) { 
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, seconds*1000);
  });
}

export class TempPassive{
    effects: Effects.HeroPassive[];
    removal_trigger: Game.GameEvent;
    constructor(effects: Effects.HeroPassive[], trigger: Game.GameEvent){
        this.effects = effects;
        this.removal_trigger = trigger;
    }
}

export class BuiltInAction extends Game.Choosable{
    effects: Effects.HeroEffect[];
    icon: string;
    hero: Hero;
    $button: JQuery|undefined;
   
    constructor(hero: Hero, effects: Effects.HeroEffect[], icon: string){
        super();
        this.effects = effects;
        this.icon = icon;
        this.hero = hero;
    }

    getElem(): JQuery{
        if(this.$button === undefined){
            this.$button = $('<div/>').addClass('hero__action');
            let url = "https://kaisalmon.com/cardgame/include/loadImage.php?icon="+this.icon;
            $('<img/>').attr('src',url).appendTo(this.$button);
        }
        return this.$button; 
    }
}

export class Hero extends Game.Choosable{
    classCard: Cards.HeroComponent; 
    raceCard: Cards.HeroComponent;
    damage: number;
    party: Game.Party;
    $hero: JQuery | undefined;
    zone: Game.Zone;


    //status flags
    usedAction: boolean = false;
    justJoined: boolean = true;
    slain: boolean = false;

    tempPassives: TempPassive[] = [];
    turnDisabledEffects: Effects.he_OncePerTurn[] = [];

    //action cache, while actions are locked
    cached_builtInActions: BuiltInAction[]|undefined;

    constructor(raceCard: Cards.HeroComponent, classCard: Cards.HeroComponent, zone: Game.Zone){
        super();
        this.classCard = classCard;
        this.raceCard = raceCard;
        this.damage = 0;
        this.zone = zone;
    }
    async onTrigger(trigger: Game.GameEvent) : Promise<{}>{
        //Remove tempPassives
        this.tempPassives = this.tempPassives.filter((f)=>f.removal_trigger != trigger);
        
        //Fire OnEvent passives
        let on_events = this.getPassivesOfType(Effects.hp_OnEvent).filter((hp)=>hp.trigger == trigger);
        if(on_events.length > 0){
            let any_valid = on_events.some((ov)=>ov.effects[0].isValid(this, this));
            if(this.$hero && any_valid){
                this.$hero.addClass('animated flash');
                await sleep(1);
                this.$hero.removeClass('animated flash');
            }
            for(let ov of on_events){
                try{
                    if(ov.effects[0].isValid(this,this)){
                        for(let e of ov.effects){
                            await e.apply(this, this);
                        }
                    }
                }catch(e){
                    if(e instanceof Effects.EffectFailed){
                        //pass
                    }else{
                        throw e;
                    }
                }
            }
        }
        return new Promise((resolve)=>resolve());
    }

    hasKeyword(keyword: Effects.Keyword): boolean{
        let keywords = this.getPassivesOfType(Effects.hp_Keyword).filter((hp)=>hp.keyword == keyword);
        return keywords.length > 0;
    }

    async onNewTurn() : Promise<{}>{
        this.usedAction = false;
        this.justJoined = false;
        this.turnDisabledEffects = [];

        await this.onTrigger(Game.GameEvent.ON_NEW_TURN)
        return new Promise((resolve)=>resolve());
    }

    async slay() : Promise<{}>{
        if(!this.slain){
            this.slain = true;
            await this.onTrigger(Game.GameEvent.ON_SLAIN)
            this.zone.empty(this.getParty().label)
            this.getParty().heros.splice(this.getParty().heros.indexOf(this), 1);
            if(this.$hero){
                this.$hero.addClass('animated rotateOutDownLeft') 
                setTimeout(()=>{
                    if(this.$hero){
                        this.$hero.remove()
                        }
                    }, 1000);
            }
        }
        return new Promise((resolve)=>resolve());
    }


    getName() : string{
        return this.raceCard.name+" "+this.classCard.name;
    }
    getStrength() : number{
        return this.raceCard.strength + this.classCard.strength;
    }
    getArcana() : number{
        return this.raceCard.arcana + this.classCard.arcana;
    }
    getMaxHealth() : number{
        return this.raceCard.health + this.classCard.health;
    }
    getHealth() : number{
        return this.getMaxHealth() - this.damage;
    }
    getRoles() : Cards.Role[]{
        return [this.classCard.role]
    }
    getParty() : Game.Party{
        if(this.party){
            return this.party;
        }
        throw "Party requested but not defined";
    }
    getGame() : Game.Game{
        if(this.party){
            return this.party.game;
        }
        throw "Party requested but not defined";
    }

    getMeleeFoe(): Hero|undefined{
        return this.zone.getHero(this.party.label == 'a' ? 'b' : 'a');
    }

    getMoveableZones(): Game.Zone[]{
        let zones = this.getGame().zones;
        return zones.filter((z)=> (z.heroA || z.heroB) && z != this.zone )
    }
    
    getPassives(depth=0, maxDepth=10): Effects.HeroPassive[]{
        var effects: Effects.HeroPassive[] = [];

        //Get passives from allies AllAlliesHave effects
        for(let ally of this.getAllies()){
            let allAllyEffects = ally.getPassivesOfType(Effects.hp_AllAlliesHave, depth+1, maxDepth);
            for(let source of allAllyEffects){
                effects = effects.concat(source.effects);
            }
        }

        //Add passives from temp passives
        for(let tp of this.tempPassives){
            effects =  effects.concat(tp.effects);
        }

        //Add passives from race and class
        effects =  effects.concat(this.raceCard.effects).concat(this.classCard.effects);

        //Map passives to ActivePassives (To resolve conditionals)
        let activePassives: Effects.HeroPassive[][] = effects.map((e)=>e.getActivePassives(this));
        effects = activePassives.reduce((arr, e)=>arr.concat(e), []);
        return effects;
    }

    getPassivesOfType<T extends Effects.HeroPassive>(t: new (...args: any[]) => T, depth=0, maxDepth=10): T[] {
        //There is a limit of how much we need to account for an ability that says
        // "All allies have "All allies have "all allies have "All allies have "all Foes have "...
        if(depth >= maxDepth){
            return []; 
        }
        let result: T[] = [];
        for (let child of this.getPassives(depth+1, maxDepth)) {
            if (child instanceof t)
                result.push(<T>child);
            }
        return result;
    }
    getAllies(): Hero[]{
        return this.getParty().heros.filter((h)=>h!==this);
    }
    getBuiltInActions(): BuiltInAction[]{
        if(!this.getParty().lockActions || this.cached_builtInActions == undefined){
            let actions: BuiltInAction[] = [];

            //Default Attack
            actions.push(
                new BuiltInAction(this, [
                    new Effects.he_Attack([
                        new Effects.he_Damage(new Amount("S"))
                    ])
                ],"crossed-swords")
            )

            //Default Move
            actions.push(
                new BuiltInAction(this, [
                    new Effects.he_Move()
                ],"back-forth")
            )
            
            let passives = this.getPassivesOfType(Effects.hp_Action);
            for(let passive of passives){
                actions.push(
                    new BuiltInAction(this, passive.effects, passive.sourceIcon || "stars-stack")
                )
            }


            this.cached_builtInActions = actions;
        }
        return this.cached_builtInActions;
    }


    canUseActions(): boolean{
        if(this.slain || this.justJoined || this.usedAction || this.hasKeyword(Effects.Keyword.STAGGERED)){
            return false;
        }
        return true;
    }
    canUseAction(a: Cards.ActionCard): boolean{
        if(!this.canUseActions()){
            return false;
        }
        return a.effects[0].isValid(this, this);
    }
    async useAction(action: Cards.ActionCard) : Promise<{}>{
        console.log(this.getName()+" uses "+action.name);
        this.usedAction = true;
        if(this.$hero){
            this.$hero.addClass('animated tada');
            await sleep(1);
            this.$hero.removeClass('animated tada');
        }
        try{
            return await action.apply(this);
        }catch(e){
            console.error(e)
            return new Promise((r)=>r());
        }
    }
    async moveZone(zone: Game.Zone) : Promise<{}>{
        if(this.slain){
            throw new Effects.EffectFailed();
        }
        return new Promise((resolve)=>{
            let oldZone = this.zone;
            let ally = zone.getHero(this.getParty().label)
            if(this.$hero){
                this.$hero.addClass('animated bounceOut') 
            }
            if(ally){
                if(ally.$hero){
                    ally.$hero.addClass('animated bounceOut') 
                }
            }else{
                oldZone.empty(this.getParty().label);
            }
            setTimeout(async ()=>{
                if(this.$hero){
                    this.$hero.removeClass('bounceOut').remove() 
                }
                if(ally){
                    console.log(ally)
                    if(ally.$hero){
                        ally.$hero.removeClass('bounceOut').remove() 
                    }
                    //do not await, so animations play at the same time
                    oldZone.addHero(this.getParty().label, ally);      
                }
                await zone.addHero(this.getParty().label, this)
                resolve();
            },1000)
        })
    }

    addTempPassive(tempPassive: TempPassive){
        this.tempPassives.push(tempPassive)
    }

    render(): JQuery {
        this.$hero = $('<div/>').addClass('wrapper--hero');
        $('<div/>').addClass('hero').appendTo(this.$hero);
        this.rerender();
        return this.$hero;
    }
    rerender(): void{
        if(!this.$hero){
            throw "Hero not rendered";
        } 
        var $inner = this.$hero.find('.hero');
        $inner.empty();

        //Stats and Name
        $('<div/>').addClass('hero__titlebar').text(this.getName()).appendTo($inner);
        let $row = $('<div/>').addClass('hero__stats').appendTo($inner);
        $('<div/>').addClass('hero__strength').appendTo($row).text(this.getStrength())
        $('<div/>').addClass('hero__arcana').appendTo($row).text(this.getArcana())
        let damaged = this.getHealth() < this.getMaxHealth();
        $('<div/>').addClass('hero__health').appendTo($row).text(this.getHealth()).addClass(damaged ? "hero__health--damaged" : "")

        //Keywords
        if(this.hasKeyword(Effects.Keyword.ARMORED)){
            $('<div/>').addClass('hero__armored').appendTo($row)
        }
        let opacity = this.hasKeyword(Effects.Keyword.INVISIBLE) ? 0.7 : 1;
        $inner.css('opacity', opacity);
        let transform = this.hasKeyword(Effects.Keyword.STAGGERED) ? "rotate(15deg)" : "none";
        $inner.css('transform', transform);

        //Builtin Actions
        let $actions = $('<div/>').addClass('hero__action-wrapper').appendTo($inner);
        for(let action of this.getBuiltInActions()){
            action.getElem().appendTo($actions);
        }

        //Status
        let $status = $('<div/>').addClass('hero__status').appendTo($inner);
        for(let p of this.getPassives()){
            let p_html:string = '%descr% <span class="hero__status__from">from <b>%src%</b></span>';
            p_html = p_html.replace(/%descr%/g, p.description());
            p_html = p_html.replace(/%src%/g, p.sourceName);
            p_html = p_html.replace(/%target%/g, "");
            p_html = p_html.replace(/%to target%/g, "");
            $('<div/>').html(p_html).appendTo($status);
        }
    }
 
    getElem() : JQuery{
        if(this.$hero){
            return this.$hero;
        }
        throw "Card is not rendered"
    }
}

export class Amount{
    string:string;
    constructor(string:string){
        this.string = string;
    }

    val(hero: Hero): number{
        var str = this.string;
        str = str.replace("A", String(hero.getArcana()));
        str = str.replace("S", String(hero.getStrength()));
        var total= 0, s= str.match(/[+\-]*(\.\d+|\d+(\.\d+)?)/g) || [];
        while(s.length){
            total+= parseInt(s.shift()||"0");
        }
        return total;
    }

    toString(): string{
        return this.string;
    }
}
