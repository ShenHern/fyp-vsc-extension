import { NodeData } from "reaflow";
import { analyse, mermaid, sequence, sortTreeByTime, createHTMLContent } from './functions';
import { TreeCache, TreeNode } from "./types";

export const parser = (jsonStr: string) => {
  const json = JSON.parse(jsonStr);

  for (let i = 0; i < json.events.length; i++) {
    const traces = analyse(json.events[i].events);
    const sequenceResult = sequence(traces[3][2]);
    if (sequenceResult === undefined) {
      throw new Error("Could not find sequence in trace.");
    }
    // console.log(sequenceResult[2]); //root of tree after sequencing a trace
    const output = sortTreeByTime(sequenceResult[2])

    return format(output);
}};

export function format(output : TreeNode[]) {

  const nodes : any[] = [];

  for(let i = 0; i < Object.keys(output).length; i++) {
    const currNode =  {
      id: `${output[i].id}`,
      text: `${output[i].time}`
    };
    nodes.push(currNode);
  }
  return nodes;
}