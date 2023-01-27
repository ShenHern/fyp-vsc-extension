import { NodeData } from "reaflow";
import { analyse, mermaid, sequence, sortTreeByTime, createHTMLContent } from './functions';
import { TreeCache, TreeNode } from "./types";

export const parser = (jsonStr: string) => {
  const json = JSON.parse(jsonStr);
  const groupMap = new Map<number, any>();

  for (let i = 0; i < json.events.length; i++) {
    groupMap.set(i, json.events[i]);
  }
  // for (let i = 0; i < json.events.length; i++) {
  //   const traces = analyse(json.events[i].events);
  //   const sequenceResult = sequence(traces[3][2]);
  //   if (sequenceResult === undefined) {
  //     throw new Error("Could not find sequence in trace.");
  //   }
  //   // console.log(sequenceResult[2]); //root of tree after sequencing a trace
  //   const output = sortTreeByTime(sequenceResult[2])

  //   // return format(output);
  //   return output;
// }
  return groupMap;
};

export const format = (json: Array<{ [header: string]: any }>) => {
  try {
    if (json !== undefined) {
      const traces = analyse(json);
      const sequenceResult = sequence(traces[3][2]);
      if (sequenceResult === undefined) {
        throw new Error("Could not find sequence in trace.");
      }
      // console.log(sequenceResult[2]); //root of tree after sequencing a trace
      const output = sortTreeByTime(sequenceResult[2]);
      return nodeFormat(output);
    }
  }
  catch {
    return "Could not process trace";
  }
};

export const eventsArray = (jsonStr: string) => {
  const json = JSON.parse(jsonStr);
  const eventArray : any = [];
  for (let i = 0; i < json.events.length; i++) {
    eventArray.push(json.events[i].group);
  }
  return eventArray;
};

export function nodeFormat(output : TreeNode[]) {

  console.log(output);
  const nodes : NodeData[] = [];

  for(let i = 0; i < Object.keys(output).length; i++) {
    const currNode =  {
      id: `${output[i].id}`,
      text: `${output[i].time}`
    };
    nodes.push(currNode);
  }
  return nodes;
}