import { EdgeData, NodeData } from "reaflow";
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

export const format = (traces: any) => {
  const sequenceResult = sequence(traces);
  const actors = sequenceResult[0];
  if (sequenceResult === undefined) {
    throw new Error("Could not find sequence in trace.");
  }
  // console.log(sequenceResult[2]); //root of tree after sequencing a trace
  const output = sortTreeByTime(sequenceResult[2]);
  // return nodeFormat(output);
  const result : Array<any>[] = [];
  result.push(actors);
  result.push(output);
  return result;
};

export const analyseTrace = (json: any, selectedSim: number) => {
  const traces = analyse(json.get(selectedSim).events);
  return(traces);
}

export const eventsArray = (jsonStr: string) => {
  const json = JSON.parse(jsonStr);
  const eventArray : any = [];
  for (let i = 0; i < json.events.length; i++) {
    eventArray.push(json.events[i].group);
  }
  return eventArray;
};

function nodeFormat(output : TreeNode[]) {

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

export function edgeFormat(nodes : NodeData[]) {
  const edges : EdgeData[] = [];

  for(let i = 0; i < nodes.length-1; i++) {
    const currEdge = {
      id: `${nodes[i].id}+${nodes[i+1].id}`,
      from: `${nodes[i].id}`,
      to: `${nodes[i+1].id}`
    };
    edges.push(currEdge);
  }
  return(edges);
}