import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NextPage } from "next";
import { useEffect, useRef, useState } from "react";

export type DropDownItem = {
  name: string;
  id: string;
};

export const DropDown: NextPage<{
  options?: Array<DropDownItem>;
  defaultValue?: string;
  close: () => void;
  setOtherValue: (value: DropDownItem) => void;
}> = ({ options, defaultValue, close, setOtherValue }) => {
  const getValue = (id?: string) => options?.find((val) => val.id === id);
  const [value, setValue] = useState(getValue(defaultValue));
  const element = useRef(null);

  const isDescendant = (parent: HTMLElement, child: HTMLElement): boolean => {
    if (parent === child) return true;
    var node = child.parentNode;
    while (node != null) {
      if (node == parent) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  };

  const setAllValues = (value: DropDownItem) => {
    setValue(value);
    setOtherValue(value);
  };

  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (isDescendant(element.current as any, event.target as any)) {
        return;
      }
      document.removeEventListener("click", click);
      close();
    };
    document.addEventListener("click", click);
  }, []);

  return (
    <div
      ref={element}
      className="select-none flex flex-col text-gray-400 bg-gray-800 w-full rounded-md overscroll-y-auto"
    >
      {options?.map((option) => (
        <div
          className="p-5 hover:opacity-60 transition-opacity cursor-pointer w-full flex flex-row"
          key={option.id}
          onClick={() => setAllValues(option)}
        >
          <img
            className="w-8 h-8"
            src={`/icons/${option.id}.png`}
            alt={`${option.id} Icon`}
          />
          <span className="leading-loose ml-3">{option.name}</span>
          {value?.id === option.id && (
            <FontAwesomeIcon
              className="leading-loose mt-2 fill-current text-green-500 ml-1 "
              icon={faCheckCircle}
            />
          )}
        </div>
      ))}
    </div>
  );
};
