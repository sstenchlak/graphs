export class Elements {
    public static createSVGElement(name:string) {
        return document.createElementNS("http://www.w3.org/2000/svg", name);
    }
}