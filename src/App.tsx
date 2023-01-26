import React, { useState } from "react";
import { parser } from "./utils/jsonParser";
import { EdgeData, NodeData } from "reaflow";
import StateHooksComponent from "./utils/canvas";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const App: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);

  
  window.addEventListener("message", (event) => {
    console.log("message received");
    const jsonData = event.data.json;
    setNodes(parser(jsonData) as NodeData[]);
  });

//   React.useEffect(() => {
//     console.log("detect json useeffect");
//     const newNode : NodeData[] = parser(jsonData) as NodeData[];
//     console.log(newNode);
//   }, [jsonData]);
  // React.useEffect(() => {
  //   console.log("useEffect called");
  //   window.addEventListener("message", (event) => {
  //     console.log("message received");
  //     const newNode : NodeData[] = parser(jsonData) as NodeData[];
  //     // setNodes(newNode);
  //     console.log(newNode);
  //   });
  // });

  // React.useEffect(() => {
  //   console.log(nodes);
  // }, [nodes]);

  return (
    <div>
      <TransformWrapper>
      <TransformComponent>
      <StateHooksComponent nodes={nodes} edges={edges}/>
      </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default App;


