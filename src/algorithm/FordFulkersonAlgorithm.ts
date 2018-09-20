import {AbstractAlgorithm, requireSelectVertexInformationInterface} from "./AbstractAlgorithm";
import {BackgroundActor} from "../actors/BackgroundActor";
import {EdgeActor} from "../actors/EdgeActor";
import {VertexActor} from "../actors/VertexActor";

interface EdgeVariable {
    value: number;
    max: number;
}

export class FordFulkersonAlgorithm extends AbstractAlgorithm{
    readonly EDGE_MIN_OP = .2;

    /**
     * Returns algorithm's name
     */
    public static getName() {
        return "Fordův-Fulkersonův algoritmus";
    }

    /**
     * Returns algorithm's description
     */
    public static getDescription() {
        return "Algoritmus počítající maximální tok v síti. Vyberou se dva body, zdroj a stok a algoritmus najde maximální tok, obrazně řečeno kolik materiálu lze transportovat ze zdroje do stoku pomocí hran, jež mají omezení na množství, které lze jimi transportovat. ";
    }

    /**
     * Simple system for storing variables in Actors
     */
    private vertexVariables: EdgeVariable[] = [];

    private var(actor: EdgeActor, setValue?: EdgeVariable) {
        if (setValue) this.vertexVariables[actor.actorID] = setValue;
        return this.vertexVariables[actor.actorID];
    }

    private flow: number = 0;

    /**
     * If algorithm requires to select vertex (for example as a root)
     */
    public static requireSelectVertex(): requireSelectVertexInformationInterface[] {
        return [
            {
                text: "Vyberte prosím vrchol, který bude sloužit jako zdroj.",
                state: {text: "Z", color: [255, 65, 54], stroke: [255, 65, 54], size: 1.5}
            },
            {
                text: "Nyní prosím vyberte jiný vrchol, který bude sloužit jako stok.",
                state: {text: 0, color: [255, 65, 54], stroke: [255, 65, 54], size: 1.5}
            }
        ];
    }

    check(): boolean | string {
        return true;
    }

    run() {
        // Set default values
        this.presenter.forAllActors(EdgeActor, <EdgeActor>(actor) => {
            this.var(actor, {
                value: 0,
                max: Number(actor.getState('text'))
            });
        });

        this.presenter.setSlideState(this.presenter.specialActors.background, {colors: BackgroundActor.COLORS_GREEN()});

        this.presenter.makeSnapShot(5000, "Byl zvolen zdroj a stok. Ve stoku se již automaticky ukazuje prozatimní tok, který je aktuálně nulový.");

        this.updateEdgeValues();

        this.presenter.makeSnapShot(8000, "Zatím žádnou hranou nic neteče, proto byly všechny nastaveny také na nulu.");

        this.presenter.makeSnapShot(8000, "Ukážeme si pouze základní verzi algoritmu, kdy se nebudeme zatěžovat algoritmem na hledání nenasycené cesty. Předpokládejme, že takovou cestu umíme vždy najít, pokud existuje. Nasycené hrany a cesty budou zobrazeny černě");

        this.presenter.setSlideState(this.presenter.specialActors.background, {colors: BackgroundActor.COLORS_RED()});

        let delta;
        while (true) {
            let edges = [];
            let vertices = [this.presenter.selected[0]];
            delta = this.findSomePathThatIsBetter(this.presenter.selected[0], vertices, edges);

            if (!delta) break;

            this.presenter.setSlideStateForAllActors(EdgeActor, {opacity: .1});
            this.presenter.setSlideStateForAllActors(VertexActor, {opacity: .1});

            for (let i in edges) {
                this.presenter.setSlideState(edges[i], {opacity: 1, arrows: [0,0]});
                this.presenter.setSlideState(vertices[i], {opacity: 1});
            }
            this.presenter.setSlideState(this.presenter.selected[1], {opacity: 1});

            this.presenter.makeSnapShot(5000, "Nalezli jsme cestu, kterou lze vylepšit o <b>" + delta + "</b>. Rozdíl jsme zjistili tak, že každou hranu lze vylepšit jen o nějakou maximální hodnotu. Z těchto hodnot byla vybrána ta nejmenší, protože tou můžeme určitě navýšit všechny hrany.");


            for (let i in edges) {
                this.presenter.setSlideState(edges[i], {size: 1});
                this.var(edges[i]).value += (this.getDirection(edges[i], vertices[i]) ? 1 : -1) * delta;
            }
            this.updateEdgeValues();

            this.flow += delta;
            this.presenter.setSlideState(this.presenter.selected[1], {text: this.flow});

            this.presenter.makeSnapShot(5000, "U všech hran se tedy tok ve směru zvýšil o <b>" + delta + "</b>.");
        }

        this.presenter.makeSnapShot(8000, "Už neexistuje žádná cesta, kterou by bylo možné vylepšit. Algoritmus tedy končí, nalezl maximální tok <b>" + this.flow + "</b>.");

    }

    private updateEdgeValues() {
        this.presenter.forAllActors(EdgeActor, <EdgeActor>(edge)=>{
            let v = this.var(edge).value;
            let m = this.var(edge).max;
            this.presenter.setSlideState(edge, {text: Math.abs(v) + "/" + m, opacity: (1-this.EDGE_MIN_OP)*(Math.abs(v)/m) + this.EDGE_MIN_OP, color: Math.abs(v) === m ? [0, 0, 0] : [255, 255, 255], arrows: [v < 0 ? 1 : 0, v > 0 ? 1 : 0]});
        });
    }

    private findSomePathThatIsBetter(from: VertexActor, visited: VertexActor[], edges: EdgeActor[]): number {
        for (let edge of from.connectedEdgeActors) {
            let another = this.getAnotherVertex(edge, from);
            let delta = this.var(edge).max - (this.getDirection(edge, from) ? 1 : -1) * this.var(edge).value;

            if (visited.indexOf(another) === -1 && delta > 0) {
                visited.push(another);
                edges.push(edge);
                if (another === this.presenter.selected[1]) {
                    return delta;
                }
                let res = this.findSomePathThatIsBetter(another, visited, edges);
                if (res) {
                    return Math.min(res, delta);
                }

                visited.splice(-1,1);
                edges.splice(-1,1);
            }
        }
        return 0;
    }

    private getAnotherVertex(edge: EdgeActor, vertex: VertexActor): VertexActor {
        return edge.vertices[this.getDirection(edge, vertex) ? 1 : 0];
    }

    private getDirection(edge: EdgeActor, vertex: VertexActor): boolean {
        return edge.vertices[0] === vertex;
    }


}