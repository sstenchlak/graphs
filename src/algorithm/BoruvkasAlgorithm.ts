import {AbstractAlgorithm} from "./AbstractAlgorithm";
import {EdgeActor} from "../actors/EdgeActor";

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
        // nothing
    }
}