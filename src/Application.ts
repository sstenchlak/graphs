import {Board} from "./Board";
import {BackgroundActor} from "./actors/BackgroundActor";
import {EdgeActor} from "./actors/EdgeActor";
import {VertexActor} from "./actors/VertexActor";
import {HintActor} from "./actors/HintActor";
import {Presenter} from "./Presenter";
import {DijkstrasAlgorithm} from "./algorithm/DijkstrasAlgorithm";
import {BoruvkasAlgorithm} from "./algorithm/BoruvkasAlgorithm";

export interface GraphStructureInterface {
    vertices: Object[],
    edges: [number, number, Object][]
}

/**
 * Layer between Board and GUI
 */
export class Application {

    private board: Board;

    private presenter: Presenter;

    private presentationTimeout: number = null;
    private actualSlide: number = null;
    private relativeSpeed: number = 1;
    private isRunning: boolean = false;

    private graphExaple: GraphStructureInterface = {
        vertices: [
            {x: 120, y: 200},
            {x: 310, y: 100},
            {x: 320, y: 300},
            {x: 510, y: 210},
            {x: 520, y: 400},

            {x: 290, y: 620},
            {x: 720, y: 610},

            {x: 710, y: 310},

            {x: 150, y: 520},
            {x: 715, y: 105},

        ],
        edges: [
            [0, 1, {text: 23}],
            [0, 2, {text: 12}],
            [1, 3, {text: 28}],
            [2, 3, {text: 25}],
            [3, 4, {text: 31}],

            [4, 5, {text: 5}],
            [4, 6, {text: 31}],
            [5, 6, {text: 24}],

            [3, 7, {text: 13}],
            [4, 7, {text: 19}],
            [6, 7, {text: 9}],

            [0, 8, {text: 16}],
            [2, 8, {text: 7}],
            [5, 8, {text: 17}],

            [1, 9, {text: 12}],
            [3, 9, {text: 18}],
            [7, 9, {text: 21}],
        ]
    };

    /**
     * List of all supported algorithms by its classes
     * (should extends AbstractAlgorithm)
     */
    private algorithmsList = [
        DijkstrasAlgorithm,
        BoruvkasAlgorithm
    ];

    public constructor() {

        // Creates board
        this.board = new Board({
            SVG: document.getElementById('svg'),
            SVGActorLayer: document.getElementById('svg-layer'),
            backgroundElement: document.getElementById('background'),
            application: this,
            hintElement: document.getElementById("hint"),
        });

        // Register background
        let background = new BackgroundActor();
        this.board.registerSpecialActor('background', background);

        // Register hint element
        let hint = new HintActor();
        this.board.registerSpecialActor('hint', hint);

        // Register buttons in EdgePanel
        document.getElementById('edge-remove').addEventListener('click', ()=>{
            this.board.removeEdgeActor(<EdgeActor>this.board.selected);
        });
        document.getElementById('edge-value').addEventListener('input', ()=>{
            this.board.selected.setState({text: Number((<HTMLInputElement>document.getElementById('edge-value')).value)});
        });
        document.getElementById('edge-remove-value').addEventListener('click', ()=>{
            this.board.selected.setState({text: null});
            (<HTMLInputElement>document.getElementById('edge-value')).value = null;
        });

        let orientations = {
            'edge-orientation-none': [0, 0],
            'edge-orientation-positive': [0, 1],
            'edge-orientation-negative': [1, 0]
        };

        for (let key in orientations) {
            document.getElementById(key).addEventListener('click', ()=>{
                this.board.selected.setState({arrows: orientations[key]});
            });
        }

        // Register buttons in vertex panel
        document.getElementById('vertex-remove').addEventListener('click', ()=>{
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

        // Register error close button
        document.getElementById('error-hide').addEventListener('click', ()=>{
            document.getElementById('error').style.display = 'none';
        });

        // Bind do a shit
        // document.getElementById('do-a-shit').addEventListener('click', ()=>{
        //     this.board.createPresenter();
        // });

        // Fill panel with algorithms
        let algorithms = document.getElementById('algorithms');
        for (let Algorithm of this.algorithmsList) {
            let panel = <HTMLElement>document.getElementById('single-algorithm').cloneNode(true);
            panel.id = null;
            panel.getElementsByTagName('h3')[0].textContent = Algorithm.getName();
            panel.getElementsByTagName('p')[0].textContent = Algorithm.getDescription();
            panel.getElementsByTagName('span')[0].textContent = Algorithm.getName();
            algorithms.appendChild(panel);
            panel.getElementsByTagName('button')[0].addEventListener('click', () => {
                this.runAlgorithm(Algorithm);
            });
        }

        // Open welcome panel
        this.welcomeScreen();

        // Register buttons
        document.getElementById('presentation-begin').addEventListener('click', () => {this.setSlide(0)});
        document.getElementById('presentation-back').addEventListener('click', () => {this.setSlide(this.actualSlide-1)});
        document.getElementById('presentation-forward').addEventListener('click', () => {this.setSlide(this.actualSlide+1)});
        document.getElementById('presentation-end').addEventListener('click', () => {this.setSlide(this.presenter.getNumberOfSlides()-1)});
    }

    /**
     * Tries to run an algorithm
     * @param Algorithm
     * @param selected
     */
    private runAlgorithm(Algorithm, selected : VertexActor = null) {
        // If there is no selected VertexActor and it should be
        if (Algorithm.hasOwnProperty('requireSelectVertex') && Algorithm.requireSelectVertex() && !selected) {
            this.vertexSelect(Algorithm.requireSelectVertex(), Algorithm);
            return;
        }

        // Prepare everything
        this.presenter = new Presenter(this.board, Algorithm);
        this.presenter.selected = selected;
        let result = this.presenter.prepare();

        // Show errors
        if (result !== true) {
            this.presenter = null;
            this.showError(<string>result);
            return;
        }

        // Prepare board
        document.getElementById('progressbar').setAttribute('max', this.presenter.getNumberOfSlides().toString());
        document.getElementById('progressbar').style.display = 'block';
        this.presentationScreen();
        this.board.interactive = false;
        this.isRunning = true;
        this.setSlide(0);
    }

    private togglePanels(panels: Object) {
        for (let id in panels) {
            document.getElementById(id).style.display = panels[id] ? "block" : "none";
        }
    }

    public openVertexPanel(): void {
        this.togglePanels({
            "vertex-select-panel": false,
            "buttons": false,
            "hint": false,
            "edge": false,
            "vertex": true,
            "welcome": false,
            "algorithms": false,
        });
    }

    public openEdgePanel(v: number|null): void {
        (<HTMLInputElement>document.getElementById('edge-value')).value = (v !== null ? v.toString() : '');
        this.togglePanels({
            "vertex-select-panel": false,
            "buttons": false,
            "hint": false,
            "edge": true,
            "vertex": false,
            "welcome": false,
            "algorithms": false,
        });
    }

    public vertexSelect(text: string, Algorithm): void {
        document.getElementById('vertex-select-panel').getElementsByTagName('p')[0].innerHTML = text;
        this.board.interactive = false;
        this.board.onAction.selectVertex = (actor: VertexActor) => {
            this.runAlgorithm(Algorithm, actor);
            this.board.onAction.selectVertex = null;
            this.board.interactive = true;
        };
        document.getElementById('vertex-select-dismiss').onclick = () => {
            this.board.interactive = true;
            this.welcomeScreen();
            this.board.onAction.selectVertex = null;
        };
        this.togglePanels({
            "vertex-select-panel": true,
            "buttons": false,
            "hint": false,
            "edge": false,
            "vertex": false,
            "welcome": false,
            "algorithms": false,
        });
    }

    public welcomeScreen(): void {
        this.togglePanels({
            "vertex-select-panel": false,
            "buttons": false,
            "hint": false,
            "edge": false,
            "vertex": false,
            "welcome": true,
            "algorithms": true,
        });
    }

    public presentationScreen(): void {
        this.togglePanels({
            "vertex-select-panel": false,
            "buttons": true,
            "hint": true,
            "edge": false,
            "vertex": false,
            "welcome": false,
            "algorithms": false,
        });
    }

    /**
     * Shows error on screen
     * @param message
     */
    private showError(message: string): void {
        document.getElementById('error-message').innerHTML = message;
        document.getElementById('error').style.display = 'table';
    }

    public loadGraphFromData(data: GraphStructureInterface): void {
        let vertices: VertexActor[] = [];
        for (let key in data.vertices) {
            vertices[key] = new VertexActor();
            this.board.registerVertex(vertices[key]);
            vertices[key].setState(data.vertices[key], true);
            vertices[key].setState({text: key}, true);

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

    /**
     * Update timming to next slide if some change
     */
    public playPauseUpdated() {
        clearTimeout(this.presentationTimeout);
        if (!this.presenter || !this.isRunning) return;
        this.presentationTimeout = setTimeout(() => {
            this.setSlide(this.actualSlide + 1);
        }, this.presenter.getSlideTime(this.actualSlide) / this.relativeSpeed);
    }

    /**
     * Sets slide
     * @param n
     */
    public setSlide(n: number): void {
        if (n < 0) n = 0;
        if (n >= this.presenter.getNumberOfSlides()) n = this.presenter.getNumberOfSlides()-1;
        this.actualSlide = n;
        (<HTMLInputElement>document.getElementById('progressbar')).value = n.toString();
        this.presenter.drawSlide(n);
        this.actualSlide = n;
        this.playPauseUpdated();
    }
}

/**
 *   ,-'''''-.:-^-._
 *  /      '  ( `  _\
 *  \      \   _ .,-'
 *   )_\-._-._((_(  This is a hippo, my friend.
 */