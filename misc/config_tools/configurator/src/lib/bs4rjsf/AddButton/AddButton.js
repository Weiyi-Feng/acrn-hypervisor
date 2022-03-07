import React from "react";
import Button from "react-bootstrap/Button";
import { BsPlus } from "react-icons/bs";
const AddButton = props => (React.createElement(Button, { ...props, style: { width: "100%" }, className: `ml-1 ${props.className}` },
    React.createElement(BsPlus, null)));
export default AddButton;
//# sourceMappingURL=AddButton.js.map