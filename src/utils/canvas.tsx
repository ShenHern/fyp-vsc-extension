import React, {useRef, useState} from "react";
import { Canvas, CanvasRef, EdgeData, NodeData, addNodeAndEdge } from "reaflow";
import { parser, format } from "../utils/jsonParser";

interface Props {
    jsonData: any;
    selectedSimulation: string;
    selectionArray: string[];
}

const StateHooksComponent: React.FC<Props> = ({jsonData, selectedSimulation, selectionArray}) => {

    const [nodes, setNodes] = useState<NodeData[]>([]);
    const [edges, setEdges] = useState<EdgeData[]>([]);

    const index = selectionArray.indexOf(selectedSimulation);
    // console.log(index);
    let newJsonFormat : NodeData[] = [];
    newJsonFormat = format(jsonData[index] as Array<{ [header: string]: any }>) as NodeData[]
    setNodes(newJsonFormat);

    return (
        <div style={{ width: "100%", height: 600 }}>
            <p>{index}</p>
            {/* <Canvas zoomable={true} fit={true} nodes={nodes} onLayoutChange={layout => console.log('Layout', layout)}/> */}
        </div>
    )
}

export default React.memo(StateHooksComponent);