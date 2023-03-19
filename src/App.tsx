/* eslint-disable prefer-const */
import React, { useState } from "react";
import RenderGraph from "./Visual"
import Solve from "./Solve";

const App: React.FC = () => {

  const [jsonData, setJsonData] = useState<any>();
  const [viewwindow, OpenViewWindow] = useState<boolean>();
  const [solveWindow, OpenSolveWindow] = useState<boolean>();

  window.addEventListener("message", (event) => {
    switch(event.data.command) {
      case 'view': {
        const newJsonData = event.data.json;
        const json = JSON.parse(newJsonData);
        setJsonData(json)
        OpenViewWindow(true);
        OpenSolveWindow(false);
        break;
      }
      case 'solve': {
        OpenViewWindow(false);
        OpenSolveWindow(true);
        break;
      }
    }
  });
  
  return (
    <div>
    {
      (viewwindow) && <RenderGraph
      {...jsonData}/>
    }
    {
      (solveWindow) &&
      <Solve
      />
    }
    </div>
  );
};

export default App;


