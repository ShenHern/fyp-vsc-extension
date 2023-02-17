import React, { useReducer } from "react";
import styles from "../mystyle.module.css";

export default function Component({onClose, ...props}) {

  return (
    <div className={styles.panel}>
      <h1>ID: {props.id}</h1>
      <h1>Time: {props.time}</h1>
      <h1>Clazz: {props.clazz}</h1>
      <h1>Sender: {props.sender}</h1>
      <h1>Recipient: {props.recipient}</h1>
      {/* <h1>Parent: {props.parent}</h1>
      <h1>Children: {props.children}</h1> */}
    </div>
  );
}