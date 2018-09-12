import {Board, SpecialActorsObjectInterface} from "./Board";
import {AbstractActor} from "./actors/AbstractActor";
import {AbstractAlgorithm} from "./algorithm/AbstractAlgorithm";
import {Application} from "./Application";

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


export class Presenter {
    private board: Board;

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
     * Create a new presentation, needs list of Actors
     * @param board
     * @param actors
     * @param Algorithm
     */
    public constructor(board: Board, actors: AbstractActor[], specialActors: SpecialActorsObjectInterface, Algorithm: AlgorithmClassInterface<AbstractAlgorithm>) {
        this.board = board;
        this.actors = actors;
        this.specialActors = specialActors;

        //Set default state to all added actors
        for (let key in this.actors) {
            let n = this.actors[key].actorID = Number(key);

            //this.states[n] = this.actors[key].getState();
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
}