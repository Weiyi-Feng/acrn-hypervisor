import React from "react";
import Form from "react-bootstrap/Form";
const TextWidget = ({ id, placeholder, required, readonly, disabled, type, label, value, onChange, onBlur, onFocus, autofocus, options, schema, rawErrors = [], uiSchema, }) => {
    const _onChange = ({ target: { value }, }) => onChange(value === "" ? options.emptyValue : value);
    const _onBlur = ({ target: { value } }) => onBlur(id, value);
    const _onFocus = ({ target: { value }, }) => onFocus(id, value);
    const inputType = (type || schema.type) === "string" ? "text" : `${type || schema.type}`;
    // const classNames = [rawErrors.length > 0 ? "is-invalid" : "", type === 'file' ? 'custom-file-label': ""]
    return (React.createElement(Form.Group, { className: "mb-0 row" },
        React.createElement(Form.Label, { className: "col-sm-4 col-form-label " + (rawErrors.length > 0 ? "text-danger" : "") },
            uiSchema["ui:title"] || schema.title || label,
            (label || uiSchema["ui:title"] || schema.title) && required ? "*" : null),
        React.createElement("div", { className: "col-sm-8" },
            React.createElement(Form.Control, { id: id, placeholder: placeholder, autoFocus: autofocus, required: required, disabled: disabled, readOnly: readonly, className: rawErrors.length > 0 ? "is-invalid" : "", list: schema.examples ? `examples_${id}` : undefined, type: inputType, value: value || value === 0 ? value : "", onChange: _onChange, onBlur: _onBlur, onFocus: _onFocus })),
        schema.examples ? (React.createElement("datalist", { id: `examples_${id}` }, schema.examples
            .concat(schema.default ? [schema.default] : [])
            .map((example) => {
            return React.createElement("option", { key: example, value: example });
        }))) : null));
};
export default TextWidget;
//# sourceMappingURL=TextWidget.js.map