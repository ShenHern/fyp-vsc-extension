/* eslint-disable prefer-const */
import React, { useState, useRef, useReducer} from "react";
import { eventsArray } from "./utils/jsonParser";
import { parser, analyseTrace, format, edgeFormat } from "./utils/jsonParser";
import CytoscapeComponent from "react-cytoscapejs"; 
import styles from "./mystyle.module.css";
import Cytoscape from "cytoscape";
import { SidePane } from "react-side-pane";
import Component from "./utils/sidepanel";
import { CytoscapeStylesheet, sidePanelOptions } from "./utils/stylingOptions";
const _ = require('lodash');
const App: React.FC = () => {

  const [open, dispatchOpen] = useReducer((prev) => !prev, false);
  const [jsonData, setJsonData] = useState<Map<number, any>>();
  const [dropDown, setDropdown] = useState<string[]>([]);
  const [trace, setTrace] = useState<any[]>([]);
  const [elements, setElements] = useState<any>([]);
  const [sidePanelInfo, setSidePanelInfo] = useState<any>();
  const [simNumber, setSimNumber] = useState<number>();
  
  const cyRef = useRef<Cytoscape.Core>();

  // This effect runs once on mount and handles setting up imperative
  // event listeners on the Cytoscape core ref
  React.useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }
    cy.on("select", "edge", (event) => {
      if (!event.target[0].locked()) {
        setSidePanelInfo(event.target[0].data().info);
        dispatchOpen();
      }
    });

  }, []);

  window.addEventListener("message", (event) => {
    const newJsonData = event.data.json;
    const grpEvents = parser(newJsonData);
    setJsonData(grpEvents)
    setDropdown(eventsArray(newJsonData));
  });

  const handleSelect = (sim : string) => {
    const index = dropDown.indexOf(sim);
    setSimNumber(index);
    const traceArray = analyseTrace(jsonData, index);
    setTrace(traceArray);
  }

  const handleSelectTrace = (trace : string) => {
    let [ actors, output ] = format(JSON.parse(trace)[2]);
    const newElements : any[] = [];
    const x = 100;
    const y = 100;
    const node_distance = 300;
    actors = actors.flat()
    for (let i = 0; i < actors.flat().length; i++) {
      actors.splice(i, 1);
    }

    for (let j = 0; j < actors.length; j++) {
      const nodes_start = {
        data: {
          id: `${simNumber}-${JSON.parse(trace)[1]}-${actors[j]}-start`,
          label: `${actors[j]}`
        },
        position: {x: x+(j*node_distance), y: y},
        locked: true
      }
      const nodes_end = {
        data: {
          id: `${simNumber}-${JSON.parse(trace)[1]}-${actors[j]}-end`,
          label: `${actors[j]}`
        },
        position: {x: x+(j*node_distance), y: y+((output.length+1)*50)},
        locked: true
      }
      const start_end = {
        data: {
          source: `${simNumber}-${JSON.parse(trace)[1]}-${actors[j]}-start`,
          target: `${simNumber}-${JSON.parse(trace)[1]}-${actors[j]}-end`,
        },
        locked: true
      }
      newElements.push(nodes_start);
      newElements.push(JSON.parse(JSON.stringify(nodes_end)));
      newElements.push(start_end);
    }

    const event_x = 100;
    let event_y = 150;
    for (let k = 0; k < output.length; k++) {
      const fromIndex = actors.indexOf(output[k].sender);
      const toIndex = actors.indexOf(output[k].recipient)
      const nodeEvent_from = {
        data: {
          id: `${simNumber}-${JSON.parse(trace)[1]}-${output[k].id}-from`,
          label: `${output[k].sender}`
        },
        position: {x: event_x+(fromIndex*node_distance), y: event_y},
        locked: true
      }
      const nodeEvent_to = {
        data: {
          id: `${simNumber}-${JSON.parse(trace)[1]}-${output[k].id}-to`,
          label: `${output[k].recipient}`
        },
        position: {x: event_x+(toIndex*node_distance), y: event_y},
        locked: true
      }
      const edge = {
        data: {
          source: `${simNumber}-${JSON.parse(trace)[1]}-${output[k].id}-from`,
          target: `${simNumber}-${JSON.parse(trace)[1]}-${output[k].id}-to`,
          label: `${output[k].clazz}`,
          // time: `${output[k].time}`,
          // id: `${output[k].id}`,
          // parent: `${output[k].parent}`,
          // children: `${output[k].children}`,
          // recipient: `${output[k].recipient}`,
          // sender: `${output[k].sender}`,
          info: output[k]
        },
      }
      event_y += 50;
      newElements.push(nodeEvent_from);
      newElements.push(nodeEvent_to);
      newElements.push(edge);
    }
    setElements(newElements);
  }

  return (
    <div>
      <div className={styles.select}>
      <select onChange={(e) => handleSelect(e.target.value)}>
        <option value="0">Select Simulation</option>
        {
          dropDown &&
          dropDown !== undefined ?
          dropDown.map((sim, index) => {
            return(
              <option key={index} value={sim}>{sim}</option>
            )
          })
          : 
          "No simulation found"
        }
      </select>
      <br></br>
      <select onChange={(f) => handleSelectTrace(f.target.value)}>
        <option value="0">Select Trace</option>
        {
          trace &&
          trace !== undefined ?
          trace.map((trace, index) => {
            return(
              <option key={index} value={JSON.stringify(trace)}>Trace: {trace[1]}</option>
            )
          })
          : 
          "No traces found"
        }
      </select>
        </div>
      <div>
        <CytoscapeComponent className={styles.body} 
        elements={[ ...elements ]}
        style={{ 
          height: "100%", 
          position: "absolute", 
          width: "100%", 
        }} 
        stylesheet={CytoscapeStylesheet}
        cy={(cy): void => {
          cyRef.current = cy;
        }}
        />
      </div>
      <SidePane
        open={open}
        width={50}
        {...sidePanelOptions}
        onClose={dispatchOpen}
      >
        <Component
          onClose={dispatchOpen}
          {...sidePanelInfo}
        />
      </SidePane>
    </div>
  );
};

export default App;


