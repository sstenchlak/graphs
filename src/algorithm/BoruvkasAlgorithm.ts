import {AbstractAlgorithm} from "./AbstractAlgorithm";
import {EdgeActor} from "../actors/EdgeActor";
import {BackgroundActor} from "../actors/BackgroundActor";
import {VertexActor} from "../actors/VertexActor";

// Additional variable stored with VertexActors and EdgeActors
interface VertexEdgeVariable {
    connectedComponentID: number|null;
}

export class BoruvkasAlgorithm extends AbstractAlgorithm {
    /**
     * Returns algorithm's name
     */
    public static getName() {
        return "Borůvkův algoritmus";
    }

    /**
     * Returns algorithm's description
     */
    public static getDescription() {
        return "Borůvkův algoritmus je algoritmus pro nalezení minimální kostry v grafu, jehož hrany mají různé (prosté) a kladné ohodnocení.";
    }

    /**
     * If algorithm requires to select vertex (for example as a root)
     */
    public static requireSelectVertex(): false|string {
        return false;
    }

    private vertexEdgeVariables: VertexEdgeVariable[] = [];

    private var(actor: VertexActor|EdgeActor, setValue?: VertexEdgeVariable) {
        if (setValue) this.vertexEdgeVariables[actor.actorID] = setValue;
        return this.vertexEdgeVariables[actor.actorID];
    }

    private mergeTwoComponents(vertex: VertexActor, edge: EdgeActor): boolean {
        let search = this.var(vertex).connectedComponentID;
        let replacement = this.var(this.getAnotherVertex(vertex, edge)).connectedComponentID;
        this.presenter.forAllActors(VertexActor, <VertexActor>(vertex) => {
            if (this.var(vertex).connectedComponentID === search) {
                this.var(vertex).connectedComponentID = replacement;
            }
        });
        this.presenter.forAllActors(EdgeActor, <EdgeActor>(edge) => {
            if (this.var(edge).connectedComponentID === search) {
                this.var(edge).connectedComponentID = replacement;
            }
        });

        this.var(edge).connectedComponentID = replacement;

        return search !== replacement;
    }

    private getAnotherVertex(vertex: VertexActor, edge: EdgeActor): VertexActor {
        return edge.vertices[edge.vertices[0] == vertex ? 1 : 0];
    }

    /**
     * Checks if everything is ok
     */
    public check(): boolean|string {
        // Check if all edges have value
        for (let actor of this.presenter.actors) {
            if (!(actor instanceof EdgeActor))
                continue;

            if (typeof actor.getState('text') !== 'number') {
                // Error, all the edges must have set number
                return "Nastavte prosím všem hranám nějakou hodnotu!";
            }

            if (Number(actor.getState('text')) < 0) {
                // Error, all the edges must have set non-negative number
                return "Borůvkův algoritmus funguje pouze, kdež má nezáporné hrany!";
            }

            if (actor.getState('arrows')[0] || actor.getState('arrows')[1]) {
                // Error, all the edges must have set non-negative number
                return "Borůvkův algoritmus nemá smysl při orientovaných hranách. Než budete pokračovat, odstraňte prosím orientované hrany!";
            }
        }

        return true;
    }

    public run() {
        // Helper variables and initialization
        let noComponents = 0;
        this.presenter.forAllActors(VertexActor, <VertexActor>(vertex) => {
            this.var(vertex, {
                connectedComponentID: noComponents++,
            });
        });

        this.presenter.forAllActors(EdgeActor, <EdgeActor>(edge) => {
            this.var(edge, {
                connectedComponentID: null,
            });
        });

        // Set background to red
        this.presenter.setSlideState(this.presenter.specialActors.background, {colors: BackgroundActor.COLORS_RED()});

        this.presenter.makeSnapShot(8000, "Borůvkův algoritmus je grafový algoritmus pro hledání minimální kostry, tedy stromu, který obsahuje všechny vrcholy grafu a součet všech jeho hran je nejmenší možný.");

        this.presenter.setSlideStateForAllActors(EdgeActor, {opacity: 0.2});

        this.presenter.makeSnapShot(8000, "Začněme tím, že máme pouze samostatné vrcholy, které nejsou spojené hranami. De facto máme " + noComponents.toString() + " stromů, které obsahují pouze jeden vrchol.");

        this.presenter.makeSnapShot(5000, "Pro každý z  " + noComponents.toString() + " stromů přidáme do výsledného lesu hranu, která spojuje jeden vrchol z konkrétního stromu se zbytkem grafu tak, aby tato hrana byla nejmenší. Šipkou naznačíme směr, který strom si vybral který vrchol.");

        let i = 0;
        let toMerge = [];
        this.presenter.forAllActors(VertexActor, <VertexActor>(vertex) => {
            this.presenter.setSlideState(vertex, {size: 1, stroke: [0, 0, 0]});

            let sm = this.findEdgeWithLowestValueInComponent(i++);

            toMerge.push({
                vertex: vertex,
                sm: sm
            });

            this.presenter.setSlideState(sm, {opacity: 1, color: [0, 0, 0], arrows: {[(sm.vertices[0] === vertex ? 1 : 0)]: 1}});
            this.presenter.makeSnapShot(3000, "Z každého vrcholu tedy najdeme nejmenší hranu.");

            this.presenter.setSlideState(vertex, {size: 1, stroke: [255, 255, 255]});
            this.presenter.setSlideState(sm, {color: [255, 255, 255]});
        });

        for (let edgeToMerge of toMerge) {
            if (this.mergeTwoComponents(edgeToMerge.vertex, edgeToMerge.sm)) {
                noComponents--;
            }
        }

        this.presenter.makeSnapShot(5000, "Prošli jsme všechny vrcholy grafu a ke každému jsme nalezli nejmenší hranu. Tímto se některé vrcholy pospojovaly do stromů a vytvořily tak " + noComponents + " komponent souvilosti.");

        let visitedComponents: number[] = [];
        this.presenter.forAllActors(VertexActor, <VertexActor>(vertex) => {
            if (visitedComponents.indexOf(this.var(vertex).connectedComponentID) !== -1)
                return;

            let searchFor = this.var(vertex).connectedComponentID;

            visitedComponents.push(searchFor);

            this.highlightComponent(searchFor, true);

            this.presenter.makeSnapShot(3000, visitedComponents.length.toString() + ". komponenta souvislosti.");
        });

        this.highlightComponent(null, false);

        while (noComponents !== 1) {
            this.presenter.makeSnapShot(5000, "Protože se stále nevytvořil jediný strom, ale máme " + noComponents.toString() + (noComponents <= 4 ? " komponenty souvislosti" : " komponent souvislostí") + " budeme pokračovat v napojování hran. Od každé komponenty souvislosti najdeme libovolnou nejmenší hranu spoující vrchol z dané komponenty s vrcholem, který v komponentě neleží. Tak se určitě dvě komponenty spojí do jené a počet komponent se sníží o jedna.");

            let visitedComponents: number[] = [];
            let toMerge = [];
            this.presenter.forAllActors(VertexActor, <VertexActor>(vertex) => {
                if (visitedComponents.indexOf(this.var(vertex).connectedComponentID) !== -1)
                    return;

                let searchFor = this.var(vertex).connectedComponentID;

                visitedComponents.push(searchFor);

                this.highlightComponent(searchFor, false);

                // Search for edge with lowest value and its Vertex
                let newEdge = this.findEdgeWithLowestValueInComponent(searchFor);
                let responsibleVertex = newEdge.vertices[(this.var(newEdge.vertices[0]).connectedComponentID === searchFor ? 0 : 1)];

                toMerge.push({
                    vertex: responsibleVertex,
                    sm: newEdge
                });

                this.presenter.setSlideState(newEdge, {opacity: 1, color: [0, 0, 0], arrows: {[(newEdge.vertices[0] === responsibleVertex ? 1 : 0)]: 1}});
                this.presenter.setSlideState(responsibleVertex, {stroke: [0, 0, 0]});

                this.presenter.makeSnapShot(5000, "V " + visitedComponents.length.toString() + ". komponentě souvislosti jsme našli černou hranu, která má jeden vrchol v ní, ale druhý ne a její hodnota je nejmenší. Tuto hranu přidáme do výsledného grafu a pokračujeme dále.");
            });

            for (let edgeToMerge of toMerge) {
                if (this.mergeTwoComponents(edgeToMerge.vertex, edgeToMerge.sm)) {
                    noComponents--;
                }
                this.presenter.setSlideState(edgeToMerge.vertex, {stroke: [255, 255, 255]});
                this.presenter.setSlideState(edgeToMerge.sm, {color: [255, 255, 255]});
            }

            this.highlightComponent(null, false);

            this.presenter.makeSnapShot(5000, "Do grafu jsme přidali několik hran.");
        }

        this.highlightComponent(null, false);
        this.presenter.setSlideState(this.presenter.specialActors.background, {colors: BackgroundActor.COLORS_GREEN()});
        this.presenter.setSlideStateForAllActors(EdgeActor, {arrows: [0, 0]});
        this.presenter.makeSnapShot(5000, "Nyní se spojily poslední komponenty souvislosti a všechny vrcholy jsou spojeny jedním stromem, který tvoří kostru tohoto grafu jež je současně minimální.");
    }

    private highlightComponent(componentID: number|null, enlargeVertices: boolean) {
        // Highlight all the vertices in componentID component ID
        this.presenter.forAllActors(VertexActor, <VertexActor>(vertex) => {
            if ((componentID !== null && this.var(vertex).connectedComponentID) === componentID || (componentID === null && this.var(vertex).connectedComponentID !== null)) {
                this.presenter.setSlideState(vertex, {size: (enlargeVertices ? 1.5 : 1), opacity: 1});
            } else {
                this.presenter.setSlideState(vertex, {size: 1, opacity: .2});
            }
        });

        // Highlight all the edges in componentID component ID
        this.presenter.forAllActors(EdgeActor, <EdgeActor>(edge) => {
            if ((componentID !== null && this.var(edge).connectedComponentID) === componentID || (componentID === null && this.var(edge).connectedComponentID !== null)) {
                this.presenter.setSlideState(edge, {opacity: 1});
            } else if (this.var(edge).connectedComponentID !== null) {
                this.presenter.setSlideState(edge, {opacity: .4});
            } else {
                this.presenter.setSlideState(edge, {opacity: .1});
            }
        });
    }

    private findEdgeWithLowestValueInComponent(componentID: number): EdgeActor {
        let sm: EdgeActor = null;

        this.presenter.forAllActors(EdgeActor, <EdgeActor>(edge) => {
            let a = this.var(edge.vertices[0]).connectedComponentID === componentID;
            let b = this.var(edge.vertices[1]).connectedComponentID === componentID;

            if (a ? !b : b) { // a XOR b
                if (!sm || Number(sm.getState('text')) > Number(edge.getState('text'))) {
                    sm = edge;
                }
            }
        });

        return sm;
    }
}