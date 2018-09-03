export class Wave {
    private value: number = 0.5;

    private last: number = 0.5;
    private next: number = 0.5;
    private time: number = 0;
    private total: number;

    public constructor() {
        this.generateNewDirection();
    }

    private static interpolate(pa: number, pb: number, px: number): number {
        let ft = px * Math.PI,
            f = (1 - Math.cos(ft)) * 0.5;
        return pa * (1 - f) + pb * f;
    }

    private generateNewDirection(): void {
        this.last = this.value;
        this.next = Math.random();
        // this.total = 0.5 + Math.random();
        this.total = Math.abs(this.next-this.last) * 5;
    }

    public getNextValue(time: number): number {
        this.time += time;
        if (this.time > this.total) {
            this.time %= this.total;
            this.generateNewDirection();
            this.time %= this.total;
        }
        return this.value = Wave.interpolate(this.last, this.next, this.time/this.total);
    }

}