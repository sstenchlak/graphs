import {AbstractActor} from "./actors/AbstractActor";
import {VertexActor} from "./actors/VertexActor";
import {EdgeActor} from "./actors/EdgeActor";

/**
 * Theater for Actors
 */
export class Board {
    public SVG: SVGSVGElement;
    private SVGActorLayer: SVGGElement;
    public backgroundElement: HTMLElement;
    private SVGPoint: SVGPoint;

    private readonly HEARTBEAT_PERIOD = 1;

    private selected: VertexActor|EdgeActor|null = null;

    private interactive: boolean = true;

    /**
     * All the actors on the board
     */
    private actors: AbstractActor[] = [];

    /**
     * Vertices on the board
     */
    private vertices: VertexActor[] = [];

    /**
     * Constructor
     * @param options
     */
    public constructor(options) {
        this.heartBeat(null);
        this.SVG = options.SVG;
        this.SVGActorLayer = options.SVGActorLayer;
        this.backgroundElement = options.backgroundElement;

        this.SVGPoint = this.SVG.createSVGPoint();

        this.SVG.addEventListener('click', (evt: MouseEvent) => {this.clickedOnBoard(evt);});

        document.getElementsByClassName('remove-selected')[0].addEventListener('click', ()=>{
            let sel = this.setSelectedActor(null);

            if (sel instanceof VertexActor) {
                this.removeVertexActor(sel, false);
            } else if (sel instanceof EdgeActor) {
                this.removeEdgeActor(sel, false);
            }
        });

    }

    /**
     * Every actor must be registered in one board
     * @param actor
     */
    public registerActor(actor: AbstractActor): AbstractActor {
        this.actors.push(actor);
        actor.connectTo(this);
        return actor;
    }

    /**
     * Registers Vertex
     * @param vertexActor
     */
    public registerVertex(vertexActor: VertexActor): VertexActor {
        this.registerActor(vertexActor);
        this.vertices.push(vertexActor);
        return vertexActor;
    }

    /**
     * Removes actor from list of actors
     * @param actor
     */
    public unregisterActor(actor: AbstractActor): void {
        this.actors = this.actors.filter((el: AbstractActor) => {
            return el !== actor;
        });
    }

    /**
     * Creates an SVG element
     * @param name Element name
     */
    public createSVGElement(name: string): SVGElement {
        let element = document.createElementNS("http://www.w3.org/2000/svg", name);
        this.SVGActorLayer.appendChild(element);
        return element;
    }

    /**
     * Function to generate periodic heartbeat
     * @param last Last time
     */
    private heartBeat(last: number): void {
        let t = (new Date()).getTime() / 1000;
        let d = last ? t - last : 0;
        for (let actor of this.actors) {
            actor.knock(d);
        }
        setTimeout(() => {
            this.heartBeat(t)
        }, this.HEARTBEAT_PERIOD);
    }

    /**
     * Called when was clicked on AbstractActor
     * @param actor
     */
    public clickedOnActor(actor: AbstractActor): void {
        if (!this.interactive) return null;

        if (actor instanceof VertexActor) {
            if (this.selected !== actor && this.selected instanceof VertexActor) {
                // Create new Ege
                let e = new EdgeActor();
                this.registerActor(e);
                e.setVertices([this.selected, actor]);
                e.setState({opacity: 1, text: "Hodnota: 8\nVisited: No"}, false);
                this.setSelectedActor(null);
            } else {
                this.setSelectedActor(actor);
            }
        } else if (actor instanceof EdgeActor) {
            this.setSelectedActor(actor);
        }
    }

    /**
     * (Creates a new Vertex actor)
     * @param event
     */
    public clickedOnBoard(event: MouseEvent): void {
        if (!this.interactive) return;

        if (this.setSelectedActor(null)) return;

        this.SVGPoint.x = event.clientX;
        this.SVGPoint.y = event.clientY;

        // The cursor point, translated into svg coordinates
        let cursorpt =  this.SVGPoint.matrixTransform(this.SVG.getScreenCTM().inverse());
        let a = new VertexActor();
        this.registerActor(a);
        a.setState({x: cursorpt.x, y: cursorpt.y}, true);
        a.setState({opacity: 1}, false);
    }

    /**
     * Selects or deselects supported Actor. Only one could be selected.
     * @param actor
     * @return last selected Actor
     */
    private setSelectedActor(actor: VertexActor|EdgeActor|null): VertexActor|EdgeActor|null {
        let ret = this.selected;

        // Deselect previous
        if (this.selected instanceof VertexActor) {
            this.selected.setState({size: 1, color: [255, 255, 255], stroke: [255, 255, 255]}, false);
        } else if (this.selected instanceof EdgeActor) {
            this.selected.setState({color: [255, 255, 255]}, false);
        }

        this.selected = actor;

        // Select new one
        if (this.selected instanceof VertexActor) {
            this.selected.setState({size: 1.5, color: [255, 255, 0], stroke: [255, 255, 0]}, false);
        } else if (this.selected instanceof EdgeActor) {
            this.selected.setState({color: [255, 255, 0]}, false);
        }

        return ret;
    }

    /**
     * Removes VertexActor with all edges connected to it
     * @param vertexActor
     * @param immediately
     */
    private removeVertexActor(vertexActor: VertexActor, immediately: boolean): void {
        for (let edgeActor of vertexActor.connectedEdgeActors) {
            edgeActor.remove(immediately);
        }

        vertexActor.remove(immediately);
    }

    private removeEdgeActor(edgeActor: EdgeActor, immediately: boolean): void {
        edgeActor.remove(immediately);
    }
}