/* eslint-disable prefer-const */
import React, { useState } from "react";
import RenderGraph from "./Visual"
import Solve from "./Solve";

const App: React.FC = () => {

  const [simArray, setSimArray] = useState<any>();
  const [viewwindow, OpenViewWindow] = useState<boolean>();
  const [solveWindow, OpenSolveWindow] = useState<boolean>();

  window.addEventListener("message", (event) => {
    switch(event.data.command) {
      case 'view': {
        const arr = event.data.payload;
        setSimArray(arr)
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
      {...simArray}/>
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


