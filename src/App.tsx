/* eslint-disable prefer-const */
import React, { useState } from "react";
import RenderGraph from "./Visual"
import Solve from "./Solve";

const App: React.FC = () => {

  const [jsonData, setJsonData] = useState<any>();
  const [solveWindow, OpenSolveWindow] = useState<boolean>();

  window.addEventListener("message", (event) => {
    switch(event.data.command) {
      case 'view': {
        const newJsonData = event.data.json;
        const json = JSON.parse(newJsonData);
        setJsonData(json)
        break;
      }
      case 'solve': {
        OpenSolveWindow(true);
        break;
      }
    }
  });
  
  return (
    <div>
    {
      jsonData && <RenderGraph
      {...jsonData}/>
    }
    {
      (OpenSolveWindow) &&
      <Solve
      />
    }
    </div>
  );
};

export default App;


