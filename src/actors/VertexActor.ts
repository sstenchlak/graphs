import {AbstractActor} from "./AbstractActor";
import {Board} from "../Board";
import {TextActor} from "./TextActor";
import {Wave} from "../Wave";

export interface VertexActorStateInterface {
    text: string;
    x: number;
    y: number;
    color: [number, number, number];
    size: number;
    stroke: [number, number, number];
}

export interface VertexActorPublicInformationInterface {
    x: number;
    y: number;
    r: number;
}

export class VertexActor extends AbstractActor {
    private element:SVGElement;
    private textActor: TextActor;

    private waves: [Wave, Wave] = [null, null];

    protected publicInformation: VertexActorPublicInformationInterface = {
        x: 0,
        y: 0,
        r: 31.5
    };

    protected relativePosition = [0.5, 0.5];

    protected state:VertexActorStateInterface = {
        text: '',
        x: 0,
        y: 0,
        color: [255, 255, 255],
        size: 1,
        stroke: [255, 255, 255]
    };

    public constructor() {
        super();
        this.waves[0] = new Wave();
        this.waves[1] = new Wave();
    }

    public connectTo(board: Board) {
        super.connectTo(board);
        this.element = board.createSVGElement('circle');
        this.textActor = new TextActor();
        board.registerActor(this.textActor);
    }

    public setState(state, immediately: boolean) {
        // update textActor
        if ('text' in state) {
            this.textActor.setState({text: state.text}, immediately, true);
        }
        super.setState(state, immediately);
    }

    /**
     * Knocking from outside to update animations
     * @param time from last knock
     */
    public knock(time: number): void {
        this.relativePosition[0] = (this.waves[0].getNextValue(time) - 0.5) * 20;
        this.relativePosition[1] = (this.waves[1].getNextValue(time) - 0.5) * 20;
        super.knock(time);
        this.update();
    }

    protected update() {
        let x = this.state.x + this.relativePosition[0];
        let y = this.state.y + this.relativePosition[1];
        this.element.setAttribute('cx', x.toString());
        this.element.setAttribute('cy', y.toString());
        this.element.setAttribute('fill', 'rgb(' + Math.round(this.state.color[0]) + ',' + Math.round(this.state.color[1]) + ',' + Math.round(this.state.color[2]) + ')');
        this.element.setAttribute('r', (this.state.size*30).toString());
        this.element.setAttribute('stroke', 'rgb(' + Math.round(this.state.stroke[0]) + ',' + Math.round(this.state.stroke[1]) + ',' + Math.round(this.state.stroke[2]) + ')');
        this.element.setAttribute('stroke-width', (this.state.size*3).toString());

        this.textActor.setState({x: x, y: y, size: this.state.size}, true, true);

        this.updatePublicInformation({
            x: x,
            y: y,
            r: (this.state.size*30 + this.state.size*1.5)
        });
    }

    public getPublicInformation() {
        return this.publicInformation;
    }

}