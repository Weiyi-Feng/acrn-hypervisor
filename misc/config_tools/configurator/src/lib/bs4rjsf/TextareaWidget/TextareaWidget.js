import React from "react";
import FormControl from "react-bootstrap/FormControl";
import InputGroup from "react-bootstrap/InputGroup";
const TextareaWidget = ({ id, placeholder, value, required, disabled, autofocus, label, readonly, onBlur, onFocus, onChange, options, schema, rawErrors = [], uiSchema, }) => {
    const _onChange = ({ target: { value }, }) => onChange(value === "" ? options.emptyValue : value);
    const _onBlur = ({ target: { value }, }) => onBlur(id, value);
    const _onFocus = ({ target: { value }, }) => onFocus(id, value);
    return (React.createElement(React.Fragment, null,
        React.createElement("label", { htmlFor: id },
            uiSchema["ui:title"] || schema.title || label,
            required && (React.createElement("span", { "aria-hidden": true, className: rawErrors.length > 0 ? "text-danger ml-1" : "ml-1" },
                "\u2009",
                "*"))),
        React.createElement(InputGroup, null,
            React.createElement(FormControl, { id: id, as: "textarea", placeholder: placeholder, disabled: disabled, readOnly: readonly, value: value, required: required, autoFocus: autofocus, rows: options.rows || 5, onChange: _onChange, onBlur: _onBlur, onFocus: _onFocus }))));
};
export default TextareaWidget;
//# sourceMappingURL=TextareaWidget.js.map