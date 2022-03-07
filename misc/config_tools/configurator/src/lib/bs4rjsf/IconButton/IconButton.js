import React from "react";
import Button from "react-bootstrap/Button";
import { IoIosRemove } from "react-icons/io";
import { GrAdd } from "react-icons/gr";
import { AiOutlineArrowUp, AiOutlineArrowDown } from "react-icons/ai";
const mappings = {
    remove: React.createElement(IoIosRemove, null),
    plus: React.createElement(GrAdd, null),
    "arrow-up": React.createElement(AiOutlineArrowUp, null),
    "arrow-down": React.createElement(AiOutlineArrowDown, null),
};
const IconButton = (props) => {
    const { icon, className, ...otherProps } = props;
    return (React.createElement(Button, { ...otherProps, variant: props.variant || "light", size: "sm" }, mappings[icon]));
};
export default IconButton;
//# sourceMappingURL=IconButton.js.map