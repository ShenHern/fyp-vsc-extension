export class Queue {
    constructor() {
        this.array = [];
    }
    pop() {
        if (this.isEmpty()) {
            throw new Error("Empty Stack!");
        }
        const value = this.array.shift();
        if (value === undefined) {
            throw new Error("Error popping element from Stack!");
        }
        else {
            return value;
        }
    }
    push(data) {
        this.array.push(data);
    }
    peek() {
        if (this.isEmpty()) {
            throw new Error("Empty Stack!");
        }
        return this.array[this.array.length - 1];
    }
    isEmpty() {
        return this.array.length === 0;
    }
}
