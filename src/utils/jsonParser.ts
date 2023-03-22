import { sequence, sortTreeByTime } from './functions';

export const format = (traces: any) => {
  const sequenceResult = sequence(traces);
  const actors = sequenceResult[0];
  if (sequenceResult === undefined) {
    throw new Error("Could not find sequence in trace.");
  }
  const output = sortTreeByTime(sequenceResult[2]);
  const result : Array<any>[] = [];
  result.push(actors);
  result.push(output);
  return result;
};
