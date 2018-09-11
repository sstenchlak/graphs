import {AbstractActor} from "./AbstractActor";
import {Board} from "../Board";
import {TextActor} from "./TextActor";
import {Wave} from "../Wave";
import {EdgeActor} from "./EdgeActor";

export interface VertexActorStateInterface {
    text: string|number;
    x: number;
    y: number;
    color: [number, number, number];
    size: number;
    stroke: [number, number, number];
    opacity: number;
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

    public connectedEdgeActors: EdgeActor[] = [];

    private DEFAULT_SIZE = 15;
    private TEXT_SIZE_RATIO = .5;

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
        stroke: [255, 255, 255],
        opacity: 0 // Default opacity is 0
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
        this.element.addEventListener('click', (event: MouseEvent) => {event.stopPropagation();  board.clickedOnActor(this);});
        this.textActor.element.addEventListener('click', (event: MouseEvent) => {event.stopPropagation();  board.clickedOnActor(this);});
    }

    public setState(state, immediately: boolean = false, doNotStopAnimation: boolean = false, callback: Function = null) {
        // update textActor
        if ('text' in state) {
            this.textActor.setState({text: state.text}, immediately, true);
        }
        super.setState(state, immediately, doNotStopAnimation, callback);
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
        this.element.setAttribute('r', (this.state.size*this.DEFAULT_SIZE).toString());
        this.element.setAttribute('opacity', (this.state.opacity).toString());
        this.element.setAttribute('stroke', 'rgb(' + Math.round(this.state.stroke[0]) + ',' + Math.round(this.state.stroke[1]) + ',' + Math.round(this.state.stroke[2]) + ')');
        this.element.setAttribute('stroke-width', (this.state.size*3).toString());

        this.textActor.setState({x: x, y: y, size: this.state.size*this.TEXT_SIZE_RATIO, opacity: this.state.opacity}, true, true);

        this.updatePublicInformation({
            x: x,
            y: y,
            r: (this.state.size*this.DEFAULT_SIZE + this.state.size*1.5)
        });
    }

    public getPublicInformation() {
        return this.publicInformation;
    }

    public linkEdge(edge: EdgeActor): void {
        this.connectedEdgeActors.push(edge);
    }

    public unlinkEdge(edge: EdgeActor): void {
        this.connectedEdgeActors = this.connectedEdgeActors.filter((ea: EdgeActor) => {
            return ea !== edge;
        });
    }

    /**
     * Removes this actor without all the Edges connected to them
     * @param immediately If should be removed immediately or with animation
     */
    public remove(immediately: boolean): void {
        console.log("Remove vertex actor called");
        this.setState({opacity: 0}, immediately, false, () => {
            console.log("Remove vertex actor callback called");
            // Remove TextActor
            this.textActor.remove(true); // Because it was animated by this

            // remove HTML element
            this.element.parentNode.removeChild(this.element);

            // Disconnect from the board
            this.board.unregisterActor(this);
            this.board = null;
        });
    }

}