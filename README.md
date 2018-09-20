# Vizualizace grafových algoritmů

Webová aplikace napsaná v jazyce TypeScript, která umožňuje uživateli navrhnout si vlastní graf, ohodnotit hrany, zvolit jejich orientaci a spustit na tomto grafu podporovaný algoritmus, který bude postupně animovat práci tohoto algoritmu a vysvětlovat, jak se rozhoduje.

Aplikace byla napsána jako zápočtový program do předmětu *Programování II* na *Matematicko-fyzikální fakultě, Univerzity Karlovy* v roce 2018.

## Návod k použití

Po otevření stránky se uživateli objeví předem připravený graf a v pravém panelu nápověda.

Kliknutím kdekoli do volného prostoru se vytvoří nový vrchol. Kliknutím na vrchol se vrchol označí, ten je možné smazat klávesou Delete.

V případě kliknutí na jiný vrchol, pokud je nějaký vrchol označený, dojde k vytvoření hrany mezi těmito vrcholy. Hranu je možné zvolit kliknutím, nebo zvolením obou jejich vrcholů.

Vybrané hraně je možné nastavit hodnotu, orientaci, nebo ji opět smazat klávesou Delete.

Jakmile je graf připraven a není nic zvolené, je možné vybrat některý z podporovaných algoritmů. Některé algoritmy mohou mít speciální požadavky na graf, například, že musí být souvislý, nebo mít všechny hrany ohodnocené kladně. Také některé mohou vyžadovat zvolit výchozí hranu.

Pokud se úspěšně spustí algoritmus, automaticky se začne animovat. Šipkami, nebo posuvníkem dole na obrazovce se lze v prezentaci kdekoli posouvat. Tlačítky v pravém horním rohu lze vypnout automatické přehrávání, nebo zrychlit přepínání snímků.

V pravém panelu se také zobrazuje nápověda k aktuálnímu průběhu grafového algoritmu.

Algoritmus lze vypnout křížkem, nebo klávesou Esc.

## Struktura

Aplikace využívá tzv. herce (`actors`) kterým lze nastavit určitý stav (`state`) podle kterého pak vizualizují jednotlivé prvky na obrazovce. Změnou stavu se prvek na obrazovce nezmění okamžitě, ale s určitou prodlevou a bude se animovat.

Protože stav je objekt, může být uložen do pole. Spuštěním každého algoritmu se tedy vytvoří pole snímků obsahujících jednotlivé stavy. Konkrétní snímek pak lze vyvolat tak, že se stavy z pole nastaví odpovídajícím hercům.

### `AbstractActor`
Každý objekt, jež bude v aplikací nějak animován je instancí třídy `AbstractActor`.

`setState(state, immediately, doNotStopAnimation, callback)` - Nastaví herci nový stav, tedy parametry typu pozice, velikost, barva, hodnota, průhlednost. `immediately` určuje, zda se má stav nastavit okamžitě, nebo se animovat. Využívá se, když nějaký herec závisí na jiném a tedy jeho stav nechceme animovat, ale nastavovat okamžitě. `callback` se volá, když se dokončí animace přechodu do nového stavu. Využívá se například při odstranění prvku, kdy chceme, aby postupně zmizel a pak ho až odstranit.

`stateUpdaters: stateUpdaterFunction[]` - Jakmile je nastaven nový stav, je potřeba jej animovat. Všechny funkce, které animují stav jsou v tomto poli. `(oldState, state, newState, progress: number)` - `oldState` je kopie původního stavu herce, `newState` je požadovaný stav, kterého je třeba docílit a `state` je objekt, který je třeba animovat. `progress` je číslo v intervalu 0 až 1 určující v jakém stavu je animace.

Nejjednodušším state updaterem je `simpleMapState`, který je defaultně v tomto poli obsažen. Lineárně mění stav číselných hodnot. Nečíselný stav je upraven okamžitě.

*Příklad: Původní stav byl `{x: 100}` a nový `{x: 200}`. Ve čtvrtině času, kdy by měla probíhat animace je tedy `progress = 0.25` a funkce `simpleMapState` nastaví stav na `{x: 125}`.*

State updater lze například využít tak, že při změně parametru typu string se písmenka nejprve postupně vymažou po jednom a pak se začne objevovat nový text. `TextActor` využívá State Updater aby mohl animovat čísla ve stringu. Viz. `TextActor`.

Funkce obsažené v `stateChangeHandlers: stateChangeHandlerFunctionInterface[]` jsou volány ještě předtím, než je spuštěna logika funkce `setState` a je jim předán stav. Můžou ho pozměnit, pokud vrátí jiný stav, ale využívají se hlavně pokud nějaký parametr stavu chceme předat jinému herci, například `text` je předán `TextActor`.

`update()` - Funkce volána kdykoli je vnitřní stav změněn. Slouží k překreslení elementu na stránce.

`publicInformationListeners: Function[]` - Každý herec také může mít zveřejněné nějaké informace (`publicInformation`), například aktuální pozici, nebo rozměry, které mohou využívat ostatní herci. Všechny funkce v tomto poli jsou volány, když jsou informace změněny. Obvykle se tak děje v metodě `update`.

`knock(time: number)` - Důležitá funkce, která je volána zvenčí (třídou `Board`) a je jí předáván čas od posledního volání této funkce. Slouží pro animaci vnitřního stavu herce, nebo fluktuací pohybu, jak je tomu u vrcholů grafu.

*Kdyby funkce nebyla volána, herci se nebudou hýbat a nebudou měnit stavy, pokud nebude `immediately = true`.*

`connectTo(board: Board)` - Postará se o zaregistrování herce.

`remove(immediately: boolean)` - Postará se o vlastní smazání včetně animace vymizení.

`getStateBeforeChange<T extends Object>(stateToChange: T): T` - Pomocná funkce, která vrátí objekt, s aktuálním stavem, ale pouze ty vlastnosti, které má objekt `stateToChange`. Lze využít, pokud chceme herci nastavit nový stav, ale pak chceme vrátit původní.

#### `TextActor`
* `text: any` - Text
* `x: number` - Pozice
* `y: number` - Pozice
* `color: [number, number, number]` - Barva písma
* `size: number` - Relativní velikost
* `opacity: number` - Neprůhlednost

Jednoduchý herec zobrazující text na obrazovce. 

Implementuje vlastní `stateChangeHandler` který řeší animaci textu. Pokud obsahuje string, stav změní okamžitě. Pokud obsahuje číslo, bude ho lineárně animovat. V případě, že původní a nový stav se liší pouze čísly v řetězcích, je schopen animovat pouze tyto čísla a text okolo zachovat.

Jako `publicInformation` jsou šířka, výška a příznak, zda obsahuje text.

#### `VertexActor`
* `text: string|number` - Popisek
* `x: number` - Pozice
* `y: number` - Pozice
* `color: [number, number, number]` - Barva
* `size: number` - Relativní velikost
* `stroke: [number, number, number]` - Barva ohraničení 
* `opacity: number` - Neprůhlednost

Reprezentuje vrchol jak z pohledu herce, tak z pohledu grafu, obsahuje tedy pole `connectedEdgeActors: EdgeActor[]` které obsahuje všechny hrany napojené na tento vrchol.

Vytvoří si instanci `TextActor` a předává mu stav `text` a vnitřní stav `size, x, y, opacity`.

#### `EdgeActor`
* `text: string` - Popisek hrany
* `color: [number, number, number]` - Barva
* `size: number` - Relativní tloušťka
* `opacity: number` - Neprůhlednost
* `arrows: [number, number]` - Neprůhlednost šipek a současně orientace hrany

Reprezentuje hranu jak z pohledu grafu, tak i herce. Orientace grafu je dána stavem `arrows`. Pokud je `[0, 1]` znamená, že hrana má orientaci od prvního vrcholu k druhému. Hodnotu hrany lze zase zjistit z `text`, jež v takovém případě musí být číslo.

Vytvoří si instanci `TextActor` obdobně jako výše. Zde ale využívá konceptu `publicInformationListener`, aby získalo šířku a výšku textového pole, podle kterého pak pod textem zobrazí jen slabší čáru.

Metoda `setVertices(vertices: [VertexActor, VertexActor])` připojí hranu na konkrétní vrcholy a zaregistruje u nich `publicInformationListener` aby se pozice hrany mohla ihned aktualizovat.

*Pozn.: Nejedná se tedy o stav, který by se dal v průběhu měnit. To by se ale dalo snadno upravit, aby se o stav jednalo. Změnu by si pak odchytil `stateUpdaterFunction` který by například mohl pozice konců čáry lineárně přenést z pozice původního vrcholu na nový.*

*Pozn.: Komunikace mezi herci může tedy probíhat dvěmi způsoby. Buď si "slave" zaregistruje `publicInformationListener`, nebo "master" bude měnit stav ostatních herců. V tomto případě by se dalo udělat i to, že by vrchol nastavoval stav hranám, ale v obecném případě chceme zachovat obě možnosti, aby nebylo nutné při přidání nového typu herce upravovat ostatní.*

#### `HintActor`
* `text: string` - Text

Jediná instance v celé aplikaci, která obsluhuje panel napravo zobrazující nápovědu ke konkrétním snímkům.

#### `BackgroundActor`
* `colors: [number, number, number][]` - Pole alespoň 4 barev, které se budou měnit
* `gradientSpeed: number` - Relativní rychlost

Jediná instance v celé aplikaci, která mění pozadí.

---

#### Jaké další herce lze přidat?
* Zobrazení proměnné/proměnných, co si algoritmus pamatuje - Herci vytvoření v průběhu algoritmu, kteří by zobrazovali globální proměnné, které některé algoritmy mohou využívat
* Tabulka
* Hudba v pozadí - Jediná instance podobně jako u pozadí. Dala by se nastavovat rychlost, nebo styl hudby
* Šipky - Pomocí `publicInformation` by zjišťovaly pozici sledovaného objektu. Změna sledovaného objektu by byla možná přes `stateUpdaterFunction`, nebo by byla zakázána.
* Textové bubliny - Obdobně jako u šipek


### Presenter
Třída řešící stránkování prezentace, vytvoření prezentace a obsluhu vytváření algoritmu.
Je inicializována pouze tehdy, když je spuštěn algoritmus, pak je zničena.

`constructor(board, Algorithm)` - Při vytvoření je třeba dodat třídu algoritmu, který má být prezentován. Uloží si všechny herce a vytvoří jim proměnné, do které lze ukládat stavy u jednotlivých snímků.

`prepare(): boolean|string` - Spustí algoritmus a předtím ověří, zda vše je připraveno. V případě chyby vrátí error string, jinak true.

`destroy()` - Nastaví stavy všech herců do původního "stavu".

`setSlideState(actor: AbstractActor, state: Object)` - Metoda volána algoritmem, která nastaví stav herci u konkrétního snímku. 

`makeSnapShot(duration: number, text: string)` - Vezme všechny stavy uložené metodou `setSlideState` a vytvoří jejich kopii a tak udělá snímek. `duration` určuje délku snímku v milisekundách a `text` je jen pomoc pro nastavení stavu pro `HintActor`, který zobrazuje informativní text.

*Pracuje se pouze s těmi parametry stavu, které byly v průběhu algoritmu upravovány. Pokud se tedy například nenastavoval stav `text`, nebude předán ani do `setState` u jednotlivých herců a nezpůsobí zbytečnou logiku na obsluhu.*

`getNumberOfSlides(): number` - Vrátí počet snímků.

`getSlideTime(n: number): number` - Vrátí čas konkrétního snímku.

`drawSlide(n: number)` - Vyvolá konkrétní snímek, tedy nastaví všem hercům stav, který byl zkopírován v algoritmu během n-tého volání funkce `makeSnapShot`.


### `Board`
Třída řídící všechny herce, obsahuje pole všech herců a pravidelně na nich volá metodu `knock`. Odchytává akce myší na plátně a vytváří nové vrcholy a hrany.

`registerActor<T extends AbstractActor>(actor: T)` - Zaregistruje herce, tedy si ho přidá do pole a pravidelně volá `knock`, nebo ho předá presenteru při algoritmu.

`registerVertex(vertexActor: VertexActor)` - Speciálně zaregistruje vrchol.

`unregisterActor(actor: AbstractActor)` - Přestane herce obnovovat a smaže jej z pole.

*Pozn.: Pro odstranění herce stačí zavolat na herci metodu `remove`, ta zařídí animaci vymizení a až pak se sama odregistruje. Kdyby se toto provedlo v opačném pořadí, animace by neproběhla, protože by již nebyla volána metoda `knock`.*

Dále obsahuje metody jako `removeEdgeActor`, `removeVertexActor`. V případě druhé se smažou i příslušné hrany a zařídí se, aby vrchol stále nebyl zvolený.

### `Wave`
Jednoduchá třída generující jednorozměrný spojitý šum, který se využívá na pohyb vrcholů v grafu.

`getNextValue(time: number)` - Jediná veřejná metoda, která vrátí hodnotu šumu na základě času od posledního volání, lze ji tedy napojit přímo na funkci `knock` u herců.


### `AbstractAlgorithm`
Předek všech algoritmů, obsahuje metody, jež by každý algoritmus měl mít.

`static getName(): string` - Vrátí název algoritmu.

`static getDescription(): string` - Vrátí popis algoritmu.

`static requireSelectVertex(): requireSelectVertexInformationInterface[]` - Některé algoritmy vyžadují zvolit několik vrcholů, aby mohly správně fungovat. Funkce vrací pole s objekty obsahující `text`, který se zobrazí při vybírání vrcholu a `state`, který po vybrání zvoleného nastaví tomuto vrcholu následující stav. Jakmile uživatel všechny vrcholy popořadě vybere, jsou přístupné pod `this.presenter.selected`.

`check(): boolean|string` - V této metodě by si měl algoritmus ověřit, zda je vše připraveno a zda je vše korektní, pak vrátí `true`, v opačném případě chybovou hlášku.

`run()` - Spustí algoritmus. Ten by během své práce měl minimálně volat `this.presenter.setSlideState` a `this.presenter.makeSnapShot`. Nesmí nastavovat stav přímo přes `actor.setState`, protože by se projevil ihned.

#### Podporované algoritmy
Jednotlivé třídy implementují algoritmus grafových algoritmů. Obvykle obsahují pomocné metody, například na ukládání proměnných do hran a vrcholů, protože jediná informace o struktuře grafu je obsažena v hercích a stavech herců.

* `BoruvkasAlgorithm` - Borůvkův algoritmus
* `FordFulkersonAlgorithm` - Fordův-Fulkersonův algoritmus
* `DijkstrasAlgorithm` - Dijkstrův algoritmus

### `Application`
Třída zajišťující obsluhu dalších prvků aplikace a odchytávání událostí od uživatele a registrování prvků.

#### Algoritmus
Algoritmus se spustí zavoláním `runAlgorithm(Algorithm)` kde `Algorithm` je třída rozšiřující `AbstractAlgorithm`. Zavoláním se zinicializují všechny potřebné prvky, zakáže se editování grafu, přepnou se panely, ověří se, zda algoritmus nevrátil chybu, zda nepotřebuje vybrat výchozí vrchol a podobně. Zrušení algoritmu se obslouží zavoláním `stopAlgorithm()`.

#### Obsluha GUI
Se děje převážně v konstruktoru a dále ve funkcích `openVertexPanel()`, `openEdgePanel()` apod, které se starají o přepínání panelů.

#### Obsluha prezentace
Protože třída `Presenter` dokáže vyvolat jen konkrétní snímek, je zde potřeba vyřešit automatické přepínání snímků a obsluhu stránkování.

`playPauseUpdated()` je volána při zásazích do přehrávání prezentace a nastavuje časovač na přepnutí na nový snímek.

`setSlide(n: number)` nastaví konkrétní snímek prezentace s tím, že aktualizuje slider, časovač a ostatní potřebné věci.

---

`cloneObject<T>(obj: T): T` - Pomocná metoda pro vytvoření kopie objektu, aby úprava kopie neovlivnila zdroj. Využívá se při vytváření snímku, kde je potřeba vytvořit kopii stavu.

`loadGraphFromData(data: GraphStructureInterface)` - Vytvoří graf z poměrně jednoduché struktury. Využívá se při spuštění aplikace.
