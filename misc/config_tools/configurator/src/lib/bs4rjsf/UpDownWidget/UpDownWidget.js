import React from "react";
import Form from "react-bootstrap/Form";
const UpDownWidget = ({ id, required, readonly, disabled, label, value, onChange, onBlur, onFocus, autofocus, schema, uiSchema, }) => {
    const _onChange = ({ target: { value }, }) => onChange(value);
    const _onBlur = ({ target: { value } }) => onBlur(id, value);
    const _onFocus = ({ target: { value }, }) => onFocus(id, value);
    return (React.createElement(Form.Group, { className: "mb-0" },
        React.createElement(Form.Label, null,
            uiSchema["ui:title"] || schema.title || label,
            (label || uiSchema["ui:title"] || schema.title) && required ? "*" : null),
        React.createElement(Form.Control, { id: id, autoFocus: autofocus, required: required, type: "number", disabled: disabled, readOnly: readonly, value: value || value === 0 ? value : "", onChange: _onChange, onBlur: _onBlur, onFocus: _onFocus })));
};
export default UpDownWidget;
//# sourceMappingURL=UpDownWidget.js.map