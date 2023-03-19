import React, { ChangeEvent, useState, useRef, useReducer} from "react";
import styled from "styled-components";
import { parse } from "url";
import styles from "./mystyle.module.css";
import { Message, CommonMessage } from '../ext-src/messages/messageTypes';

const blue = "#007acc";
const red = "#D16969";
const green = "#6A9955";

const Input = styled.input`
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

const Button = styled.button`
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
`

const Button2 = styled.button`
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
`

function Solve() {

    const [fileList, setFileList] = useState<FileList | null>(null);
    const [message, setMessage] = useState('');
    const [fileMessage, setFileMessage] = useState('');
    const [propDelay, setPropDelay] = useState<number>(1);
    const [stdDev, setStdDev] = useState<number>(1);
    const [probDelay, setProbDelay] = useState<number>(0.0);
    const [probAssoc, setProbAssoc] = useState<number>(1.0);
    const [probTrans, setProbTrans] = useState<number>(0.1);
    const [disableButton, setDisableButton] = useState<boolean>(true);
    const [disableButtonSolve, setDisableButtonSolve] = useState<boolean>(true);
    const [disableButtonCombine, setDisableButtonCombine] = useState<boolean>(true);
    const [fileA_sim, setFileA_sim] = useState<any[]>([]);
    const [fileB_sim, setFileB_sim] = useState<any[]>([]);
    const [simA , setSimA] = useState<String>('');
    const [simB , setSimB] = useState<String>('');
    const [combine , setCombine] = useState<String>('');


    interface FileWithPath extends File {
        path: string
      }

    function submitForm() {
        if (fileList !== null && fileList.length === 2) {
            const settings = {
                propDelay: propDelay,
                stdDev: stdDev,
                probDelay: probDelay,
                probAssoc: probAssoc,
                probTrans: probTrans,
                file1: (fileList[0] as FileWithPath).path,
                file2: (fileList[1] as FileWithPath).path
            }
            vscode.postMessage<CommonMessage>({
                type: 'settings',
                payload: settings,
            });
        }
    }

    window.addEventListener("message", (event) => {
        if(event.data.command==="simSelect") {
            setFileA_sim(event.data.payload.fileA);
            setFileB_sim(event.data.payload.fileB);
        }
        else if (event.data.command==="combine") {
            console.log("combine");
            setCombine(event.data.payload);
        }
    });
    
    React.useEffect(() => {
        if(combine !== '') {
            setDisableButtonCombine(false);
        } else {
            setDisableButtonCombine(true);
        }
    }, [combine])
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files !== null && e.target.files.length === 2 ) {
            const fileArr = e.target.files;
            setFileList(fileArr);
            setFileMessage(`${fileArr[0].name} and ${fileArr[1].name} selected.`)
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
        } else {
            if ((!Number.isNaN(propDelay)) && (!Number.isNaN(stdDev)) &&  (!Number.isNaN(probAssoc)) && (!Number.isNaN(probDelay))  && (!Number.isNaN(probTrans))) {
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
    }, [fileList, propDelay, stdDev, probAssoc, probDelay, probTrans])

    const handlePropDelay = (e : any) => {
        const val = parseFloat(e.target.value);
        if (typeof val === "number") {
            setPropDelay(val);
        }
    }

    const handleStdDev = (e : any) => {
        const val = parseFloat(e.target.value);
        if (typeof val === "number") {
            setStdDev(val);
        }
    }

    const handleProbDelay = (e : any) => {
        const val = parseFloat(e.target.value);
        if (typeof val === "number") {
            setProbDelay(val);
        }
    }

    const handleProbAssoc = (e : any) => {
        const val = parseFloat(e.target.value);
        if (typeof val === "number") {
            setProbAssoc(val);
        }
    }

    const handleProbTrans = (e : any) => {
        const val = parseFloat(e.target.value);
        if (typeof val === "number") {
            setProbTrans(val);
        }
    }

    const handleSelectA = (sim : string) => {
        // const index = fileA_sim.indexOf(sim);
        // setSimNumber(index);
        // const traceArray = analyseTrace(jsonData, index);
        // setTrace(traceArray);
        setSimA(sim);
    }
    const handleSelectB = (sim : string) => {
        // const index = fileA_sim.indexOf(sim);
        // setSimNumber(index);
        // const traceArray = analyseTrace(jsonData, index);
        // setTrace(traceArray);
        setSimB(sim);
    }

    React.useEffect(() => {
        if (simA === "invalid" || simB === "invalid" || simA === '' || simB === '') {
            setDisableButtonSolve(true)
        }
        else {
            setDisableButtonSolve(false)
        }
    }, [simA, simB]);

    function submitSim() {
        const sim = {
            simA: simA,
            simB: simB
        }
        vscode.postMessage<Message>({
            type: 'selectedSIM',
            payload: sim
        });
    }
    function submitCombine() {
        vscode.postMessage<Message>({
            type: 'combineFiles',
            payload: combine
        });
    }

    return(
        <div>
            <h2 className={styles.head}>Align trace.json Timings of 2 Nodes</h2>
            <p className={styles.head}>Choose 2 trace.json files to be aligned</p>
            <input className={styles.input} type="file" accept=".json" onChange={handleFileChange} multiple />
            {fileMessage!=='' && (<p className={styles.pass}> {fileMessage} </p>)}
            <br></br>
            <fieldset>
                <div className={styles.box}>
                    <div className={styles.solve}>
                        <p>Enter propogation delay between 2 nodes (in seconds)</p>
                        <Input type="number" defaultValue="1" onChange={(e : any) => handlePropDelay(e)}/>
                    </div>
                    <div className={styles.solve}>
                        <p>Enter standard deviation of delay between 2 nodes (in seconds)</p>
                        <Input type="number" defaultValue="1" onChange={(e : any) => handleStdDev(e)}/>
                    </div>
                </div>
                <div className={styles.box}>
                    <div className={styles.solve}>
                        <p>Enter probabilites for delay:</p>
                        <Input type="number" defaultValue="0.0" onChange={(e : any) => handleProbDelay(e)}/>
                    </div>
                    <div className={styles.solve}>
                        <p>Enter probabilites for association:</p>
                        <Input type="number" defaultValue="1.0" onChange={(e : any) => handleProbAssoc(e)}/>
                    </div>
                    <div className={styles.solve}>
                        <p>Enter probabilites for false transmission:</p>
                        <Input type="number" defaultValue="0.1" onChange={(e : any) => handleProbTrans(e)}/>
                    </div>
                </div>
                <div className={styles.Button}>
                    <Button onClick={() => submitForm()} disabled={disableButton}>Input parameters</Button>
                    {message!=='' && (<p className={styles.pass}> {message} </p>)}
                </div>
            </fieldset>
                {      
                    fileA_sim.length > 0 && fileB_sim.length > 0 &&
                    <div className={styles.box}>
                        <div>
                        <p>{fileList && fileList[0].name}</p>
                        <select onChange={(e) => handleSelectA(e.target.value)}>
                        <option value="invalid">Select Simulation</option>
                        {
                        fileA_sim.map((sim, index) => {
                        return(
                            <option key={index} value={sim}>{sim}</option>
                        )
                        })
                        }
                        </select>
                        </div>
                        <p>{fileList && fileList[1].name}</p>
                        <select onChange={(e) => handleSelectB(e.target.value)}>
                        <option value="invalid">Select Simulation</option>
                        {
                        fileB_sim.map((sim, index) => {
                        return(
                            <option key={index} value={sim}>{sim}</option>
                        )
                        })
                        }
                        </select>
                        <br></br>
                        <div className={styles.button}>
                            <Button2 onClick={() => submitSim()} disabled={disableButtonSolve}>Solve</Button2>
                            <Button2 onClick={() => submitCombine()} disabled={disableButtonCombine}>Combine</Button2>
                        </div>
                    </div>
                    }
        </div>
    )
}

export default Solve;

function acquireVsCodeApi() {
    throw new Error("Function not implemented.");
}
