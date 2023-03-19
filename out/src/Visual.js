var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
/* eslint-disable prefer-const */
import React, { useState, useRef, useReducer } from "react";
import { eventsArray } from "./utils/jsonParser";
import { parser, analyseTrace, format } from "./utils/jsonParser";
import styles from "./mystyle.module.css";
import styled from "styled-components";
import CytoscapeComponent from "react-cytoscapejs";
import { CytoscapeStylesheet, sidePanelOptions } from "./utils/stylingOptions";
import { SidePane } from "react-side-pane";
const blue = "#007acc";
const red = "#D16969";
const green = "#6A9955";
const Button1 = styled.button `
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
const Button2 = styled.button `
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
const Button3 = styled.button `
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
const Button4 = styled.button `
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
function RenderGraph(props) {
    const [trace, setTrace] = useState([]);
    const [IDTrace, setIDTrace] = useState();
    const [simNumber, setSimNumber] = useState();
    const [elements, setElements] = useState([]);
    const [sidePanelInfo, setSidePanelInfo] = useState();
    const [open, dispatchOpen] = useReducer((prev) => !prev, false);
    const [selectedEdge, setSelectedEdge] = useState();
    const [highlightZoom, setHighlightZoom] = useState();
    const cyRef = useRef();
    const jsonData = parser(props);
    const dropDown = eventsArray(props);
    const handleSelect = (sim) => {
        const index = dropDown.indexOf(sim);
        setSimNumber(index);
        const traceArray = analyseTrace(jsonData, index);
        setTrace(traceArray);
    };
    const handleSelectTrace = (trace) => {
        const cy = cyRef.current;
        setIDTrace(JSON.parse(trace)[1]);
        let [actors, output] = format(JSON.parse(trace)[2]);
        const newElements = [];
        const x = 100;
        const y = 100;
        const node_distance = 300;
        actors = actors.flat();
        for (let i = 0; i < actors.flat().length; i++) {
            actors.splice(i, 1);
        }
        for (let j = 0; j < actors.length; j++) {
            const nodes_start = {
                data: {
                    id: `${simNumber}-${JSON.parse(trace)[1]}-${actors[j]}-start`,
                    label: `${actors[j]}`
                },
                position: { x: x + (j * node_distance), y: y },
                locked: true
            };
            const nodes_end = {
                data: {
                    id: `${simNumber}-${JSON.parse(trace)[1]}-${actors[j]}-end`,
                    label: `${actors[j]}`
                },
                position: { x: x + (j * node_distance), y: y + ((output.length + 1) * 50) },
                locked: true
            };
            const start_end = {
                data: {
                    source: `${simNumber}-${JSON.parse(trace)[1]}-${actors[j]}-start`,
                    target: `${simNumber}-${JSON.parse(trace)[1]}-${actors[j]}-end`,
                },
                locked: true
            };
            newElements.push(nodes_start);
            newElements.push(JSON.parse(JSON.stringify(nodes_end)));
            newElements.push(start_end);
        }
        const event_x = 100;
        let event_y = 150;
        for (let k = 0; k < output.length; k++) {
            const fromIndex = actors.indexOf(output[k].sender);
            const toIndex = actors.indexOf(output[k].recipient);
            const nodeEvent_from = {
                data: {
                    id: `${simNumber}-${JSON.parse(trace)[1]}-${output[k].id}-from`,
                    label: `${output[k].sender}`
                },
                position: { x: event_x + (fromIndex * node_distance), y: event_y },
                locked: true
            };
            const nodeEvent_to = {
                data: {
                    id: `${simNumber}-${JSON.parse(trace)[1]}-${output[k].id}-to`,
                    label: `${output[k].recipient}`
                },
                position: { x: event_x + (toIndex * node_distance), y: event_y },
                locked: true
            };
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
            };
            event_y += 50;
            newElements.push(nodeEvent_from);
            newElements.push(nodeEvent_to);
            newElements.push(edge);
        }
        setElements(newElements);
    };
    React.useEffect(() => {
        const cy = cyRef.current;
        if (!cy) {
            return;
        }
        cy.on("select", "edge", (event) => {
            cy.edges().removeClass("Children");
            cy.edges().removeClass("Parent");
            if (!event.target[0].locked()) {
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
                setSelectedEdge(`${event.target[0].data().id}`);
            }
        });
    }, []);
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
    }, [IDTrace]);
    function Component(_a) {
        var { onClose } = _a, props = __rest(_a, ["onClose"]);
        const children = Object.keys(props.children);
        const childrenButton = children.map((child) => {
            return React.createElement("div", { className: styles.button },
                React.createElement(Button2, { onClick: () => example(child) },
                    child,
                    React.createElement("br", null),
                    props.children[child].clazz));
        });
        const parents = Object.keys(props.parent);
        const parentsButton = parents.map((parent) => {
            return React.createElement("div", { className: styles.button },
                React.createElement(Button3, { onClick: () => example(parent) },
                    parent,
                    React.createElement("br", null),
                    props.parent[parent].clazz));
        });
        function example(id) {
            const cy = cyRef.current;
            if (!cy) {
                return;
            }
            const from = cy.getElementById(`${simNumber}-${IDTrace}-${id}-from`);
            const to = cy.getElementById(`${simNumber}-${IDTrace}-${id}-to`);
            const prevFrom = cy.getElementById(`${selectedEdge}-from`);
            const prevTo = cy.getElementById(`${selectedEdge}-to`);
            from.edgesTo(to).select();
            prevFrom.edgesTo(prevTo).unselect();
            dispatchOpen();
        }
        function HighlightParentChild() {
            const cy = cyRef.current;
            if (!cy) {
                return;
            }
            const highlighted = [];
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
        }, [highlightZoom]);
        return (React.createElement("div", { className: styles.panel },
            React.createElement("h1", null, props.id),
            React.createElement("h1", null, props.clazz),
            React.createElement("hr", { className: styles.solid }),
            React.createElement("table", null,
                React.createElement("tr", null,
                    React.createElement("th", null, "Time:"),
                    React.createElement("th", null, "Sender:"),
                    React.createElement("th", null, "Recipient:")),
                React.createElement("tr", null,
                    React.createElement("td", null, props.time),
                    React.createElement("td", null, props.sender),
                    React.createElement("td", null, props.recipient))),
            React.createElement("hr", { className: styles.solid }),
            React.createElement("div", null,
                React.createElement(Button4, { onClick: () => HighlightParentChild() }, "Highlight Parents & Children")),
            React.createElement("br", null),
            React.createElement("div", null, parents.length > 0 ? React.createElement("span", { className: styles.badgeP }, "Parents:") : React.createElement("span", { className: styles.badgeP }, "Event has no parent")),
            React.createElement("div", null, parentsButton),
            React.createElement("br", null),
            React.createElement("div", null, children.length > 0 ? React.createElement("span", { className: styles.badgeC }, "Children:") : React.createElement("span", { className: styles.badgeC }, "Event has no children")),
            React.createElement("div", null, childrenButton)));
    }
    return (React.createElement("div", null,
        React.createElement("div", { className: styles.select },
            React.createElement("select", { onChange: (e) => handleSelect(e.target.value) },
                React.createElement("option", { value: "0" }, "Select Simulation"),
                dropDown.map((sim, index) => {
                    return (React.createElement("option", { key: index, value: sim }, sim));
                })),
            React.createElement("br", null),
            React.createElement("select", { onChange: (f) => handleSelectTrace(f.target.value) },
                React.createElement("option", { value: "0" }, "Select Trace"),
                trace !== undefined &&
                    trace.map((trace, index) => {
                        return (React.createElement("option", { key: index, value: JSON.stringify(trace) },
                            "Trace: ",
                            trace[1]));
                    }))),
        React.createElement("div", { className: styles.button },
            IDTrace && React.createElement(Button1, { onClick: () => resetView() }, "Reset View"),
            IDTrace && React.createElement(Button1, { onClick: () => resetHighlight() }, "Clear All Highlights")),
        React.createElement("div", null,
            React.createElement(CytoscapeComponent, { className: styles.body, elements: [...elements], style: {
                    height: "100%",
                    position: "absolute",
                    width: "100%",
                }, stylesheet: CytoscapeStylesheet, cy: (cy) => {
                    cyRef.current = cy;
                } })),
        React.createElement(SidePane, Object.assign({ open: open, width: 50 }, sidePanelOptions, { onClose: dispatchOpen, hideBackdrop: true }),
            React.createElement(Component, Object.assign({ onClose: dispatchOpen }, sidePanelInfo)))));
}
export default RenderGraph;
