import {Board} from "../Board";
import {Application} from "../Application";

export interface stateUpdaterFunction {
    (oldState, state, newState, progress: number);
}

export interface stateChangeHandlerFunctionInterface {
    (state: object, immediately: boolean): object;
}

/**
 * Everything animated is an actor
 */
export abstract class AbstractActor {
    protected publicInformation: Object = {};

    /**
     * List of functions that are called when public information of
     * the actor are changed. Could be used for handling some changes
     * in position or height.
     */
    protected publicInformationListeners: Function[] = [];

    /**
     * List of functions that are called consecutively and set the state of the
     * actor during the animation. First function is simpleMapState, the others
     * could handle animation of more complex properties of the state object.
     */
    protected stateUpdaters: stateUpdaterFunction[] = [];

    /**
     * List of functions that are called before the main body of the setState
     * is evaluated. Could be used to catch some properties and pass to other actors
     */
    protected stateChangeHandlers: stateChangeHandlerFunctionInterface[] = [];

    /**
     * Each actor has a state, that could be changed to change actors behaviour
     */
    protected state: Object = {};

    /**
     * Helper variables for animating state.
     */
    protected animationNewState: object = {};
    protected animationOldState: object = {};
    protected animationTime: number = 0;
    protected animationInProgress: boolean = false;
    protected animationCallback: Function|null = null;

    /**
     * Each actor must be connected to board.
     */
    protected board: Board;

    /**
     * Helper for Presenter
     */
    public actorID: number;

    public constructor() {
        // Could be overwritten by children
        this.stateUpdaters.push(AbstractActor.simpleMapState);
    }

    /**
     * Every actor must be connected to a board
     * @param board
     */
    public connectTo(board: Board): void {
        this.board = board;
    }

    /**
     * Animates numeric parameters and simply overwrite non-numeric
     * @param oldState
     * @param state
     * @param newState
     * @param progress
     */
    public static simpleMapState(oldState, state, newState, progress: number) {
        for (let index in newState) {
            if (oldState[index] === null)
                state[index] = newState[index];
            else if (typeof oldState[index] === 'object')
                AbstractActor.simpleMapState(oldState[index], state[index], newState[index], progress);
            else if (typeof oldState[index] == 'number' && typeof newState[index] == 'number')
                state[index] = oldState[index] + progress * (newState[index] - oldState[index]);
            else
                state[index] = newState[index];
        }
    }

    /**
     * Tells the actor what to do by setting its new state. E.g.: change position
     * @param state
     * @param immediately
     * @param doNotStopAnimation
     * @param callback
     */
    public setState(state, immediately: boolean = false, doNotStopAnimation: boolean = false, callback: Function = null) {
        for (let stageChangeHandler of this.stateChangeHandlers) {
            state = stageChangeHandler(state, immediately);
        }

        let oldState = Application.cloneObject(this.state);
        let newState = Application.cloneObject(state);
        if (!doNotStopAnimation || !immediately) {
            this.animationInProgress = false;
            newState = {...this.animationNewState, ...newState};
        }
        if (immediately) {
            for (let stateUpdater of this.stateUpdaters) {
                stateUpdater(oldState, this.state, newState, 1);
            }

            this.update();

            if (callback) {
                callback();
            }
        } else {
            this.animationNewState = newState;
            this.animationOldState = oldState;
            this.animationInProgress = true;
            this.animationTime = 0;
            if (callback) {
                this.animationCallback = callback;
            }
        }
    }

    public getPublicInformation() {
        return this.publicInformation;
    }

    public registerPublicInformationListener(callback: Function) {
        this.publicInformationListeners.push(callback);
    }

    protected updatePublicInformation(information) {
        this.publicInformation = {...this.publicInformation, ...information};
        for (let listener of this.publicInformationListeners) {
            listener(this.getPublicInformation());
        }
    }

    /**
     * Updates actors attributes and other properties according to state
     * Called every time state is updated
     * Used for redraw element
     */
    protected abstract update();

    /**
     * Knocking from outside to update animations
     * @param time from last knock
     */
    public knock(time: number): void {
        this.updateStateAnimation(time);
    }

    /**
     * Updates animation progress if exists
     * @param time
     */
    protected updateStateAnimation(time: number): void{
        if (this.animationInProgress) {
            this.animationTime += time;
            if (this.animationTime >= 1) {
                this.animationTime = 1;
            }

            for (let stateUpdater of this.stateUpdaters) {
                stateUpdater(this.animationOldState, this.state, this.animationNewState, Math.min(1, this.animationTime));
            }

            this.update();

            if (this.animationTime === 1) {
                this.animationInProgress = false;
                if (this.animationCallback) {
                    this.animationCallback();
                }
            }
        }
    }

    /**
     * Tries to remove element
     * Call this function for safe delete of the current actor.
     * @param immediately If should be removed immediately or with animation
     */
    abstract remove(immediately: boolean);

    /**
     * Return state (not actual caused by animation, but final)
     * @param value or null
     */
    public getState(value: string|null = null): any {
        if (this.animationInProgress) {
            if (value) {
                return Application.cloneObject({...this.state, ...this.animationNewState}[value]);
            } else {
                return Application.cloneObject({...this.state, ...this.animationNewState});
            }
        } else {
            if (value) {
                return Application.cloneObject(this.state[value]);
            } else {
                return Application.cloneObject(this.state);
            }
        }
    }
}
