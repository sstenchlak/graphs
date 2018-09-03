import {AbstractActor} from "./actors/AbstractActor";

/**
 * Theater for Actors
 */
export class Board {
    public SVG: HTMLElement;
    private SVGActorLayer: HTMLElement;
    public backgroundElement: HTMLElement;

    private readonly HEARTBEAT_PERIOD = 1;

    /**
     * All the actors on the board
     */
    private actors: AbstractActor[] = [];

    /**
     * Constructor
     * @param options
     */
    public constructor(options) {
        this.heartBeat(null);
        this.SVG = options.SVG;
        this.SVGActorLayer = options.SVGActorLayer;
        this.backgroundElement = options.backgroundElement;
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
}