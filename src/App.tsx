import React, { useState } from "react";
import { eventsArray } from "./utils/jsonParser";
import Menu from "./utils/dropdownMenu/menu";
import { parser } from "./utils/jsonParser";

const App: React.FC = () => {
  const [jsonData, setJsonData] = useState<Map<number, any>>();
  const [dropDown, setDropdown] = useState<string[]>([]);

  
  window.addEventListener("message", (event) => {
    console.log("message received");
    const newJsonData = event.data.json;
    const grpEvents = parser(newJsonData);
    setJsonData(grpEvents)
    setDropdown(eventsArray(newJsonData));
  });

  React.useEffect(() => {
    console.log(jsonData);
  }, [jsonData]);


  return (
    <div>
      <Menu eventArray={dropDown} jsonData={jsonData}/>
    </div>
  );
};

export default App;


