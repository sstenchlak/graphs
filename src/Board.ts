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

    private selected: VertexActor|null = null;

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
        this.actors.filter((el: AbstractActor) => {
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
            actor.knock(d*20);
        }
        setTimeout(() => {
            this.heartBeat(t)
        }, this.HEARTBEAT_PERIOD);
    }

    public triggerClick(actor: VertexActor): void {
        if (this.selected) {
            if (this.selected !== actor) {
                // Create new Ege
                let e = new EdgeActor();
                this.registerActor(e);
                e.setVertices([this.selected, actor]);
                e.setState({opacity: 1}, false);
            }
            this.setSelectedVertexActor(null);
        } else {
            this.setSelectedVertexActor(actor);
        }
    }

    /**
     * (Creates a new Vertex actor)
     * @param event
     */
    public clickedOnBoard(event: MouseEvent): void {
        if (!this.interactive) return;

        if (this.setSelectedVertexActor(null)) return;

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
     * Selects or deselects VertexActor. Only one could be selected.
     * @param actor
     */
    private setSelectedVertexActor(actor: VertexActor|null): VertexActor|null {
        if (!this.interactive) return null;

        let ret = this.selected;

        if (this.selected) {
            this.selected.setState({size: 1}, false);
        }
        if (actor) {
            actor.setState({size: 1.5}, false);
        }
        this.selected = actor;
        return ret;
    }

    private setSelectedEdgeActor(actor: EdgeActor|null): EdgeActor|null {

    }

    private removeVertexActor(actor: VertexActor): void {
        // Remove all connected EdgeActors
        for (let x of this.actors) {
            if (x instanceof EdgeActor) {
                if (x.getVertices().indexOf(actor) !== -1) {
                    // Todo remove x
                    this.removeEdgeActor(x);
                }
            }
        }

        // Remove the actor
        actor.setState({opacity: 0});



    }

    private removeEdgeActor(actor: EdgeActor): void {
        actor.setState({opacity: 0}, false);
        this.actors.filter((el: AbstractActor) => {
            return el !== actor;
        });
        delete actor;
    }

    // Todo: resolve how to select edge actor
    // Todo: VertexActor does not need text
}