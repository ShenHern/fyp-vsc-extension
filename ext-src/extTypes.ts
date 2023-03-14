/**
 * Problem consists of
 * @param tx: 2d array in the form --> [[txID1, timing1], [txID2, timing2]]
 * @param rx: 2d array in the form --> [[rxID1, timing1], [rxID2, timing2]]
 * @param std: standard deviation; set a default of 10 upon object creation
 * @param delay::Function = (tx, rx) -> 0.0; change return value accordingly to situation
 * @param passoc::Function = (tx, rx) -> 1.0; change return value accordingly to situation
 * @param pfalse::Function = rx -> 0.1; change return value accordingly to situation
 */
export interface Problem {
    tx: any[][];
    rx: any[][];
    mean: number;
    std: number;
    delay(tx: number, rx:number): number;
    passoc(tx:number, rx:number): number;
    pfalse(rx:number): number;
}
/**
 * @param score: score of each state
 * @param backlink: link to previous state
 * @param assoc: Pair{Int} or Missing; pair of tx/rx ids that are associated
 * @param i: index of tx-id
 * @param j: index of rx-id
 * @param mean: delta time from previous state
 * @param std: follows problem std deviation
 */
export interface State {
    score: number;
    backlink: State | undefined;
    assoc: number[] | undefined;
    i: number;
    j: number;
    mean: number;
    std: number;
}