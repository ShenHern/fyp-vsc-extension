import React, { useState, useRef } from "react";
import { eventsArray } from "./utils/jsonParser";
import { parser, analyseTrace, format, edgeFormat } from "./utils/jsonParser";
import { Canvas, CanvasRef, EdgeData, NodeData, addNodeAndEdge } from "reaflow";
import { ReactZoomPanPinchRef, TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const App: React.FC = () => {
  const [jsonData, setJsonData] = useState<Map<number, any>>();
  const [dropDown, setDropdown] = useState<string[]>([]);
  const [trace, setTrace] = useState<any[]>([]);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [height, setHeight] = useState<number>(800);
  const [width, setWidth] = useState<number>(800);
  const [minScale, setMinScale] = React.useState(0.4);

  const ref = useRef<CanvasRef | null>(null);

  window.addEventListener("message", (event) => {
    console.log("message received");
    const newJsonData = event.data.json;
    const grpEvents = parser(newJsonData);
    setJsonData(grpEvents)
    setDropdown(eventsArray(newJsonData));
  });

  React.useEffect(() => {
    console.log(dropDown);
  }, [jsonData]);

  const handleSelect = (sim : string) => {
    console.log(sim);
    const index = dropDown.indexOf(sim);
    const traceArray = analyseTrace(jsonData, index);
    setTrace(traceArray);
  }

  React.useEffect(() => {
    console.log(trace);
  }, [trace]);

  const handleSelectTrace = (trace : string) => {
    console.log(format(JSON.parse(trace)));
    setNodes(format(JSON.parse(trace)));
  }

  React.useEffect(() => {
    setEdges(edgeFormat(nodes));
  }, [nodes]);

  const layoutChange = (height: number, width: number) => {
    const areaSize = height*width;
    setHeight(height+400);
    setWidth(width+400);
    const MIN_SCALE = Math.round((450_000 / areaSize) * 400) / 100;
    const scale = MIN_SCALE > 2 ? 1 : MIN_SCALE <= 0 ? 0.1 : MIN_SCALE;

    setMinScale(scale);
  }

  return (
    <div className='App'>
      <select className='form-control select-class' onChange={(e) => handleSelect(e.target.value)}>
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
      <select className='form-control select-class' onChange={(f) => handleSelectTrace(f.target.value)}>
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
      <div className='canvas'>
      <TransformWrapper
        maxScale={4}
        minScale={minScale}
        initialScale={minScale}
        wheel={{ wheelDisabled:true }}
        zoomAnimation={{ animationType: "linear" }}
        doubleClick={{ disabled: true }}  
        limitToBounds={true}
      >
        <TransformComponent
          wrapperStyle={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <Canvas
            ref={ref}             
            fit={true}
            arrow={null}
            maxHeight={height}
            maxWidth={width}
            zoomable={false}
            nodes={nodes}
            edges={edges}
            dragEdge={null}
            dragNode={null}
            onLayoutChange={layout => layoutChange(layout.height as number, layout.width as number)}/>
        </TransformComponent>
      </TransformWrapper>
      </div>
    </div>
  );
};

export default App;


