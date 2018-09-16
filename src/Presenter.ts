import {Board, SpecialActorsObjectInterface} from "./Board";
import {AbstractActor} from "./actors/AbstractActor";
import {AbstractAlgorithm} from "./algorithm/AbstractAlgorithm";
import {Application} from "./Application";
import {VertexActor} from "./actors/VertexActor";

interface SlideInterface {
    duration: number,
    text: string,
    states: Object[],
}

interface AlgorithmClassInterface<T extends AbstractAlgorithm> {
    new (): T;
}

interface ActorClassInterface<T extends AbstractActor> {
    new (): T;
}

/**
 * This class manages presentation, changing slides and creating them.
 * Its called with Class, which extends AbstractAlgorithm.
 */
export class Presenter {
    /**
     * Every presenter is connected to Board
     */
    public board: Board;

    /**
     * All the actors that will be presented
     * Accessible for algorithm object
     */
    public actors: AbstractActor[] = [];

    /**
     * Special actors eg background
     */
    public specialActors: SpecialActorsObjectInterface;

    /**
     * Some algorithms require to select VertexActor before their work
     * Readable for algorithm object
     */
    public selected: VertexActor = null;

    /**
     * This variable stores states of all the actors during work of algorithm
     */
    private states: object[] = [];

    /**
     * Every presenter is connected to an algorithm
     */
    private algorithm: AbstractAlgorithm;

    /**
     * All the slides
     */
    private slides: SlideInterface[] = [];

    /**
     * Default states
     * In the slides and states variables are only stored changes,
     * so before the "change" is applied, first is merged with default state.
     * The defaultStates does not contain full state of the object before
     * the presentation, but only properties, which will be changed during it.
     * Therefore some properties of state, such as position, will not be changed.
     */
    private defaultStates: object[] = [];

    /**
     * Create a new presentation, needs list of Actors
     * @param board
     * @param Algorithm
     */
    public constructor(board: Board, Algorithm: AlgorithmClassInterface<AbstractAlgorithm>) {
        this.board = board;
        this.actors = board.actors;
        this.specialActors = board.specialActors;

        // Set default state to all added actors
        for (let key in this.actors) {
            let n = this.actors[key].actorID = Number(key);

            this.states[n] = {};
        }

        // Creates new Algorithm
        this.algorithm = new Algorithm();
        this.algorithm.presenter = this;
    }

    /**
     * Creates a new snapshot of all actors set by methods in this class
     * @param duration
     * @param text
     */
    public makeSnapShot(duration: number, text: string): void {
        this.setSlideState(this.specialActors.hint, {text: text});
        this.slides.push({
            duration: duration,
            text: text, // Todo resolve
            states: Application.cloneObject(this.states),
        });
    }

    /**
     * Prepare everything needed for algorithm
     * Returns true, if everything is ok, otherwise error string
     */
    public prepare(): boolean|string {
        // Tries to prepare everything to work
        let result = this.algorithm.check();


        if (result !== true) {
            return result
        }

        // Run the algorithm
        this.algorithm.run();

        // Set default states
        this.defaultStates = Application.cloneObject(this.states); // Make a copy
        for (let x in this.states) {
            for (let y in this.states[x]) {
                this.defaultStates[x][y] = this.actors[x].getState(y);
            }
        }

        return true;
    }

    /**
     * Destroys algorithm and return everything as it was before it
     */
    public destroy(): void {
        // Set default values
        for (let i in this.defaultStates) {
            this.actors[i].setState(this.defaultStates[i]);
        }
    }

    /**
     * Return number of slides
     */
    public getNumberOfSlides(): number {
        return this.slides.length;
    }

    /**
     * Return the time to get to next slide
     */
    public getSlideTime(n: number): number {
        return this.slides[n].duration;
    }

    /**
     * Draws specific slide
     * @param n
     */
    public drawSlide(n: number): void {
        for (let i in this.slides[n].states) {
            this.actors[i].setState({...this.defaultStates[i], ...this.slides[n].states[i]});
        }
    }

    /**
     * Set state to actor in presentation
     * Instead of setting state directly, use this function to set state for actual slide
     * @param actor
     * @param state
     */
    public setSlideState(actor: AbstractActor, state: Object) {
        // Set new state
        this.states[actor.actorID] = {...this.states[actor.actorID], ...state};
    }

    /**
     * Returns state of Actor
     * @param actor
     */
    public getSlideState(actor: AbstractActor) {
        return this.states[actor.actorID];
    }

    /**
     * HELPER FUNCTIONS
      */

    /**
     * Function that copy full state from earlier snapshots
     * @param snapshotRelative -1 is the last snapshotted slide
     */
    public copyState(snapshotRelative: number) {
        this.states = Application.cloneObject(this.slides[this.slides.length + snapshotRelative].states);
    }

    /**
     * Goes through all the Actors and select only specified by ActorClass
     * @param ActorClass
     * @param callback
     */
    public forAllActors<T extends AbstractActor>(ActorClass: ActorClassInterface<T>, callback: <T extends AbstractActor>(actor: T) => void) {
        for (let actor of this.actors) {
            if (actor instanceof ActorClass) {
                callback(actor);
            }
        }
    }

    /**
     * Sets state to all the actors instance of ActorClass
     * @param ActorClass
     * @param state
     */
    public setSlideStateForAllActors<T extends AbstractActor>(ActorClass: ActorClassInterface<T>, state: Object) {
        this.forAllActors(ActorClass, (actor) => {
            this.setSlideState(actor, state);
        });
    }
}
