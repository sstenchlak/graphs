import {AbstractAlgorithm} from "./AbstractAlgorithm";
import {EdgeActor} from "../actors/EdgeActor";
import {BackgroundActor} from "../actors/BackgroundActor";

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
     * Run Dijkstra's algorithm
     */
    public run(): void {
        this.presenter.setSlideState(this.presenter.specialActors.background, {colors: BackgroundActor.COLORS_RED()});
        this.presenter.makeSnapShot(2000, "Dijkstrův algoritmus v cervenem pozadi :P");

        this.presenter.setSlideState(this.presenter.specialActors.background, {colors: BackgroundActor.COLORS_GREEN()});
        this.presenter.makeSnapShot(2000, "Dijkstrův algoritmus v zelenem pozadi :P");
    }

}