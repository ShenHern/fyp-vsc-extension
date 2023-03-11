/* eslint-disable no-var */
/* eslint-disable no-useless-escape */
/* eslint-disable prefer-const */
import { parser } from 'stream-json';
import { pick } from 'stream-json/filters/Pick';
import { streamArray } from 'stream-json/streamers/StreamArray';
import * as fs from 'fs';
import * as path from "path";
import { Problem, State } from './ext-types';
import { sha1 } from 'object-hash';


export function createJsonStream(tracePath: string) {
    const pipeline = fs.createReadStream(tracePath).pipe(parser());
    let groupsOfEvents = pipeline.pipe(pick({ filter: 'events' }));
    let arrOfGroupsStream = groupsOfEvents.pipe(streamArray());
    return arrOfGroupsStream;
}

export function extractNode(events: Array<{ [header: string]: any }>) {
    let components = splitComponents(events[0].component);
    let node = components[2];
    return node;
}

function splitComponents(s: string) {
    const regexName = /\w.*(?=::)/;
    const regexClazz = /[^\.]*(?=\/)/;
    const regexNode = /[^\/]*$/;

    let regName = regexName.exec(s);
    let compName = "";
    if (regName) {
        compName = regName[0];
    }
    let regClazz = regexClazz.exec(s);
    let compClazz = "";
    if (regClazz) {
        compClazz = regClazz[0];
    }
    let regNode = regexNode.exec(s);
    let compNode = "";
    if (regNode) {
        compNode = regNode[0];
    }

    return [compName, compClazz, compNode];
}

/**
 * function to copy over the baseline file when aligning for clock drift; resulting file is saved in 'aligned/' folder
 * @param groupEvents the list of events for a simulation/experiment group
 * @param wsPath workspace path
 * @param tracePathA path to the trace file
 * @param simulationGroup the simulation group
 */
export function copyGroup(groupEvents: Array<{ [header: string]: any }>, wsPath: string, tracePathA: string, simulationGroup: string) {
    let fileName = tracePathA.substring(tracePathA.lastIndexOf('/') + 1);
    let savePath = path.join(wsPath, "aligned/");
    console.log(savePath + fileName);
    let fd = fs.openSync(savePath + fileName, 'w');

    fs.writeSync(fd, `{"version": "1.0","group":"EventTrace","events":[\n`);
    fs.writeSync(fd, `    {"group":"${simulationGroup}","events":[\n`);
    for (let i = 0; i < groupEvents.length - 1; i++) {
        //for each event; where event is {time, component, stimulus, response}
        let event = groupEvents[i];
        if ("time" in event) {
            let time = event["time"];
            let alignedEvent = `     {"time":${time}, "component":"${event.component}", "threadID":"${event.threadID}", "stimulus":${JSON.stringify(event.stimulus)}, "response":${JSON.stringify(event.response)}},\n`;
            fs.writeSync(fd, alignedEvent);
        }
    }
    let lastEvent = groupEvents[groupEvents.length - 1];
    if ("time" in lastEvent) {
        let time = lastEvent["time"];
        let alignedEvent = `     {"time":${time}, "component":"${lastEvent.component}", "threadID":"${lastEvent.threadID}", "stimulus":${JSON.stringify(lastEvent.stimulus)}, "response":${JSON.stringify(lastEvent.response)}}\n`;
        fs.writeSync(fd, alignedEvent);
    }
    fs.writeSync(fd, `    ]}\n]}`);
    fs.close(fd);
}

export function noDupes(dataFrame: any[][]) {
    let seen: any = [];
    let dataFrameToReturn: any[][] = [];
    dataFrame.forEach((row) => {
        let id = row[0];

        if (seen.includes(id)) {
            let idx = dataFrame.indexOf(row);
            dataFrame.splice(idx, 1);
            return;
        }

        seen.push(id);
        dataFrameToReturn.push(row);
    });

    return dataFrameToReturn;
}

/**
 * function that extracts out tx events from a node, e.g. node A.
 * @param groupEvents group of events from trace.json file
 * @returns 2d array containing all tx events from a unet node, e.g., [[txID1, timing1], [txID2, timing2]]
 */
export function extractTxToDataframe(receiver: string, groupEvents: any) {
    let txDataframe: any[][] = [];
    groupEvents.forEach((event: any) => {
        //for each event; where event is {time, component, stimulus, response}
        if ("response" in event) {
            let response = event["response"];
            // TODO: response.receiver === receiver
            if (response.clazz === "org.arl.unet.phy.TxFrameReq") {
                //extract out the ID and timing
                let txID = response.messageID;
                let time = event["time"];
                let pair = [txID, time]; //pair of ID and time
                txDataframe.push(pair);
            }
        }
    });
    return txDataframe;
}

/**
 * function that extracts out rx events from a node, e.g. node A.
 * @param groupEvents group of events from trace.json file
 * @returns 2d array containing all rx events from a unet node, e.g., [[rxID1, timing1], [rxID2, timing2]]
 */
export function extractRxToDataframe(sender: string, groupEvents: any) {
    let rxDataframe: any[][] = [];
    groupEvents.forEach((event: any) => {
        //for each event; where event is {time, component, stimulus, response}
        if ("stimulus" in event) {
            let stimulus = event["stimulus"];
            // TODO: stimulus.sender === sender
            if (stimulus.clazz === "org.arl.unet.phy.RxFrameNtf") {
                //extract out the ID and timing
                let rxID = stimulus.messageID;
                let time = event["time"];
                let pair = [rxID, time]; //pair of ID and time
                rxDataframe.push(pair);
            }
        }
    });
    return rxDataframe;
}

/**
 * function that aligns a trace file's timing for clock drift; resulting file is saved in 'aligned/' folder
 * @param groupEvents the list of events for a simulation/experiment group
 * @param clockDrift the clockdrift in milliseconds
 * @param wsPath workspace path
 * @param tracePathB path to the second trace file
 * @param simulationGroup the simulation group
 */
export function align(groupEvents: Array<{ [header: string]: any }>, clockDrift: number, wsPath: string, tracePathB: string, simulationGroup: string) {
    let fileName = tracePathB.substring(tracePathB.lastIndexOf('/') + 1);
    let savePath = path.join(wsPath, "aligned/");
    console.log(savePath + fileName);
    let fd = fs.openSync(savePath + fileName, 'w');

    fs.writeSync(fd, `{"version": "1.0","group":"EventTrace","events":[\n`);
    fs.writeSync(fd, `    {"group":"${simulationGroup}","events":[\n`);
    for (let i = 0; i < groupEvents.length - 1; i++) {
        //for each event; where event is {time, component, stimulus, response}
        let event = groupEvents[i];
        if ("time" in event) {
            let time = event["time"];
            let alignedEvent = `     {"time":${time - clockDrift}, "component":"${event.component}", "threadID":"${event.threadID}", "stimulus":${JSON.stringify(event.stimulus)}, "response":${JSON.stringify(event.response)}},\n`;
            fs.writeSync(fd, alignedEvent);
        }
    }
    let lastEvent = groupEvents[groupEvents.length - 1];
    if ("time" in lastEvent) {
        let time = lastEvent["time"];
        let alignedEvent = `     {"time":${time - clockDrift}, "component":"${lastEvent.component}", "threadID":"${lastEvent.threadID}", "stimulus":${JSON.stringify(lastEvent.stimulus)}, "response":${JSON.stringify(lastEvent.response)}}\n`;
        fs.writeSync(fd, alignedEvent);
    }
    fs.writeSync(fd, `    ]}\n]}`);
    fs.close(fd);
}

/**
 * BLAS function to match tx event with rx event from a pair of nodes. Credit: https://github.com/org-arl/ARLToolkit.jl/blob/master/src/BLAS.jl
 * @returns a promise that resolves to
 *      finalAssoc --> 
        [
        [[txID, timing], [rxID, timing], deltaT]],
        [[txID, timing], [rxID, timing], deltaT]],...
        ]
*/
export async function assocRxTx(p: Problem, nhypothesis = 30) {


    return import("ts-gaussian").then((gausLib) => {
        let firstState: State = {
            score: 0,
            backlink: undefined,
            assoc: undefined,
            i: 0,
            j: 0,
            mean: p.mean,
            std: p.std
        };

        // console.log(p.delay(12,12));
        // console.log(p.passoc(12,12));
        // console.log(p.pfalse(12));
        let setOfStates = [firstState];

        for (let j = 0; j < p.rx.length; j++) {
            let setOfStatesPlus: State[] = [];
            let rx = p.rx[j][1];
            for (let state of setOfStates) {
                let timeDistribution = new gausLib.Gaussian(state.mean, state.std ** 2); // Gaussian distribution here expects variance which is std^2
                let pfalse = p.pfalse(rx);
                let prob = pfalse * timeDistribution.pdf(state.mean);
                setOfStatesPlus.push({
                    score: state.score + Math.log10(prob),
                    backlink: state,
                    assoc: undefined,
                    i: state.i,
                    j: j,
                    mean: state.mean,
                    std: state.std
                });

                for (let i = 0; i < p.tx.length; i++) {
                    let tx = p.tx[i][1];    //iterate through all tx timings
                    let deltaTime = (rx - tx) - p.delay(tx, rx);
                    if (deltaTime < -3 * state.std) {
                        break;
                    }

                    prob = (1 - pfalse) * timeDistribution.pdf(deltaTime) * p.passoc(tx, rx);
                    let assocPair = [i, j];
                    // console.log(assocPair);
                    let stateToPush = {
                        score: state.score + Math.log10(prob),
                        backlink: state,
                        assoc: assocPair,
                        i: i,
                        j: j,
                        mean: deltaTime,
                        std: state.std
                    };
                    // console.log(stateToPush);
                    setOfStatesPlus.push(stateToPush);
                }
            }
            setOfStatesPlus.sort((a, b) => b.score - a.score); //reverse order sorted
            if (setOfStates[0].score === Infinity) {
                console.log(`Ran out of possibilities for RX[${j}]!`);
                console.log(setOfStatesPlus);
                break;
            }

            setOfStatesPlus.filter(s => s.score >= setOfStatesPlus[0].score - 1);
            setOfStatesPlus.filter(s => !isDuplicate(s, setOfStatesPlus));
            if (setOfStatesPlus.length > nhypothesis) {
                setOfStatesPlus = setOfStatesPlus.slice(0, nhypothesis);
            }
            setOfStates = setOfStatesPlus;
        }
        let assoc: any[][] = [];    //assoc --> [[i1, j1], [i2, j2]]
        let state: State | undefined = setOfStates[0];
        console.log(setOfStates);
        while (state !== undefined) {
            if ((state.assoc !== undefined)) {
                assoc.push(state.assoc);    // state.assoc --> [i, j] where i: tx idx; j: rx idx
            }
            state = state.backlink;
        }
        assoc.sort((a, b) => a[0] - b[0]);  // sort by tx idx
        let finalAssoc: any[][] = [];
        for (let pair of assoc) {
            let tx = p.tx[pair[0]];
            let rx = p.rx[pair[1]];
            let deltaT = rx[1] - tx[1] - p.delay(tx[1], rx[1]);
            let row = [tx, rx, deltaT];
            finalAssoc.push(row);
        }
        /* finalAssoc --> 
        [[[txID, timing], [rxID, timing], deltaT]],
        [[txID, timing], [rxID, timing], deltaT]],...
        ]*/
        return finalAssoc;
    });
}

function isDuplicate(state: State, setOfStates: State[]): boolean {
    for (let s of setOfStates) {
        if (s === state) {
            continue;
        } else if (s.i !== state.i || s.j !== state.j || s.assoc !== state.assoc) {
            continue;
        } else if (state.score > s.score) {
            continue;
        } else if (state.score < s.score) {
            return true;
        } else if (sha1(state) < sha1(s)) {
            return true;    //if scores are same, discard state if it has a lower hash value than s. Arbitrary tiebreaker
        }
    }
    return false;
}

/**
 * function to merge individual aligned trace files
 * @param alignedPath the path to the folder containing all aligned trace files
 * @param simulationGroup the name of the simulation group that the user chose
 * @returns the path of where the merged trace file is saved e.g. D:\unet-3.4.0\aligned\traceFINAL.json
 */
export function merge(alignedPath: string) {

    let final = {
        version: '1.0',
        group: 'EventTrace',
        events: [{
            group: 'SIMULATION 1',
            events: []
        }]
    };

    let files = fs.readdirSync(alignedPath);
    for (let file of files) {
        if (file === 'traceFINAL.json') {
            continue;
        }
        let raw = fs.readFileSync(`${alignedPath}/${file}`, { encoding: "utf8" });
        let obj = JSON.parse(raw);
        obj.events.forEach((group: { [header: string]: any }) => {
            final.events[0].group = obj.events[0].group;
            final.events[0].events = final.events[0].events.concat(group.events);
        });
    }
    final.events[0].events.sort((a: { [header: string]: any }, b: { [header: string]: any }) => {
        return a.time - b.time;
    });
    fs.writeFileSync(alignedPath + '/traceFINAL.json', JSON.stringify(final, null, 4));
    // console.log(final);
    return alignedPath + '/traceFINAL.json';
}

function makeid(length: number) {
    let result = '';
    let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

/**
 * inserts halfduplex event into combined trace file
 * @param combinedFilePath the path of the trace file with all combined events after alignment
 */
export function half(combinedFilePath: string) {

    //const files = './tests/test.json';
    //let obj = JSON.parse(files);
    let file = fs.readFileSync(combinedFilePath, { encoding: 'utf8' });
    let obj = JSON.parse(file);
    let events = obj.events[0].events;
    let evcopy : any = [];
    let length = events.length;
    var i;
    var j;
    for (i = 0; i < length; i++) {
        evcopy.push(events[i]);
        if (events[i].response.clazz.includes('TxFrame')) {
            for (j = i; j < i + 6; j++) {
                if (events[j].stimulus.clazz.includes('RxFrame')) {
                    let inform = { "time": [], "component": "", "threadID": "", "stimulus": { "clazz": "", "messageID": "", "performative": "", "sender": "", "recipient": "" }, "response": { "clazz": "", "messageID": "", "performative": "", "recipient": "" } };
                    let agree = { "time": [], "component": "", "threadID": "", "stimulus": { "clazz": "", "messageID": "", "performative": "", "sender": "", "recipient": "" }, "response": { "clazz": "", "messageID": "", "performative": "", "recipient": "" } };
                    let txnotif = { "time": [], "component": "", "threadID": "", "stimulus": { "clazz": "", "messageID": "", "performative": "", "sender": "", "recipient": "" }, "response": { "clazz": "", "messageID": "", "performative": "", "sender": "", "recipient": "" } };
                    let rxnotif = { "time": [], "component": "", "threadID": "", "stimulus": { "clazz": "", "messageID": "", "performative": "", "sender": "", "recipient": "" }, "response": { "clazz": "", "messageID": "", "performative": "", "sender": "", "recipient": "" } };
                
                    let sender = events[i];
                    let receive = events[j];
                    inform.time = sender.time + 3;
                    inform.component = "phy::org.arl.unet.sim.HalfDuplexModem/" + sender.component.substr(sender.component.length - 1);
                    inform.threadID = sender.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe;
                    inform.stimulus.clazz = "org.arl.unet.phy.TxFrameReq";
                    inform.stimulus.messageID = sender.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe
                    inform.stimulus.performative = "REQUEST";
                    inform.stimulus.sender = sender.stimulus.recipient;
                    inform.stimulus.recipient = "phy";
                    inform.response.clazz = "org.arl.unet.sim.HalfDuplexModem$TX";
                    inform.response.messageID = makeid(8) + "-" + makeid(4) + "-" + makeid(4) + "-" + makeid(4) + "-" + makeid(11);//9913082f-0891-40be-8b8a-c62cf68063ae
                    inform.response.performative = "INFORM";
                    inform.response.recipient = "phy";
                    agree.time = sender.time + 6;
                    agree.component = "phy::org.arl.unet.sim.HalfDuplexModem/" + sender.component.substr(sender.component.length - 1);
                    agree.threadID = sender.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe;
                    agree.stimulus.clazz = "org.arl.unet.phy.TxFrameReq";
                    agree.stimulus.messageID = sender.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe
                    agree.stimulus.performative = "REQUEST";
                    agree.stimulus.sender = sender.stimulus.recipient;
                    agree.stimulus.recipient = "phy";
                    agree.response.clazz = "org.arl.fjage.Message";
                    agree.response.messageID = inform.response.messageID;//9913082f-0891-40be-8b8a-c62cf68063ae
                    agree.response.performative = "AGREE";
                    agree.response.recipient = "phy";
                    rxnotif.time = sender.time + 12;
                    rxnotif.component = "phy::org.arl.unet.sim.HalfDuplexModem/" + receive.component.substr(receive.component.length - 1);
                    rxnotif.threadID = inform.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe;
                    rxnotif.stimulus.clazz = "org.arl.unet.sim.HalfDuplexModem$TX";
                    rxnotif.stimulus.messageID = inform.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe
                    rxnotif.stimulus.performative = "INFORM";
                    rxnotif.stimulus.sender = "phy";
                    rxnotif.stimulus.recipient = "phy";
                    rxnotif.response.clazz = "org.arl.unet.phy.RxFrameNtf";
                    rxnotif.response.messageID = receive.threadID;//12995b36-b42d-4277-bd2d-9936ee4a2d29
                    rxnotif.response.performative = "INFORM";
                    rxnotif.response.sender = "phy";
                    rxnotif.response.recipient = "#phy__ntf";
                    txnotif.time = sender.time + 9;
                    txnotif.component = "phy::org.arl.unet.sim.HalfDuplexModem/" + sender.component.substr(sender.component.length - 1);
                    txnotif.threadID = sender.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe;
                    txnotif.stimulus.clazz = "org.arl.unet.sim.HalfDuplexModem$TX";
                    txnotif.stimulus.messageID = inform.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe
                    txnotif.stimulus.performative = "INFORM";
                    txnotif.stimulus.sender = "phy";
                    txnotif.stimulus.recipient = "phy";
                    txnotif.response.clazz = "org.arl.unet.phy.TxFrameNtf";
                    txnotif.response.messageID = makeid(8) + "-" + makeid(4) + "-" + makeid(4) + "-" + makeid(4) + "-" + makeid(11);//c26d1081-48fd-4afe-af0d-426e5e6c7d21
                    txnotif.response.performative = "INFORM";
                    txnotif.response.sender = "phy";
                    txnotif.response.recipient = sender.stimulus.recipient;
                    evcopy.push(inform, agree, txnotif, rxnotif);
                    // console.log(sender);
                    break;
                }
            }
        }
    }
    obj.events[0].events = evcopy;
    fs.writeFileSync(combinedFilePath, JSON.stringify(obj, null, 4));
    console.log(obj);
}