import {AbstractActor} from "./AbstractActor";
import {Board} from "../Board";

interface TextActorStateInterface {
    text: any;
    x: number;
    y: number;
    color: [number, number, number];
    size: number;
    opacity: number;
}

export interface TextActorPublicInformationInterface {
    width: number;
    height: number;
    set: boolean;
}

export class TextActor extends AbstractActor {
    public element:SVGTextElement;

    protected state:TextActorStateInterface = {
        text: null,
        x: 0,
        y: 0,
        color: [0, 0, 0],
        size: 1,
        opacity: 0 // Default opacity is 0
    };

    public constructor() {
        super();
    }

    connectTo(board: Board): void {
        super.connectTo(board);
        this.element = <SVGTextElement>board.createSVGElement('text');
        this.stateUpdaters.push(TextActor.textActorStateUpdater);
    }

    protected update() {
        this.element.textContent = this.state.text;
        this.element.setAttribute('x', this.state.x.toString());
        this.element.setAttribute('y', this.state.y.toString());
        this.element.setAttribute('fill', 'rgb(' + Math.round(this.state.color[0]) + ',' + Math.round(this.state.color[1]) + ',' + Math.round(this.state.color[2]) + ')');
        this.element.setAttribute('opacity', (this.state.opacity).toString());
        this.element.setAttribute('font-size', (this.state.size * 30).toString());

        let bbox = this.element.getBBox();
        this.updatePublicInformation({
            width: bbox.width ? bbox.width : 0,
            height: bbox.height ? bbox.height : 0,
            set: this.state.text !== null
        });
    }

    /**
     * Should take care about animation of states, that can't be animated easily by increasing number or switching text
     */
    private static textActorStateUpdater(oldState, state, newState, progress) {
        if (!newState.hasOwnProperty('text')) return;

        if (typeof newState.text === 'number' && typeof oldState.text === 'number') {
            state.text = Math.round(oldState.text + progress * (newState.text - oldState.text));
        }

        // Number animation in string
        if (typeof newState.text === 'string' && typeof oldState.text === 'string') {
            let patternN =  newState.text.replace(/-?[0-9]+/g,'0');
            let patternO =  oldState.text.replace(/-?[0-9]+/g,'0');

            if (patternN === patternO) {
                let pattern = patternN.split('0');
                let oldS = oldState.text.match(/-?[0-9]+/g);
                let newS = newState.text.match(/-?[0-9]+/g);

                let result = pattern[0];
                for (let i in oldS) {
                    result += Math.round(Number(oldS[i]) + progress * (Number(newS[i]) - Number(oldS[i])));
                    result += pattern[Number(i)+1];
                }

                state.text = result;
            }
        }

    }

    /**
     * Removes this actor
     * @param immediately If should be removed immediately or with animation
     */
    public remove(immediately: boolean): void {
        this.setState({opacity: 0}, immediately, false, () => {
            // remove HTML element
            this.element.parentNode.removeChild(this.element);

            // Disconnect from the board
            this.board.unregisterActor(this);
            this.board = null;
        });
    }
}
