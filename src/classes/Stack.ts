export class Stack<T> {
    private array: T[] = [];

    pop(): T {
        if (this.isEmpty()) {throw new Error("Empty Stack!");}

        let value = this.array.pop();
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