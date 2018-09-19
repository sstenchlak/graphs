/**
 * This class represents one algorithm and its purpose is to prepare state for actors
 */
import {Presenter} from "../Presenter";
import {VertexActor} from "../actors/VertexActor";
import {EdgeActor} from "../actors/EdgeActor";

export interface requireSelectVertexInformationInterface {
    text: string;
    state: Object;
}

export abstract class AbstractAlgorithm {
    // abstract static getName(): string;
    // abstract static getDescription(): string;

    public presenter: Presenter;

   /**
     * Checks if everything is correct to run the algorithm
     * @return boolean|string true if success, error message if fail
     */
    public abstract check(): boolean|string;

    /**
     * Runs the logic
     */
    public abstract run();
}