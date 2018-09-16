import {AbstractActor} from "./AbstractActor";
import {Board} from "../Board";
import {TextActor, TextActorPublicInformationInterface} from "./TextActor";
import {VertexActor} from "./VertexActor";

export interface EdgeActorStateInterface {
    text: string;
    color: [number, number, number];
    size: number;
    opacity: number;
    arrows: [number, number];
}

/**
 * The edge connecting vertices
 */
export class EdgeActor extends AbstractActor {
    private lines: SVGLineElement[] = [];
    private arrows: SVGPolygonElement[] = [];
    private textActor: TextActor;

    public vertices: [VertexActor, VertexActor];

    protected state: EdgeActorStateInterface = {
        text: null,
        color: [255, 255, 255],
        size: 1,
        opacity: 0, // Default opacity is 0
        arrows: [0, 0] // Default arrows opacity are 0
    };

    public constructor() {
        super();
    }

    public connectTo(board: Board): void {
        super.connectTo(board);

        // Create lines
        for (let i = 0; i < 3; i++) {
            this.lines[i] = <SVGLineElement>board.createSVGElement('line');
            this.lines[i].onclick = (event: MouseEvent) => {event.stopPropagation();  board.clickedOnActor(this)};
        }

        // Create arrows
        for (let i = 0; i < 2; i++) {
            this.arrows[i] = <SVGPolygonElement>board.createSVGElement('polygon');
            this.arrows[i].onclick = (event: MouseEvent) => {event.stopPropagation();  board.clickedOnActor(this)};
        }

        this.lines[1].setAttribute('stroke-dasharray', '5');

        // Create adn register TextActor
        this.textActor = new TextActor();
        board.registerActor(this.textActor);
        this.textActor.registerPublicInformationListener(
            (x: TextActorPublicInformationInterface) => {this.updateLinesByTextActor(x);}
        );
        this.textActor.element.addEventListener('click', (event: MouseEvent) => {
            event.stopPropagation();
            board.clickedOnActor(this);
        });
    }

    public setState(state, immediately: boolean = false, doNotStopAnimation: boolean = false, callback: Function = null) {
        // update textActor
        if ('text' in state) {
            this.textActor.setState({text: state.text}, immediately, true);
        }
        super.setState(state, immediately, doNotStopAnimation, callback);
    }

    /**
     * Connects to vertices to make an edge
     * @param vertices
     */
    public setVertices(vertices: [VertexActor, VertexActor]): void {
        this.vertices = vertices;

        vertices[0].linkEdge(this);
        vertices[0].registerPublicInformationListener(() => {this.update()});

        vertices[1].linkEdge(this);
        vertices[1].registerPublicInformationListener(() => {this.update()});

        this.update();
    }


    /**
     * Redraws element and update text actor
     */
    protected update() {
        let x1 = this.vertices[0].getPublicInformation().x;
        let y1 = this.vertices[0].getPublicInformation().y;
        let x2 = this.vertices[1].getPublicInformation().x;
        let y2 = this.vertices[1].getPublicInformation().y;
        let dx = x2-x1;
        let dy = y2-y1;

        // First update text and then update lines by triggering public information listener
          this.textActor.setState({
            x: x1 + dx/2,
            y: y1 + dy/2,
            size: this.state.size/2,
            color: this.state.color,
            opacity: this.state.opacity
        }, true, true);
    }

    private updateLinesByTextActor(data: TextActorPublicInformationInterface) {
        let x1 = this.vertices[0].getPublicInformation().x;
        let y1 = this.vertices[0].getPublicInformation().y;
        let x2 = this.vertices[1].getPublicInformation().x;
        let y2 = this.vertices[1].getPublicInformation().y;
        let r1 = this.vertices[0].getPublicInformation().r;
        let r2 = this.vertices[1].getPublicInformation().r;
        let dx = x2-x1;
        let dy = y2-y1;

        let dist = Math.sqrt(dx*dx + dy*dy);

        let padding = data.set ? {x: 20, y: 20} : {x: 0, y: 0};

        let x = [];
        x[0] = x1 + 2*r1*dx/dist;
        let px = (dx>0?1:-1)*Math.min(Math.abs(dx*(data.height+padding.y)/(2*dy)), (data.width+padding.x)/2);
        x[1] = x1 + dx/2 - px;
        x[2] = x1 + dx/2 + px;
        x[3] = x2 - 2*r2*dx/dist;

        let y = [];
        y[0] = y1 + 2*r1*dy/dist;
        let py = (dy>0?1:-1)*Math.min(Math.abs(dy*(data.width+padding.x)/(2*dx)), (data.height+padding.y)/2);
        y[1] = y1 + dy/2 - py;
        y[2] = y1 + dy/2 + py;
        y[3] = y2 - 2*r2*dy/dist;

        for (let i = 0; i < 3; i++) {
            this.lines[i].setAttribute('x1', (x[i]).toString());
            this.lines[i].setAttribute('y1', (y[i]).toString());
            this.lines[i].setAttribute('x2', (x[i+1]).toString());
            this.lines[i].setAttribute('y2', (y[i+1]).toString());

            this.lines[i].setAttribute('opacity', (this.state.opacity * (i === 1 ? .3 : 1)).toString());
            this.lines[i].setAttribute('stroke', 'rgb(' + Math.round(this.state.color[0]) + ',' + Math.round(this.state.color[1]) + ',' + Math.round(this.state.color[2]) + ')');
            this.lines[i].setAttribute('stroke-width', (this.state.size*2).toString());

        }

        let length = Math.sqrt(dx*dx+dy*dy);

        // Update arrows
        let arrowSize = this.state.size*10;
        this.arrows[0].setAttribute('points',
            (x[0] - dx/length*arrowSize).toString() + ',' + (y[0] - dy/length*arrowSize).toString() + ' ' +
            (x[0] + dy/length*arrowSize).toString() + ',' + (y[0] - dx/length*arrowSize).toString() + ' ' +
            (x[0] - dy/length*arrowSize).toString() + ',' + (y[0] + dx/length*arrowSize).toString()
        );

        this.arrows[1].setAttribute('points',
            (x[3] + dx/length*arrowSize).toString() + ',' + (y[3] + dy/length*arrowSize).toString() + ' ' +
            (x[3] + dy/length*arrowSize).toString() + ',' + (y[3] - dx/length*arrowSize).toString() + ' ' +
            (x[3] - dy/length*arrowSize).toString() + ',' + (y[3] + dx/length*arrowSize).toString()
        );

        for (let i = 0; i < 2; i++) {
            this.arrows[i].setAttribute('opacity', (this.state.opacity*this.state.arrows[i]).toString());
            this.arrows[i].setAttribute('fill', 'rgb(' + Math.round(this.state.color[0]) + ',' + Math.round(this.state.color[1]) + ',' + Math.round(this.state.color[2]) + ')');
        }
    }

    /**
     * Removes this actor
     * @param immediately If should be removed immediately or with animation
     */
    public remove(immediately: boolean): void {
        this.setState({opacity: 0}, immediately, false, () => {
            // Remove TextActor
            this.textActor.remove(true); // Because it was animated by this
            // Disconnect from VertexActor
            this.vertices[0].unlinkEdge(this);
            this.vertices[1].unlinkEdge(this);

            // remove HTML element
            for (let i = 0; i < 3; i++) {
                this.lines[i].parentNode.removeChild(this.lines[i]);
            }
            for (let i = 0; i < 2; i++) {
                this.arrows[i].parentNode.removeChild(this.arrows[i]);
            }

            // Disconnect from the board
            this.board.unregisterActor(this);
            this.board = null;
        });
    }
}