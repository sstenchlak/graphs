import {AbstractActor} from "./AbstractActor";
import {Board} from "../Board";

interface HintActorStateInterface {
    text: string;
}

export class HintActor extends AbstractActor {
    private element: HTMLElement;

    protected state: HintActorStateInterface = {
        text: null
    };

    connectTo(board: Board): void {
        super.connectTo(board);
        this.element = board.hintElement;
        //this.stateUpdaters.push(() => {});
    }

    //private transitionUpdater

    protected update(): void {
        this.element.innerHTML = this.state.text;
    }

    public remove(immediately: boolean) {
        // No, thanks
    }
}