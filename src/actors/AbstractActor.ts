import {Board} from "../Board";

export interface stateUpdaterFunction {
    (oldState, state, newState, progress: number);
}

/**
 * Everything animated is an actor
 */
export abstract class AbstractActor {

    protected publicInformation: Object = {};
    protected publicInformationListeners: Function[] = [];

    protected stateUpdaters: stateUpdaterFunction[] = [];
    protected state: Object = {};

    protected animationNewState: object = {};
    protected animationOldState: object = {};
    protected animationTime: number = 0;
    protected animationInProgress: boolean = false;
    protected animationCallback: Function|null = null;

    protected board: Board;

    protected constructor() {
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
            if (typeof oldState[index] === 'object')
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
        let oldState = AbstractActor.cloneObject(this.state);
        let newState = AbstractActor.cloneObject(state);
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
            this.animationCallback = callback;
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
     */
    protected abstract update();

    protected animate () {

    }

    static cloneObject(obj) {
        let clone = {};
        for(let i in obj) {
            if(typeof(obj[i])=="object" && obj[i] != null)
                clone[i] = this.cloneObject(obj[i]);
            else
                clone[i] = obj[i];
        }
        return clone;
    }

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
}
