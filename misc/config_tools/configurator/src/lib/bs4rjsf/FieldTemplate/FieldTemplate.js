import React from "react";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import WrapIfAdditional from "./WrapIfAdditional";
// @ts-ignore
import rst2html from "rst2html";
import { OverlayTrigger, Popover } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
const FieldTemplate = ({ id, children, displayLabel, rawErrors = [], rawHelp, rawDescription, classNames, disabled, label, onDropPropertyClick, onKeyChange, readonly, required, schema }) => {
    let descWithChildren;
    if (displayLabel && rawDescription) {
        descWithChildren = React.createElement("div", { className: "d-flex" },
            React.createElement(OverlayTrigger, { trigger: ["hover", "focus"], key: "top", placement: "top", overlay: React.createElement(Popover, { id: `popover-positioned-top` },
                    React.createElement(Popover.Body, null,
                        React.createElement(Form.Text, { className: rawErrors.length > 0 ? "text-danger" : "text-muted", dangerouslySetInnerHTML: { __html: rst2html(rawDescription) } }))) },
                React.createElement("div", { className: "mx-2 py-2 descInfoBtn" },
                    React.createElement(FontAwesomeIcon, { icon: faCircleExclamation, color: rawErrors.length > 0 ? "red" : "" }))),
            React.createElement("div", { className: "w-100" }, children));
    }
    else {
        descWithChildren = children;
    }
    return (React.createElement(WrapIfAdditional, { classNames: classNames, disabled: disabled, id: id, label: label, onDropPropertyClick: onDropPropertyClick, onKeyChange: onKeyChange, readonly: readonly, required: required, schema: schema },
        React.createElement(Form.Group, null,
            descWithChildren,
            rawErrors.length > 0 && (React.createElement(ListGroup, { as: "ul" }, rawErrors.map((error) => {
                return (React.createElement(ListGroup.Item, { as: "li", key: error, className: "border-0 m-0 p-0" },
                    React.createElement("small", { className: "m-0 text-danger" }, error)));
            }))),
            rawHelp && (React.createElement(Form.Text, { className: rawErrors.length > 0 ? "text-danger" : "text-muted", id: id }, rawHelp)))));
};
export default FieldTemplate;
//# sourceMappingURL=FieldTemplate.js.map