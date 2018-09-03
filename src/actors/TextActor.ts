import {AbstractActor} from "./AbstractActor";
import {Board} from "../Board";

interface TextActorStateInterface {
    text: any;
    x: number;
    y: number;
    color: [number, number, number];
    size: number;
}

export class TextActor extends AbstractActor {
    protected element:SVGElement;

    protected state:TextActorStateInterface = {
        text: '',
        x: 0,
        y: 0,
        color: [0, 0, 0],
        size: 1
    };

    public constructor() {
        super();
    }

    connectTo(board: Board): void {
        super.connectTo(board);
        this.element = board.createSVGElement('text');
        this.stateUpdaters.push(TextActor.textActorStateUpdater);
    }

    protected update() {
        this.element.textContent = this.state.text;
        this.element.setAttribute('x', this.state.x.toString());
        this.element.setAttribute('y', this.state.y.toString());
        this.element.setAttribute('fill', 'rgb(' + Math.round(this.state.color[0]) + ',' + Math.round(this.state.color[1]) + ',' + Math.round(this.state.color[2]) + ')');
        this.element.setAttribute('font-size', (this.state.size * 30).toString());
    }

    /**
     * Should take care about animation of states, that can't be animated easily by increasing number or switching text
     */
    private static textActorStateUpdater(oldState, state, newState, progress) {
        if (newState.hasOwnProperty('text') && typeof newState.text === 'number' && typeof oldState.text === 'number') {
            state.text = Math.round(oldState.text + progress * (newState.text - oldState.text));
        }
    }
}
