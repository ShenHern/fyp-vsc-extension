/* eslint-disable prefer-const */
import React, { useState } from "react";
import RenderGraph from "./Visual";
import Solve from "./Solve";
const App = () => {
    const [jsonData, setJsonData] = useState();
    const [viewwindow, OpenViewWindow] = useState();
    const [solveWindow, OpenSolveWindow] = useState();
    window.addEventListener("message", (event) => {
        switch (event.data.command) {
            case 'view': {
                const newJsonData = event.data.json;
                const json = JSON.parse(newJsonData);
                setJsonData(json);
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
    return (React.createElement("div", null,
        (viewwindow) && React.createElement(RenderGraph, Object.assign({}, jsonData)),
        (solveWindow) &&
            React.createElement(Solve, null)));
};
export default App;
