const fs = require('fs');
const testFolder = './tests/';

interface Event {
    time: number;
    clazz: string;
    node: string;
  }

let transmitEvents:Event[] = [];
let receiveEvents: Event[] = [];
const rtxpairs:[Event, Event, number][] = [];

const pair = () => {
  const files = fs.readdirSync(testFolder);

  files.forEach(file => {
    let raw = fs.readFileSync(`${testFolder}/${file}`);
    let obj = JSON.parse(raw);

    obj
      .filter(item => item.response.clazz.includes('TxFrame'))
      .map(item => {
        let node = item.component[item.component.length - 1];
        return {time: item.time, clazz: 'transmit', node: node }})
      .forEach(item => transmitEvents.push(item));

    obj
      .filter(item => item.stimulus.clazz.includes('RxFrame'))
      .map(item => {
        let node = item.component[item.component.length - 1];
        return {time: item.time, clazz: 'receive', node: node }})
      .forEach(item => receiveEvents.push(item));      
  });

  for (const receiveEvent of receiveEvents) {
    let closestTransmitEvent: Event | undefined;
    let closestDifference = Infinity;
    for (const transmitEvent of transmitEvents) {
      const difference = Math.abs(receiveEvent.time -transmitEvent.time);
      
      if (difference < closestDifference) {
        closestDifference = difference;
        closestTransmitEvent = transmitEvent;
      }
    }
  
    // Add the pair of transmit and receive events to the list of pairs
    if (closestTransmitEvent) {
      rtxpairs.push([closestTransmitEvent,receiveEvent, closestDifference]);
      transmitEvents = transmitEvents.filter((e) => e !== closestTransmitEvent);
    }
  }
}

