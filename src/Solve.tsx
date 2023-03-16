import React, { ChangeEvent, useState, useRef, useReducer} from "react";
import styled from "styled-components";
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
    const vscode = acquireVsCodeApi();
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
            window.postMessage({
                command: 'settings',
                settings: settings,
                filePath: fileList
            })
        }
    }

    React.useEffect(() => {
        if (fileList === null || fileList.length !== 2) {
            setDisableButton(true);
        }
        else {
            setDisableButton(false);
        }
    }, [fileList]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files !== null && e.target.files.length === 2 ) {
            const fileArr = e.target.files;
            setFileList(fileArr);
            setFileMessage(`${fileArr[0].name} and ${fileArr[1].name} selected.`)
        }
        else {
            setFileMessage(`Please select 2 files.`)
            setDisableButton(true);
        }
    };

    const handlePropDelay = (e : any) => {
        if (e.target.value < 0) {
            setMessage('Values cannot be negative');
            setDisableButton(true);
        }
        else {
            setPropDelay(e.target.value);
            setMessage('');
            setDisableButton(false);
        }
    }

    const handleStdDev = (e : any) => {
        if (e.target.value < 1) {
            setMessage('Standard deviation cannot be less than 1');
            setDisableButton(true);
            setDisableButton(false);
        }
        else {
            setStdDev(e.target.value);
            setMessage('');
            setDisableButton(false);
        }
    }

    const handleProbDelay = (e : any) => {
        if (e.target.value < 0) {
            setMessage('Values cannot be negative');
            setDisableButton(true);
        }
        else {
            setProbDelay(e.target.value);
            setMessage('');
            setDisableButton(false);
        }
    }

    const handleProbAssoc = (e : any) => {
        if (e.target.value < 0) {
            setMessage('Values cannot be negative');
            setDisableButton(true);
        }
        else {
            setProbAssoc(e.target.value);
            setMessage('');
            setDisableButton(false);
        }
    }

    const handleProbTrans = (e : any) => {
        if (e.target.value < 0) {
            setMessage('Values cannot be negative');
            setDisableButton(true);
        }
        else {
            setProbTrans(e.target.value);
            setMessage('');
            setDisableButton(false);
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
