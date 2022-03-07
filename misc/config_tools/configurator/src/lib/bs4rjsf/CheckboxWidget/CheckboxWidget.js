import React from "react";
import Form from "react-bootstrap/Form";
const CheckboxWidget = (props) => {
    const { id, value, required, disabled, readonly, label, schema, autofocus, onChange, onBlur, onFocus, } = props;
    const _onChange = ({ target: { checked }, }) => onChange(checked);
    const _onBlur = ({ target: { checked }, }) => onBlur(id, checked);
    const _onFocus = ({ target: { checked }, }) => onFocus(id, checked);
    const desc = label || schema.description;
    return (React.createElement(Form.Group, { className: `checkbox ${disabled || readonly ? "disabled" : ""}` },
        React.createElement(Form.Check, { id: id, label: desc, checked: typeof value === "undefined" ? false : value, required: required, disabled: disabled || readonly, autoFocus: autofocus, onChange: _onChange, type: "checkbox", onBlur: _onBlur, onFocus: _onFocus })));
};
export default CheckboxWidget;
//# sourceMappingURL=CheckboxWidget.js.map