import React from "react";
import Form from "react-bootstrap/Form";
import { utils } from "@rjsf/core";
const { rangeSpec } = utils;
const RangeWidget = ({ value, readonly, disabled, onBlur, onFocus, options, schema, onChange, required, label, id, uiSchema, }) => {
    let sliderProps = { value, label, id, ...rangeSpec(schema) };
    const _onChange = ({ target: { value }, }) => onChange(value === "" ? options.emptyValue : value);
    const _onBlur = ({ target: { value } }) => onBlur(id, value);
    const _onFocus = ({ target: { value }, }) => onFocus(id, value);
    return (React.createElement(Form.Group, { className: "mb-0" },
        React.createElement(Form.Label, null,
            uiSchema["ui:title"] || schema.title || label,
            (label || uiSchema["ui:title"] || schema.title) && required ? "*" : null),
        React.createElement(Form.Control, { type: "range", required: required, disabled: disabled, readOnly: readonly, onChange: _onChange, onBlur: _onBlur, onFocus: _onFocus, ...sliderProps }),
        React.createElement("span", { className: "range-view" }, value)));
};
export default RangeWidget;
//# sourceMappingURL=RangeWidget.js.map