import React, {useRef} from "react";
import { Canvas, CanvasRef, EdgeData, NodeData, addNodeAndEdge } from "reaflow";

interface Props {
    nodes: NodeData[];
    edges: EdgeData[];
}

const StateHooksComponent: React.FC<Props> = ({nodes, edges}) => {

    return (
        <div style={{ width: "100%", height: 600 }}>
            <Canvas zoomable={true} fit={true} nodes={nodes} onLayoutChange={layout => console.log('Layout', layout)}/>
        </div>
    )
}

export default StateHooksComponent;