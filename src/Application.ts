import {Board} from "./Board";
import {BackgroundActor} from "./actors/BackgroundActor";
import {EdgeActor} from "./actors/EdgeActor";
import {VertexActor} from "./actors/VertexActor";
import {AbstractActor} from "./actors/AbstractActor";
import {HintActor} from "./actors/HintActor";
import {Presenter} from "./Presenter";

export interface GraphStructureInterface {
    vertices: Object[],
    edges: [number, number, Object][]
}

/**
 * Layer between Board and GUI
 */
export class Application {

    private vertexSelectedPanel: HTMLElement;
    private vertexPanelValue: HTMLInputElement;
    private edgeSelectedPanel: HTMLElement;

    private board: Board;

    private graphExaple: GraphStructureInterface = {
        vertices: [
            {x: 100, y: 200},
            {x: 300, y: 100},
            {x: 300, y: 300},
            {x: 500, y: 200},
            {x: 500, y: 400},

            {x: 300, y: 600},
            {x: 700, y: 600},

            {x: 700, y: 300},
        ],
        edges: [
            [0, 1, {text: 20}],
            [0, 2, {text: 10}],
            [1, 3, {text: 30}],
            [2, 3, {text: 25}],
            [3, 4, {text: 30}],

            [4, 5, {text: 5}],
            [4, 6, {text: 10}],
            [5, 6, {text: 20}],

            [3, 7, {text: 10}],
            [4, 7, {text: 10}],
            [6, 7, {text: 10}],
        ]
    };

    public constructor() {
        this.vertexSelectedPanel = document.getElementById('vertex-selected');
        this.edgeSelectedPanel = document.getElementById('edge-selected');
        this.vertexPanelValue = <HTMLInputElement>this.edgeSelectedPanel.getElementsByClassName('value-set')[0];

        // Creates board
        this.board = new Board({
            SVG: document.querySelector('#board svg'),
            SVGActorLayer: document.getElementById('board').querySelector('.scale-layer'),
            backgroundElement: document.getElementById('background'),
            application: this,
            hintElement: document.getElementById("hint")
        });

        // Register background
        let background = new BackgroundActor();
        this.board.registerSpecialActor('background', background);

        // Register hint element
        let hint = new HintActor();
        this.board.registerSpecialActor('hint', hint);

        // Register buttons in EdgePanel
        this.edgeSelectedPanel.getElementsByClassName('remove')[0].addEventListener('click', ()=>{
            this.board.removeEdgeActor(<EdgeActor>this.board.selected);
        });
        this.vertexPanelValue.addEventListener('input', ()=>{
            this.board.selected.setState({text: Number(this.vertexPanelValue.value)});
        });
        this.edgeSelectedPanel.getElementsByClassName('remove-value')[0].addEventListener('click', ()=>{
            this.board.selected.setState({text: null});
            this.vertexPanelValue.value = null;
        });

        let orientations = {
            'set-orientation-none': [0, 0],
            'set-orientation-positive': [1, 0],
            'set-orientation-negative': [0, 1]
        };

        for (let key in orientations) {
            this.edgeSelectedPanel.getElementsByClassName(key)[0].addEventListener('click', ()=>{
                this.board.selected.setState({arrows: orientations[key]});
            });
        }

        // Register buttons in vertex panel
        this.vertexSelectedPanel.getElementsByClassName('remove')[0].addEventListener('click', ()=>{
            this.board.removeVertexActor(<VertexActor>this.board.selected);
        });

        // Register keys
        document.addEventListener('keydown', (event: KeyboardEvent)=>{
            switch (event.key.toString()) {
                case 'Delete':
                        if (this.board.selected instanceof VertexActor) {
                            this.board.removeVertexActor(this.board.selected);
                        } else if (this.board.selected instanceof EdgeActor) {
                            this.board.removeEdgeActor(this.board.selected);
                        }
                    break;
            }
        });

        // Create some graph
        this.loadGraphFromData(this.graphExaple);

        // Bind do a shit
        document.getElementById('do-a-shit').addEventListener('click', ()=>{
            this.board.createPresenter();
        });
    }

    public openVertexPanel(): void {
        this.vertexSelectedPanel.style.display = 'block';
        this.edgeSelectedPanel.style.display = 'none';
    }

    public openEdgePanel(v: number): void {
        this.vertexPanelValue.value = v.toString();

        this.vertexSelectedPanel.style.display = 'none';
        this.edgeSelectedPanel.style.display = 'block';
    }

    public closeAllPanels(): void {
        this.vertexSelectedPanel.style.display = 'none';
        this.edgeSelectedPanel.style.display = 'none';
    }

    public loadGraphFromData(data: GraphStructureInterface): void {
        let vertices: VertexActor[] = [];
        for (let key in data.vertices) {
            vertices[key] = new VertexActor();
            this.board.registerVertex(vertices[key]);
            vertices[key].setState(data.vertices[key], true);
            vertices[key].setState({opacity: 1});
        }

        for (let key in data.edges) {
            let e = this.board.safeCreateEdge([vertices[data.edges[key][0]], vertices[data.edges[key][1]]]).edge;
            e.setState(data.edges[key][2], true);
            e.setState({opacity: 1});
        }
    }

    /**
     * Helper function for cloning object
     * @param obj
     */
    public static cloneObject<T>(obj: T): T {
        if (typeof obj !== 'object' || obj === null)
            return obj;

        let clone;
        if (Array.isArray(obj)) {
            clone = [];
        } else {
            clone = {};
        }
        for(let i in obj) {
            clone[i] = Application.cloneObject(obj[i]);
        }
        return clone;
    }
}

/**
 *   ,-'''''-.:-^-._
 *  /      '  ( `  _\
 *  \      \   _ .,-'
 *   )_\-._-._((_(  This is a hippo, my friend.
 */