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

interface ActorAndStateInterface {
    actor: AbstractActor;
    state: Object;
}

interface AlgorithmClassInterface<T extends AbstractAlgorithm> {
    new (): T;
}

interface ActorClassInterface<T extends AbstractActor> {
    new (): T;
}


export class Presenter {
    public board: Board;

    /**
     * All the actors that will be presented
     */
    public actors: AbstractActor[] = [];

    /**
     * Special actors
     */
    public specialActors: SpecialActorsObjectInterface;

    private states: object[] = [];

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
     * Some algorithms require to select VertexActor before their work
     */
    public selected: VertexActor = null;

    /**
     * Create a new presentation, needs list of Actors
     * @param board
     * @param actors
     * @param Algorithm
     */
    public constructor(board: Board, Algorithm: AlgorithmClassInterface<AbstractAlgorithm>) {
        this.board = board;
        this.actors = board.actors;
        this.specialActors = board.specialActors;

        //Set default state to all added actors
        for (let key in this.actors) {
            let n = this.actors[key].actorID = Number(key);

            this.states[n] = {};
        }

        // Creates new Algorithm
        this.algorithm = new Algorithm();
        this.algorithm.presenter = this;
    }

    /**
     * Creates a new snapshot in exactly this state
     * @param duration
     * @param text
     */
    public makeSnapShot(duration: number, text: string): void {
        console.log("Snapshot made: " + text);
        this.setSlideState(this.specialActors.hint, {text: text});
        this.slides.push({
            duration: duration,
            text: text, // Todo resolve
            states: Application.cloneObject(this.states), // Todo make copy
        });
    }

    /**
     * Prepare everything needed
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
     * @param actor
     * @param state
     */
    public setSlideState(actor: AbstractActor, state: Object) {
        // Set new state
        this.states[actor.actorID] = {...this.states[actor.actorID], ...state};
    }


    /**
     * HELPER FUNCTIONS
      */


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