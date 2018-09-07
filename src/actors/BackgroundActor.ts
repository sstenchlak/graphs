import {AbstractActor} from "./AbstractActor";
import {Board} from "../Board";

export interface BackgroundActorStateInterface {
    colors: [number, number, number][];
    gradientSpeed: number;
}

export class BackgroundActor extends AbstractActor{
    private colorIndices: number[];
    private step: number;
    private background: HTMLElement;

    public constructor() {
        super();
        this.state.colors = BackgroundActor.COLORS_BLUE();
        this.colorIndices = [0,1,2,3];
        this.step = 0;
    }

    public connectTo(board: Board): void {
        super.connectTo(board);
        this.background = board.backgroundElement;
    }

    protected state:BackgroundActorStateInterface = {
        colors: [],
        gradientSpeed: 0.02
    };

    public knock(time: number): void {
        super.knock(time);

        this.step += this.state.gradientSpeed*time;
        if ( this.step >= 1 )
        {
            this.step %= 1;
            this.colorIndices[0] = this.colorIndices[1];
            this.colorIndices[2] = this.colorIndices[3];
            this.colorIndices[1] = ( this.colorIndices[1] + Math.floor( 1 + Math.random() * (4 - 1))) % 4;
            this.colorIndices[3] = ( this.colorIndices[3] + Math.floor( 1 + Math.random() * (4 - 1))) % 4;
        }

        this.update();
    }

    protected update(): void {
        let c0_0 = this.state.colors[this.colorIndices[0]];
        let c0_1 = this.state.colors[this.colorIndices[1]];
        let c1_0 = this.state.colors[this.colorIndices[2]];
        let c1_1 = this.state.colors[this.colorIndices[3]];

        let istep = 1 - this.step;
        let r1 = Math.round(istep * c0_0[0] + this.step * c0_1[0]);
        let g1 = Math.round(istep * c0_0[1] + this.step * c0_1[1]);
        let b1 = Math.round(istep * c0_0[2] + this.step * c0_1[2]);
        let color1 = "rgb("+r1+","+g1+","+b1+")";

        let r2 = Math.round(istep * c1_0[0] + this.step * c1_1[0]);
        let g2 = Math.round(istep * c1_0[1] + this.step * c1_1[1]);
        let b2 = Math.round(istep * c1_0[2] + this.step * c1_1[2]);
        let color2 = "rgb("+r2+","+g2+","+b2+")";

        this.background.setAttribute('style',
            'background: -webkit-gradient(linear, left top, right top, from('+color1+'), to('+color2+'));' +
            'background: -moz-linear-gradient(left, '+color1+' 0%, '+color2+' 100%);' +
            'background: linear-gradient(to right top, '+color1+', '+color2+');');
    }

    static COLORS_BLUE(): [number, number, number][] {
        return [
            [35,166,213],
            [35,216,171],
            [141,40,218],
            [87,58,218]
        ];
    }

    static COLORS_RED(): [number, number, number][] {
        return [
            [213,166,35],
            [171,216,35],
            [218,40,141],
            [218,58,87]
        ];
    }

    static COLORS_GREEN(): [number, number, number][] {
        return [
            [125,160,26],
            [216,171,35],
            [30,164,106],
            [44,164,65]
        ];
    }

    public remove(immediately: boolean): void {
        // why?
    }

}