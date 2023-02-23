/* eslint-disable prefer-const */
import React, { useState, useRef, useReducer} from "react";
import { eventsArray } from "./utils/jsonParser";
import { parser, analyseTrace, format } from "./utils/jsonParser";
import CytoscapeComponent from "react-cytoscapejs"; 
import styles from "./mystyle.module.css";
import Cytoscape from "cytoscape";
import { SidePane } from "react-side-pane";
import { CytoscapeStylesheet, sidePanelOptions } from "./utils/stylingOptions";
import styled from "styled-components";

const blue = "#007acc";
const red = "#D16969";
const green = "#6A9955";

const Button1 = styled.button`
display: inline-block;
border-radius: 3px;
padding: 0.5rem 0;
margin: 0.5rem 1rem;
width: 11rem;
background: white;
color: black;
border: 2px solid white;
&:hover {
  background-color: ${blue};
  color: white;
}
`;

const Button2 = styled.button`
display: inline-block;
border-radius: 3px;
padding: 0.5rem 0;
margin: 0.5rem 1rem;
width: 15rem;
background: white;
color: black;
border: 2px solid ${green};
&:hover {
background-color: ${green};
color: white;
}
`;

const Button3 = styled.button`
display: inline-block;
border-radius: 3px;
padding: 0.5rem 0;
margin: 0.5rem 1rem;
width: 15rem;
background: white;
color: black;
border: 2px solid ${red};
&:hover {
  background-color: ${red};
  color: white;
}
`;

const Button4 = styled.button`
display: inline-block;
border-radius: 3px;
padding: 0.5rem 0;
margin: 0.5rem 1rem;
width: 15rem;
background: white;
color: black;
border: 2px solid ${blue};
&:hover {
  background-color: ${blue};
  color: white;
}
`;

const App: React.FC = () => {

  const [open, dispatchOpen] = useReducer((prev) => !prev, false);
  const [jsonData, setJsonData] = useState<Map<number, any>>();
  const [dropDown, setDropdown] = useState<string[]>([]);
  const [trace, setTrace] = useState<any[]>([]);
  const [elements, setElements] = useState<any>([]);
  const [sidePanelInfo, setSidePanelInfo] = useState<any>();
  const [simNumber, setSimNumber] = useState<number>();
  const [IDTrace, setIDTrace] = useState<string>();
  const [selectedEdge, setSelectedEdge] = useState<string>();
  const [highlightZoom, setHighlightZoom] = useState<any[]>();

  const cyRef = useRef<Cytoscape.Core>();

  // This effect runs once on mount and handles setting up imperative
  // event listeners on the Cytoscape core ref
  React.useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }
    cy.on("select", "edge", (event) => {
      cy.edges().removeClass("Children");
      cy.edges().removeClass("Parent");
      if (!event.target[0].locked()) {
        console.log(event.target[0].data().info)
        cy.animate({
          fit: {
            eles: event.target,
            padding: 200
          }
        }, {
          duration: 200
        });
        setSidePanelInfo(event.target[0].data().info);
        dispatchOpen();
        setSelectedEdge(`${event.target[0].data().id}`)
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
    const cy = cyRef.current;
    setIDTrace(JSON.parse(trace)[1]);
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
          id: `${simNumber}-${JSON.parse(trace)[1]}-${output[k].id}`,
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

  // React.useEffect(() => {
  //   const cy = cyRef.current;
  //   if (!cy) {
  //     return;
  //   }
  //   const from = cy.getElementById(`${prevEdge}-from`);
  //   const to = cy.getElementById(`${prevEdge}-to`)
  //   if (open === false) {
  //     from.edgesTo(to).unselect();
  //   }
  // }, [open])
  
  function Component({onClose, ...props}) {
  
    const children = Object.keys(props.children);
    const childrenButton = children.map((child) => {
      return <div className={styles.button}><Button2 onClick={() => example(child)}>{child}<br />{props.children[child].clazz}</Button2></div>
    });
  
    const parents = Object.keys(props.parent);
    const parentsButton = parents.map((parent) => {
      return <div className={styles.button}><Button3 onClick={() => example(parent)}>{parent}<br />{props.parent[parent].clazz}</Button3></div>
    });
  
    function example(id) {
      const cy = cyRef.current;
      if (!cy) {
        return;
      }
      const from = cy.getElementById(`${simNumber}-${IDTrace}-${id}-from`);
      const to = cy.getElementById(`${simNumber}-${IDTrace}-${id}-to`);
      const prevFrom = cy.getElementById(`${selectedEdge}-from`);
      const prevTo = cy.getElementById(`${selectedEdge}-to`)
      from.edgesTo(to).select();
      prevFrom.edgesTo(prevTo).unselect();
      dispatchOpen();
    }

    function HighlightParentChild() {
      const cy = cyRef.current;
      if (!cy) {
        return;
      }
      const highlighted : any[] = []
      const children = Object.keys(props.children);
      for (let i = 0; i < children.length; i++) {
        const from = cy.getElementById(`${simNumber}-${IDTrace}-${children[i]}-from`);
        const to = cy.getElementById(`${simNumber}-${IDTrace}-${children[i]}-to`);
        from.edgesTo(to).addClass("Children");
        highlighted.push(from.edgesTo(to));
      }
      const parents = Object.keys(props.parent);
      for (let j = 0; j < parents.length; j++) {
        const from = cy.getElementById(`${simNumber}-${IDTrace}-${parents[j]}-from`);
        const to = cy.getElementById(`${simNumber}-${IDTrace}-${parents[j]}-to`);
        from.edgesTo(to).addClass("Parent");
        highlighted.push(from.edgesTo(to));
      }
      setHighlightZoom(highlightZoom);
    }

    React.useEffect(() => {
      const cy = cyRef.current;
      if (!cy) {
        return;
      }
      
    }, [highlightZoom])

    return (
      <div className={styles.panel}>
        <h1>{props.id}</h1>
        <h1>{props.clazz}</h1>
        <hr className={styles.solid}></hr>
        <table>
          <tr>
            <th>Time:</th>
            <th>Sender:</th>
            <th>Recipient:</th>
          </tr>
          <tr>
            <td>{props.time}</td>
            <td>{props.sender}</td>
            <td>{props.recipient}</td>
          </tr>
        </table>
        <hr className={styles.solid}></hr>
        <div><Button4 onClick={() => HighlightParentChild()}>Highlight Parents & Children</Button4></div>
        <br></br>
        <div>{parents.length > 0 ? <span className={styles.badgeP}>Parents:</span> : <span className={styles.badgeP}>Event has no parent</span>}</div>
        <div>{parentsButton}</div>
        <br></br>
        <div>{children.length > 0 ? <span className={styles.badgeC}>Children:</span> : <span className={styles.badgeC}>Event has no children</span>}</div>
        <div>{childrenButton}</div>
      </div>
    );
  }

  function resetView() {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }
    cy.animate({
      fit: {
        eles: "",
        padding: 100
      }
    }, {
      duration: 200
    });
  }

  function resetHighlight() {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }
    cy.edges().removeClass("Children");
    cy.edges().removeClass("Parent");
  }

  React.useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }
    cy.animate({
      fit: {
        eles: "",
        padding: 100
      }
    }, {
      duration: 200
    });
  }
  ,[IDTrace])

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
      </div >
      <div className={styles.button}>
      {IDTrace && <Button1 onClick={() => resetView()}>Reset View</Button1>}
      {IDTrace && <Button1 onClick={() => resetHighlight()}>Clear All Highlights</Button1>}
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
          hideBackdrop={true}
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


