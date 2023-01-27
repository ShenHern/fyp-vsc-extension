import React, { useEffect, useState } from "react";
import DropDown from "./dropdown";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import StateHooksComponent from "../canvas";
import { EdgeData, NodeData } from "reaflow";

interface Props {
  eventArray: string[];
  jsonData?: Map<number, any>;
}

const Menu: React.FC<Props> = ( {eventArray, jsonData} ): JSX.Element => {
  const [showDropDown, setShowDropDown] = useState<boolean>(false);
  const [selectCity, setSelectCity] = useState<string>("");
  const cities = () => {
    return eventArray;
  };

  /**
   * Toggle the drop down menu
   */
  const toggleDropDown = () => {
    setShowDropDown(!showDropDown);
  };

  /**
   * Hide the drop down menu if click occurs
   * outside of the drop-down element.
   *
   * @param event  The mouse event
   */
  const dismissHandler = (event: React.FocusEvent<HTMLButtonElement>): void => {
    if (event.currentTarget === event.target) {
      setShowDropDown(false);
    }
  };

  /**
   * Callback function to consume the
   * city name from the child component
   *
   * @param city  The selected city
   */
  const citySelection = (city: string): void => {
    setSelectCity(city);
  };

  return (
    <>
      <div className="announcement">
        <div>
          {selectCity
            ? `You selected ${selectCity}`
            : "Select which simulation to view"}
        </div>
      </div>
      <button
        className={showDropDown ? "active" : undefined}
        onClick={(): void => toggleDropDown()}
        onBlur={(e: React.FocusEvent<HTMLButtonElement>): void =>
          dismissHandler(e)
        }
      >
        <div>{selectCity ? "Select: " + selectCity : "Select ..."} </div>
        {showDropDown && (
          <DropDown
            cities={cities()}
            showDropDown={false}
            toggleDropDown={(): void => toggleDropDown()}
            citySelection={citySelection}
          />
        )}
      </button>
      <div>
        <TransformWrapper>
          <TransformComponent>
            <StateHooksComponent jsonData={jsonData} selectedSimulation={selectCity} selectionArray={cities()}/>
          </TransformComponent>
        </TransformWrapper>
      </div>
    </>
  );
};

export default Menu;
