export class Queue<T> {
    private array: T[] = [];

    pop(): T {
        if (this.isEmpty()) {throw new Error("Empty Stack!");}

        const value = this.array.shift();
        if (value === undefined) {
            throw new Error("Error popping element from Stack!");
        } else {
            return value;
        }
    }

    push(data: T): void {
        this.array.push(data);
    }

    peek(): T {
        if (this.isEmpty()) {throw new Error("Empty Stack!");}

        return this.array[this.array.length - 1];
    }

    isEmpty(): boolean {
        return this.array.length === 0;
    }
}