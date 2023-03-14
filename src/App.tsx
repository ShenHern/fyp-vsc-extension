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

const App: React.FC = () => {

  // const [jsonData, setJsonData] = useState<Map<number, any>>();
  // const [dataA, setDataA] = useState<Map<number, any>>();
  // const [dataB, setDataB] = useState<Map<number, any>>();
  
  const [jsonData, setJsonData] = useState<String>("");
  const [dataA, setDataA] = useState<String>("");
  const [dataB, setDataB] = useState<String>("");

  window.addEventListener("message", (event) => {
    switch(event.data.command) {
      case 'view': {
        const newJsonData = event.data.json;
        // const grpEvents = parser(newJsonData);
        setJsonData(newJsonData)
        console.log(newJsonData);
        break;
      }
      case 'solve': {
        const traceA = event.data.traceA;
        const traceB = event.data.traceB;
        setDataA(traceA);
        setDataB(traceB);
        break;
      }
    }
  });
  function Component(props) {
    return (
      <div>
        {props}
      </div>
    );
  }
  
  return (
    <div>
      {
        jsonData &&
        <Component
          {...jsonData}
        />
      }
      {(dataA && dataB) && <p>solve mode</p>}
    </div>
  );
};

export default App;


