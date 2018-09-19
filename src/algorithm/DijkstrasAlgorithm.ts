import {AbstractAlgorithm, requireSelectVertexInformationInterface} from "./AbstractAlgorithm";
import {EdgeActor} from "../actors/EdgeActor";
import {BackgroundActor} from "../actors/BackgroundActor";
import {VertexActor} from "../actors/VertexActor";
import {AbstractActor} from "../actors/AbstractActor";

interface VertexVariable {
    h: number|null; // value
    p: EdgeActor; // predecessor
}

export class DijkstrasAlgorithm extends AbstractAlgorithm{
    /**
     * Returns algorithm's name
     */
    public static getName() {
        return "Dijkstrův algoritmus";
    }

    /**
     * Returns algorithm's description
     */
    public static getDescription() {
        return "Dijkstrův algoritmus je algoritmus sloužící k nalezení nejkratší cesty v grafu. Funguje nad hranově kladně ohodnoceným grafem (neohodnocený graf lze však na ohodnocený snadno převést).";
    }

    /**
     * If algorithm requires to select vertex (for example as a root)
     */
    public static requireSelectVertex(): requireSelectVertexInformationInterface[] {
        return [{
            text: "Dijkstrův algoritmus se spouští z jednoho vrcholu, odkud poté prohledává celý graf pomocí napojených hran. Vyberte tedy prosím jeden vrchol, odkud se má začít",
            state: {}
        }];
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
                return "Dijkstrův algoritmus funguje pouze, kdež má nezáporné hrany!";
            }
        }

        return true;
    }

    /**
     * Simple system for storing variables in Actors
     */
    private vertexVariables: VertexVariable[] = [];

    private var(actor: VertexActor, setValue?: VertexVariable) {
        if (setValue) this.vertexVariables[actor.actorID] = setValue;
        return this.vertexVariables[actor.actorID];
    }

    /**
     * Run Dijkstra's algorithm
     */
    public run(): void {
        this.presenter.setSlideState(this.presenter.specialActors.background, {colors: BackgroundActor.COLORS_RED()});

        this.presenter.makeSnapShot(8000, "Dijkstrův algoritmus slouží pro hledání nejkratších cest z vybraného vrcholu do ostatních. U každého vrcholu udržuje nejkratší dosaženou vzdálenost, která je z počátku nastavená na nekonečno, to znamená, že do daného vrcholu nevede cesta, neboť ještě nebyla nalezena.");

        this.presenter.setSlideStateForAllActors(VertexActor, {opacity: 0.2, text: '∞'});
        this.presenter.setSlideStateForAllActors(EdgeActor, {opacity: 0.2});
        this.presenter.forAllActors(VertexActor, <VertexActor>(actor) => {
            this.var(actor, {
                p: null,
                h: null,
            });
        });

        this.presenter.setSlideState(this.presenter.selected[0], {opacity: 1, text: 0});
        this.var(<VertexActor>this.presenter.selected[0]).h = 0;

        this.presenter.makeSnapShot(5000, "Vrcholy mají také 3 stavy. Nenalezené - ty zobrazujeme nevýrazně, otevřené - ty jsou bílé a uzavřené, ty budou černě orámovány. Ze začátku je tedy pouze počáteční vrchol otevřený.");

        let queue: VertexActor[] = [<VertexActor>this.presenter.selected[0]];

        // Main cycle
        while (queue.length) {
            // Takes Vertex with lowest value
            let actualVertex = queue.shift();

            // Mark it
            this.presenter.setSlideState(actualVertex, {size: 1.5});

            // Opacity to all edges
            for (let x of actualVertex.connectedEdgeActors) {
                this.presenter.setSlideState(x, {opacity: 1});
            }

            // Create slide with text depending on count of remaining open vertices
            if (queue.length === 0) {
                this.presenter.makeSnapShot(5000, "Je otevřený jeden vrchol. Ten tedy vebereme a budeme hledat z něj.");
            } else {
                this.presenter.makeSnapShot(5000,
                    (queue.length + 1).toString() +
                    (queue.length <= 3 ? " vrcholy jsou otevřené." : " vrcholů je otevřených.") +
                    " Vebereme tedy ten s nejmenší hodnotou (" + this.var(actualVertex).h + ") a hledáme z něj."
                );
            }




            let text = "Sousední vrcholy, které byly uzavřené otevřeme a nastavíme jim hodnotu rovnou hodnotě aktuálního vrcholu + hodnotě hrany. Pokud byl nějaký vrchol již otevřen a měl by dostat hodnotu menší, než má aktuální, tak ji aktualizujeme.";

            // For every edge connected to it
            for (let edge of actualVertex.connectedEdgeActors) {
                let edgeValue = this.getEdgeValueByOrientation(actualVertex, edge);
                if (edgeValue) {
                    let anotherVertex = this.getAnotherVertex(actualVertex, edge);
                    let anotherVertexProperties = this.var(anotherVertex);

                    this.presenter.setSlideState(anotherVertex, {size: 1.3});

                    let distance = this.var(actualVertex).h + edgeValue;
                    if (anotherVertexProperties.h===null) {
                        // Not discovered
                        this.presenter.setSlideState(anotherVertex, {opacity: 1, text: distance});
                        this.presenter.setSlideState(edge, {color: [0, 0, 0]});

                        this.var(anotherVertex).h = distance;
                        this.var(anotherVertex).p = edge;

                        queue.push(anotherVertex);

                        this.presenter.makeSnapShot(5000, "Nalezli jsme nový vrchol, který byl předtím neotevřený. Nastavíme mu hodnotu " + this.var(actualVertex).h + " + " + edgeValue + " jakožto součet hodnoty výchozího vrcholu a hrany, přes kterou se lze k vrcholu dostat. Vrchol má tedy hodnotu " + distance + " a je považován za otevřený.");

                    } else if (anotherVertexProperties.h > distance) {
                        // Shorter path
                        this.presenter.setSlideState(this.var(anotherVertex).p, {color: [255, 255, 255]});

                        this.presenter.setSlideState(anotherVertex, {text: distance});
                        this.presenter.setSlideState(edge, {color: [0, 0, 0]});

                        this.var(anotherVertex).h = distance;
                        this.var(anotherVertex).p = edge;
                        this.presenter.makeSnapShot(8000, "Nyní jsme přišli k vrcholu, který je otevřený a má hodnotu " + anotherVertexProperties.h + ". Ta je ale větší, než hodnota, kterou by dostal, kdyby procházel přes aktuální vrchol. Proto jeho hodnotu aktualizujeme na " + distance + " a upravíme hranu, odkud jsme se k němu dostali.");
                    } else {
                        this.presenter.makeSnapShot(3000, "Cesta k tomuto vrcholu by byla delší, proto není třeba s tímto vrcholem nic dělat.");
                    }

                    this.presenter.setSlideState(anotherVertex, {size: 1});
                }
            }

            this.presenter.setSlideState(actualVertex, {stroke: [0,0,0], size: 1});
            this.presenter.makeSnapShot(5000, "Prošli jsme všechny hrany spojené s aktuálním vrcholem. Můžeme ho tedy uzavřít.");

            queue.sort((a,b)=>{return this.var(a).h - this.var(b).h});


        }

        this.presenter.setSlideState(this.presenter.specialActors.background, {colors: BackgroundActor.COLORS_GREEN()});
        this.presenter.makeSnapShot(2000, "Dijkstrův algoritmus tedy dokončil svou práci. U všech dosažitelných vrcholů vrátil délku nejratší cesty a pomocí černých hran lze tuto cestu zrekonstruovat.");
    }

    private getEdgeValueByOrientation(vertex: VertexActor, edge: EdgeActor): number|null {
        let a = edge.getState('arrows')[0];
        let b = edge.getState('arrows')[1];

        if (a===0) {
            return Number(edge.getState('text'));
        } else {
            return null;
        }
    }

    private getAnotherVertex(vertex: VertexActor, edge: EdgeActor): VertexActor {
        return edge.vertices[edge.vertices[0] == vertex ? 1 : 0];
    }

}