import {AbstractActor} from "./actors/AbstractActor";
import {VertexActor} from "./actors/VertexActor";
import {EdgeActor} from "./actors/EdgeActor";
import {Application} from "./Application";
import {BackgroundActor} from "./actors/BackgroundActor";
import {HintActor} from "./actors/HintActor";
import {Presenter} from "./Presenter";
import {DijkstrasAlgorithm} from "./algorithm/DijkstrasAlgorithm";

export interface SpecialActorsObjectInterface {
    background: BackgroundActor;
    hint: HintActor;
}

/**
 * Theater for Actors
 */
export class Board {
    public SVG: SVGSVGElement;
    private SVGActorLayer: SVGGElement;
    public backgroundElement: HTMLElement;
    private SVGPoint: SVGPoint;
    private application: Application;
    public hintElement: HTMLElement;

    private readonly HEARTBEAT_PERIOD = 1;
    private readonly HEARTBEAT_MULTIPLIER = 2;

    public selected: VertexActor|EdgeActor|null = null;

    private interactive: boolean = true;

    /**
     * All the actors on the board
     */
    private actors: AbstractActor[] = [];

    /**
     * Special actors on the board
     */
    private specialActors: SpecialActorsObjectInterface = {
        background: null,
        hint: null
    };

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
        this.application = options.application;
        this.hintElement = options.hintElement;

        this.SVGPoint = this.SVG.createSVGPoint();

        this.SVG.addEventListener('click', (evt: MouseEvent) => {this.clickedOnBoard(evt);});


    }

    /**
     * Every actor must be registered in one board
     * @param actor
     */
    public registerActor<T extends AbstractActor>(actor: T): T {
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

    public registerSpecialActor<T extends AbstractActor>(name: string, actor: T): T {
        this.registerActor(actor);
        this.specialActors[name] = actor;
        return actor;
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
            actor.knock(d*this.HEARTBEAT_MULTIPLIER);
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
                let res = this.safeCreateEdge([this.selected, actor]);

                if (res.created) {
                    this.setSelectedActor(null);
                    res.edge.setState({opacity: 1});
                } else {
                    this.setSelectedActor(res.edge);
                }
            } else {
                this.setSelectedActor(actor);
            }
        } else if (actor instanceof EdgeActor) {
            this.setSelectedActor(actor);
        }
    }

    /**
     * Tries to create an EdgeActor connecting two VertexActors. If already exists, returns it.
     * @param vertices
     * @param created
     */
    public safeCreateEdge(vertices: [VertexActor, VertexActor]): {edge: EdgeActor, created: boolean} {
        // In case the edge is already exists
        for (let edge of vertices[0].connectedEdgeActors) {
            for (let vertex of edge.vertices) {
                if (vertex == vertices[1]) {
                    return {
                        edge: edge,
                        created: false
                    };
                }
            }
        }

        // If not, create new
        let e = new EdgeActor();
        this.registerActor(e);
        e.setVertices(vertices);
        return {
            edge: e,
            created: true
        };
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
            this.selected.setState({size: 1.3, color: [255, 255, 0], stroke: [255, 255, 0]}, false);
            this.application.openVertexPanel();
        } else if (this.selected instanceof EdgeActor) {
            this.selected.setState({color: [255, 255, 0]}, false);
            this.application.openEdgePanel(this.selected.getState('text'));
        } else if (!this.selected) {
            this.application.closeAllPanels();
        }

        return ret;
    }

    /**
     * Removes VertexActor with all edges connected to it
     * @param vertexActor
     * @param immediately
     */
    public removeVertexActor(vertexActor: VertexActor, immediately: boolean = false): void {
        for (let edgeActor of vertexActor.connectedEdgeActors) {
            edgeActor.remove(immediately);
        }

        vertexActor.remove(immediately);
        this.setSelectedActor(null);
    }

    /**
     * Removes EdgeActor
     * @param edgeActor
     * @param immediately
     */
    public removeEdgeActor(edgeActor: EdgeActor, immediately: boolean = false): void {
        edgeActor.remove(immediately);
        this.setSelectedActor(null);
    }

    public setValueToSelectedEdgeActor(v: number): void {
        (<EdgeActor>this.selected).setState({text: v});
    }

    public createPresenter() {
        let presenter = new Presenter(this, this.actors, this.specialActors, DijkstrasAlgorithm);
        let s = presenter.prepare();
        console.log(s);
        if (s === true)
            window['presenter'] = presenter;
    }
}