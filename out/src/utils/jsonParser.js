import { analyse, sequence, sortTreeByTime } from './functions';
export const parser = (json) => {
    const groupMap = new Map();
    for (let i = 0; i < json.events.length; i++) {
        groupMap.set(i, json.events[i]);
    }
    return groupMap;
};
export const format = (traces) => {
    const sequenceResult = sequence(traces);
    const actors = sequenceResult[0];
    if (sequenceResult === undefined) {
        throw new Error("Could not find sequence in trace.");
    }
    const output = sortTreeByTime(sequenceResult[2]);
    const result = [];
    result.push(actors);
    result.push(output);
    return result;
};
export const analyseTrace = (json, selectedSim) => {
    const traces = analyse(json.get(selectedSim).events);
    return (traces);
};
export const eventsArray = (json) => {
    const eventArray = [];
    for (let i = 0; i < json.events.length; i++) {
        eventArray.push(json.events[i].group);
    }
    return eventArray;
};
