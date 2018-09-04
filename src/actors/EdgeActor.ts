import {AbstractActor} from "./AbstractActor";
import {Board} from "../Board";
import {TextActor} from "./TextActor";
import {VertexActor} from "./VertexActor";

export interface EdgeActorStateInterface {
    text: string;
    color: [number, number, number];
    size: number;
    opacity: number;
}

/**
 * The edge connecting vertices
 */
export class EdgeActor extends AbstractActor {
    private element:SVGElement;
    private textActor: TextActor;

    private vertices: [VertexActor, VertexActor];

    protected state: EdgeActorStateInterface = {
        text: '',
        color: [255, 255, 255],
        size: 1,
        opacity: 0 // Default opacity is 0
    };

    public constructor() {
        super();
    }

    public connectTo(board: Board): void {
        super.connectTo(board);
        this.element = board.createSVGElement('line');
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
     * Connects to vertices to make an edge
     * @param vertices
     */
    public setVertices(vertices: [VertexActor, VertexActor]): void {
        this.vertices = vertices;
        vertices[0].registerPublicInformationListener(() => {this.update()});
        vertices[1].registerPublicInformationListener(() => {this.update()});
        this.update();
    }

    protected update() {
        let x1 = this.vertices[0].getPublicInformation().x;
        let y1 = this.vertices[0].getPublicInformation().y;
        let x2 = this.vertices[1].getPublicInformation().x;
        let y2 = this.vertices[1].getPublicInformation().y;
        let r1 = this.vertices[0].getPublicInformation().r;
        let r2 = this.vertices[1].getPublicInformation().r;
        let dx = x2-x1;
        let dy = y2-y1;
        let dist = Math.sqrt(dx*dx + dy*dy);
        this.element.setAttribute('x1', (x1 + 1.5*r1*dx/dist).toString());
        this.element.setAttribute('y1', (y1 + 1.5*r1*dy/dist).toString());
        this.element.setAttribute('x2', (x2 - 1.5*r2*dx/dist).toString());
        this.element.setAttribute('y2', (y2 - 1.5*r2*dy/dist).toString());
        this.element.setAttribute('opacity', (this.state.opacity).toString());
        this.element.setAttribute('style', 'stroke:rgb(' + Math.round(this.state.color[0]) + ',' + Math.round(this.state.color[1]) + ',' + Math.round(this.state.color[2]) + ');stroke-width:' + this.state.size*2);

        this.textActor.setState({
            x: x1 + dx/2 + 20*dy/dist,
            y: y1 + dy/2 - 20*dx/dist,
            size: this.state.size/2,
            color: this.state.color,
            opacity: this.state.opacity
        }, true, true);
    }
}