import { EdgeData, NodeData } from "reaflow";
import { analyse, mermaid, sequence, sortTreeByTime, createHTMLContent } from './functions';
import { TreeCache, TreeNode } from "./types";

export const parser = (jsonStr: string) => {
  const json = JSON.parse(jsonStr);
  const groupMap = new Map<number, any>();

  for (let i = 0; i < json.events.length; i++) {
    groupMap.set(i, json.events[i]);
  }
  return groupMap;
};

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
