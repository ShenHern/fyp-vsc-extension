import React, { ChangeEvent, useState, useRef, useReducer} from "react";
import styled from "styled-components";
import { parse } from "url";
import styles from "./mystyle.module.css";

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
    function submitForm() {
        if (fileList !== null && fileList.length === 2) {
            const settings = {
                propDelay: propDelay,
                stdDev: stdDev,
                probDelay: probDelay,
                probAssoc: probAssoc,
                probTrans: probTrans
            }

            console.log(settings);
            console.log(fileList);
        }
    }

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

    return(
        <div>
            <h2 className={styles.head}>Choose 2 trace.json files</h2>
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
                    <Button onClick={() => submitForm()} disabled={disableButton}>Solve</Button>
                    {message!=='' && (<p className={styles.pass}> {message} </p>)}
                </div>
            </fieldset>
        </div>
    )
}

export default Solve;

function acquireVsCodeApi() {
    throw new Error("Function not implemented.");
}
