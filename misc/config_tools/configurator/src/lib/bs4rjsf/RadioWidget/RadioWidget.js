import React from "react";
import Form from "react-bootstrap/Form";
const RadioWidget = ({ id, schema, options, value, required, disabled, readonly, label, onChange, onBlur, onFocus, uiSchema, }) => {
    const { enumOptions, enumDisabled } = options;
    const _onChange = ({ target: { value }, }) => onChange(schema.type == "boolean" ? value !== "false" : value);
    const _onBlur = ({ target: { value } }) => onBlur(id, value);
    const _onFocus = ({ target: { value }, }) => onFocus(id, value);
    const inline = Boolean(options && options.inline);
    return (React.createElement(Form.Group, { className: "mb-0" },
        React.createElement(Form.Label, { className: "d-block" },
            uiSchema["ui:title"] || schema.title || label,
            (label || uiSchema["ui:title"] || schema.title) && required ? "*" : null),
        enumOptions.map((option, i) => {
            const itemDisabled = Array.isArray(enumDisabled) &&
                enumDisabled.indexOf(option.value) !== -1;
            const checked = option.value == value;
            // @ts-ignore
            const radio = (React.createElement(Form.Check, { inline: inline, label: option.label, id: option.label, key: i, name: id, type: "radio", disabled: disabled || itemDisabled || readonly, checked: checked, required: required, value: option.value, onChange: _onChange, onBlur: _onBlur, onFocus: _onFocus }));
            return radio;
        })));
};
export default RadioWidget;
//# sourceMappingURL=RadioWidget.js.map