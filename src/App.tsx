/* eslint-disable prefer-const */
import React, { useState, useRef } from "react";
import { eventsArray } from "./utils/jsonParser";
import { parser, analyseTrace, format, edgeFormat } from "./utils/jsonParser";
import CytoscapeComponent from "react-cytoscapejs"; 
import styles from './mystyle.module.css';  

let InitialCytoscapeStylesheet: Array<cytoscape.Stylesheet> = [ 
  { 
    selector: "node", 
    style: { 
      "background-color": "#1976d2", 
      width: "label", 
      height: "label", 
      // a single "padding" is not supported in the types :( 
      "padding-top": "10", 
      "padding-bottom": "10", 
      "padding-left": "10", 
      "padding-right": "10", 
      // this fixes the text being shifted down on nodes (sadly no fix for edges, but it's not as obvious there without borders) 
      "text-margin-y": -3, 
      shape: "round-rectangle", 
    }, 
  }, 
  { 
    selector: "node[label]", 
    style: { 
      label: "data(label)", 
      "font-size": "20", 
      color: "white", 
      "text-halign": "center", 
      "text-valign": "center", 
    }, 
  },
  { 
    selector: "edge", 
    style: { 
      "line-color": "white",
      "target-arrow-color":"white",
      "curve-style": "bezier", 
      "target-arrow-shape": "triangle", 
      width: 1.5, 
    }, 
  }, 
  { 
    selector: "edge[label]", 
    style: { 
      label: "data(label)", 
      "font-size": "15", 
      "text-background-color": "white", 
      "text-background-opacity": 1, 
      "text-background-padding": "2px", 
      "text-margin-y": -4, 
      // so the transition is selected when its label/name is selected 
      "text-events": "yes",
      shape: "round-rectangle",
    }, 
  }, 
];

const App: React.FC = () => {
  const [jsonData, setJsonData] = useState<Map<number, any>>();
  const [dropDown, setDropdown] = useState<string[]>([]);
  const [trace, setTrace] = useState<any[]>([]);
  const [elements, setElements] = useState<any>([]);
  const [cytoscapeStylesheet, setCytoscapeStylesheet] = useState<Array<cytoscape.Stylesheet>>(InitialCytoscapeStylesheet);

  window.addEventListener("message", (event) => {
    console.log("message received");
    const newJsonData = event.data.json;
    const grpEvents = parser(newJsonData);
    setJsonData(grpEvents)
    setDropdown(eventsArray(newJsonData));
  });

  const handleSelect = (sim : string) => {
    const index = dropDown.indexOf(sim);
    const traceArray = analyseTrace(jsonData, index);
    setTrace(traceArray);
  }

  const handleSelectTrace = (trace : string) => {
    // console.log(format(JSON.parse(trace)));
    // setNodes(format(JSON.parse(trace)));
    let [ actors, output ] = format(JSON.parse(trace));
    const elements : any[] = [];
    const x = 100;
    const y = 100;
    const node_distance = 300;
    actors = actors.flat()
    for (let i = 0; i < actors.flat().length; i++) {
      actors.splice(i, 1);
    }

      // { data: { id: 'websh_A', label: 'websh_A' }, position: { x: 100, y: 100 } }, 
      // { data: { source: 'ranging_A', target: 'phy_A', label: 'ClearReq' } },
    for (let j = 0; j < actors.length; j++) {
      const nodes_start = {
        data: {
          id: `${actors[j]}-start`,
          label: `${actors[j]}`
        },
        position: {x: x+(j*node_distance), y: y}
      }
      const nodes_end = {
        data: {
          id: `${actors[j]}-end`,
          label: `${actors[j]}`
        },
        position: {x: x+(j*node_distance), y: y+((output.length+1)*100)}
      }
      const start_end = {
        data: {
          source: `${actors[j]}-start`,
          target: `${actors[j]}-end`
        }
      }
      elements.push(nodes_start);
      elements.push(nodes_end);
      elements.push(start_end);

    }

    const event_x = 100;
    let event_y = 200;
    for (let k = 0; k < output.length; k++) {
      const fromIndex = actors.indexOf(output[k].sender);
      const toIndex = actors.indexOf(output[k].recipient)
      const nodeEvent_from = {
        data: {
          id: `event${k}-from`,
          label: `${output[k].sender}`
        },
        position: {x: event_x+(fromIndex*node_distance), y: event_y}
      }
      const nodeEvent_to = {
        data: {
          id: `event${k}-to`,
          label: `${output[k].recipient}`
        },
        position: {x: event_x+(toIndex*node_distance), y: event_y}
      }
      const style1 : cytoscape.Stylesheet = { 
        selector: `#event${k}-from`, 
        style: { 
          shape: "ellipse",
          width: "1",
          height: "1"
        }
      }
      const style2 : cytoscape.Stylesheet = { 
        selector: `#event${k}-to`, 
        style: { 
          shape: "ellipse",
          width: "1",
          height: "1"
        }
      }
      const newStylesheet = InitialCytoscapeStylesheet;
      newStylesheet.push(style1);
      newStylesheet.push(style2);
      setCytoscapeStylesheet(newStylesheet);
      const edge = {
        data: {
          source: `event${k}-from`,
          target: `event${k}-to`,
          label: `${output[k].clazz}`
        }
      }
      event_y += 100;
      elements.push(nodeEvent_from);
      elements.push(nodeEvent_to);
      elements.push(edge);
    }
    
    setElements(elements);
  }

  React.useEffect(() => {
    console.log(cytoscapeStylesheet);
  }, [cytoscapeStylesheet]);

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
              <option key={index} value={JSON.stringify(trace[2])}>Trace: {trace[1]}</option>
            )
          })
          : 
          "No traces found"
        }
      </select>
        </div>
      <div>
        <CytoscapeComponent className={styles.body} 
        elements={elements} 
        style={{ 
          height: "100%", 
          position: "absolute", 
          width: "100%", 
        }} 
        stylesheet={cytoscapeStylesheet}
        />
      </div>
    </div>
  );
};

export default App;


