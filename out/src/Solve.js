import React, { useState } from "react";
import styled from "styled-components";
import styles from "./mystyle.module.css";
const blue = "#007acc";
const red = "#D16969";
const green = "#6A9955";
const Input = styled.input `
  padding: 0.5em;
  margin: 0.5em;
  color: black;
  background: white;
  border: 2px solid white;
  border-radius: 3px;
  ::placeholder {
    color: grey;
  }
`;
const Button = styled.button `
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
&:disabled {
  background-color: gray;
  color: white;
}
`;
const Button2 = styled.button `
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
&:disabled {
  background-color: gray;
  color: white;
}
`;
function Solve() {
    const [fileList, setFileList] = useState(null);
    const [message, setMessage] = useState('');
    const [fileMessage, setFileMessage] = useState('');
    const [propDelay, setPropDelay] = useState(1);
    const [stdDev, setStdDev] = useState(1);
    const [probDelay, setProbDelay] = useState(0.0);
    const [probAssoc, setProbAssoc] = useState(1.0);
    const [probTrans, setProbTrans] = useState(0.1);
    const [disableButton, setDisableButton] = useState(true);
    const [disableButtonSolve, setDisableButtonSolve] = useState(true);
    const [disableButtonCombine, setDisableButtonCombine] = useState(true);
    const [fileA_sim, setFileA_sim] = useState([]);
    const [fileB_sim, setFileB_sim] = useState([]);
    const [simA, setSimA] = useState('');
    const [simB, setSimB] = useState('');
    const [combine, setCombine] = useState('');
    function submitForm() {
        if (fileList !== null && fileList.length === 2) {
            const settings = {
                propDelay: propDelay,
                stdDev: stdDev,
                probDelay: probDelay,
                probAssoc: probAssoc,
                probTrans: probTrans,
                file1: fileList[0].path,
                file2: fileList[1].path
            };
            vscode.postMessage({
                type: 'settings',
                payload: settings,
            });
        }
    }
    window.addEventListener("message", (event) => {
        if (event.data.command === "simSelect") {
            setFileA_sim(event.data.payload.fileA);
            setFileB_sim(event.data.payload.fileB);
        }
        else if (event.data.command === "combine") {
            console.log("combine");
            setCombine(event.data.payload);
        }
    });
    React.useEffect(() => {
        if (combine !== '') {
            setDisableButtonCombine(false);
        }
        else {
            setDisableButtonCombine(true);
        }
    }, [combine]);
    const handleFileChange = (e) => {
        if (e.target.files !== null && e.target.files.length === 2) {
            const fileArr = e.target.files;
            setFileList(fileArr);
            setFileMessage(`${fileArr[0].name} and ${fileArr[1].name} selected.`);
            setDisableButton(false);
        }
        else {
            setFileMessage(`Please select 2 files.`);
            setDisableButton(true);
        }
    };
    React.useEffect(() => {
        if (fileList === null || fileList.length !== 2) {
            setDisableButton(true);
        }
        else {
            if ((!Number.isNaN(propDelay)) && (!Number.isNaN(stdDev)) && (!Number.isNaN(probAssoc)) && (!Number.isNaN(probDelay)) && (!Number.isNaN(probTrans))) {
                if (propDelay >= 0 && stdDev >= 1 && probAssoc >= 0 && probAssoc <= 1 && probDelay >= 0 && probDelay <= 1 && probTrans >= 0 && probTrans <= 1) {
                    setMessage("");
                    setDisableButton(false);
                }
                else {
                    setMessage("Values not acceptable");
                    setDisableButton(true);
                }
            }
            else {
                setMessage("Fields cannot be blank");
                setDisableButton(true);
            }
        }
    }, [fileList, propDelay, stdDev, probAssoc, probDelay, probTrans]);
    const handlePropDelay = (e) => {
        const val = parseFloat(e.target.value);
        if (typeof val === "number") {
            setPropDelay(val);
        }
    };
    const handleStdDev = (e) => {
        const val = parseFloat(e.target.value);
        if (typeof val === "number") {
            setStdDev(val);
        }
    };
    const handleProbDelay = (e) => {
        const val = parseFloat(e.target.value);
        if (typeof val === "number") {
            setProbDelay(val);
        }
    };
    const handleProbAssoc = (e) => {
        const val = parseFloat(e.target.value);
        if (typeof val === "number") {
            setProbAssoc(val);
        }
    };
    const handleProbTrans = (e) => {
        const val = parseFloat(e.target.value);
        if (typeof val === "number") {
            setProbTrans(val);
        }
    };
    const handleSelectA = (sim) => {
        // const index = fileA_sim.indexOf(sim);
        // setSimNumber(index);
        // const traceArray = analyseTrace(jsonData, index);
        // setTrace(traceArray);
        setSimA(sim);
    };
    const handleSelectB = (sim) => {
        // const index = fileA_sim.indexOf(sim);
        // setSimNumber(index);
        // const traceArray = analyseTrace(jsonData, index);
        // setTrace(traceArray);
        setSimB(sim);
    };
    React.useEffect(() => {
        if (simA === "invalid" || simB === "invalid" || simA === '' || simB === '') {
            setDisableButtonSolve(true);
        }
        else {
            setDisableButtonSolve(false);
        }
    }, [simA, simB]);
    function submitSim() {
        const sim = {
            simA: simA,
            simB: simB
        };
        vscode.postMessage({
            type: 'selectedSIM',
            payload: sim
        });
    }
    function submitCombine() {
        vscode.postMessage({
            type: 'combineFiles',
            payload: combine
        });
    }
    return (React.createElement("div", null,
        React.createElement("h2", { className: styles.head }, "Align trace.json Timings of 2 Nodes"),
        React.createElement("p", { className: styles.head }, "Choose 2 trace.json files to be aligned"),
        React.createElement("input", { className: styles.input, type: "file", accept: ".json", onChange: handleFileChange, multiple: true }),
        fileMessage !== '' && (React.createElement("p", { className: styles.pass },
            " ",
            fileMessage,
            " ")),
        React.createElement("br", null),
        React.createElement("fieldset", null,
            React.createElement("div", { className: styles.box },
                React.createElement("div", { className: styles.solve },
                    React.createElement("p", null, "Enter propogation delay between 2 nodes (in seconds)"),
                    React.createElement(Input, { type: "number", defaultValue: "1", onChange: (e) => handlePropDelay(e) })),
                React.createElement("div", { className: styles.solve },
                    React.createElement("p", null, "Enter standard deviation of delay between 2 nodes (in seconds)"),
                    React.createElement(Input, { type: "number", defaultValue: "1", onChange: (e) => handleStdDev(e) }))),
            React.createElement("div", { className: styles.box },
                React.createElement("div", { className: styles.solve },
                    React.createElement("p", null, "Enter probabilites for delay:"),
                    React.createElement(Input, { type: "number", defaultValue: "0.0", onChange: (e) => handleProbDelay(e) })),
                React.createElement("div", { className: styles.solve },
                    React.createElement("p", null, "Enter probabilites for association:"),
                    React.createElement(Input, { type: "number", defaultValue: "1.0", onChange: (e) => handleProbAssoc(e) })),
                React.createElement("div", { className: styles.solve },
                    React.createElement("p", null, "Enter probabilites for false transmission:"),
                    React.createElement(Input, { type: "number", defaultValue: "0.1", onChange: (e) => handleProbTrans(e) }))),
            React.createElement("div", { className: styles.Button },
                React.createElement(Button, { onClick: () => submitForm(), disabled: disableButton }, "Input parameters"),
                message !== '' && (React.createElement("p", { className: styles.pass },
                    " ",
                    message,
                    " ")))),
        fileA_sim.length > 0 && fileB_sim.length > 0 &&
            React.createElement("div", { className: styles.box },
                React.createElement("div", null,
                    React.createElement("p", null, fileList && fileList[0].name),
                    React.createElement("select", { onChange: (e) => handleSelectA(e.target.value) },
                        React.createElement("option", { value: "invalid" }, "Select Simulation"),
                        fileA_sim.map((sim, index) => {
                            return (React.createElement("option", { key: index, value: sim }, sim));
                        }))),
                React.createElement("p", null, fileList && fileList[1].name),
                React.createElement("select", { onChange: (e) => handleSelectB(e.target.value) },
                    React.createElement("option", { value: "invalid" }, "Select Simulation"),
                    fileB_sim.map((sim, index) => {
                        return (React.createElement("option", { key: index, value: sim }, sim));
                    })),
                React.createElement("br", null),
                React.createElement("div", { className: styles.button },
                    React.createElement(Button2, { onClick: () => submitSim(), disabled: disableButtonSolve }, "Solve"),
                    React.createElement(Button2, { onClick: () => submitCombine(), disabled: disableButtonCombine }, "Combine")))));
}
export default Solve;
function acquireVsCodeApi() {
    throw new Error("Function not implemented.");
}
