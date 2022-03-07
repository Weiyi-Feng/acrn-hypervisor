import React from "react";
import Form from "react-bootstrap/Form";
const PasswordWidget = ({ id, required, readonly, disabled, value, label, onFocus, onBlur, onChange, options, autofocus, schema, rawErrors = [], }) => {
    const _onChange = ({ target: { value }, }) => onChange(value === "" ? options.emptyValue : value);
    const _onBlur = ({ target: { value } }) => onBlur(id, value);
    const _onFocus = ({ target: { value }, }) => onFocus(id, value);
    return (React.createElement(Form.Group, { className: "mb-0" },
        React.createElement(Form.Label, { className: rawErrors.length > 0 ? "text-danger" : "" },
            label || schema.title,
            (label || schema.title) && required ? "*" : null),
        React.createElement(Form.Control, { id: id, autoFocus: autofocus, className: rawErrors.length > 0 ? "is-invalid" : "", required: required, disabled: disabled, readOnly: readonly, type: "password", value: value ? value : "", onFocus: _onFocus, onBlur: _onBlur, onChange: _onChange })));
};
export default PasswordWidget;
//# sourceMappingURL=PasswordWidget.js.map