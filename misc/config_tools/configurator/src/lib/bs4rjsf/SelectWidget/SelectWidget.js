import React from "react";
import Form from "react-bootstrap/Form";
import { utils } from "@rjsf/core";
const { asNumber, guessType } = utils;
const nums = new Set(["number", "integer"]);
/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
const processValue = (schema, value) => {
    // "enum" is a reserved word, so only "type" and "items" can be destructured
    const { type, items } = schema;
    if (value === "") {
        return undefined;
    }
    else if (type === "array" && items && nums.has(items.type)) {
        return value.map(asNumber);
    }
    else if (type === "boolean") {
        return value === "true";
    }
    else if (type === "number") {
        return asNumber(value);
    }
    // If type is undefined, but an enum is present, try and infer the type from
    // the enum values
    if (schema.enum) {
        if (schema.enum.every((x) => guessType(x) === "number")) {
            return asNumber(value);
        }
        else if (schema.enum.every((x) => guessType(x) === "boolean")) {
            return value === "true";
        }
    }
    return value;
};
const SelectWidget = ({ schema, id, options, label, required, disabled, readonly, value, multiple, autofocus, onChange, onBlur, onFocus, placeholder, rawErrors = [], }) => {
    const { enumOptions, enumDisabled } = options;
    const emptyValue = multiple ? [] : "";
    function getValue(event, multiple) {
        if (multiple) {
            return [].slice
                .call(event.target.options)
                .filter((o) => o.selected)
                .map((o) => o.value);
        }
        else {
            return event.target.value;
        }
    }
    return (React.createElement(Form.Group, { className: "row" },
        React.createElement(Form.Label, { className: "col-sm-4 col-form-label " + (rawErrors.length > 0 ? "text-danger" : "") },
            label || schema.title,
            (label || schema.title) && required ? "*" : null),
        React.createElement("div", { className: "col-sm-8" },
            React.createElement(Form.Control, { as: "select", id: id, value: typeof value === "undefined" ? emptyValue : value, required: required, multiple: multiple, disabled: disabled, readOnly: readonly, autoFocus: autofocus, className: "form-select " + (rawErrors.length > 0 ? "is-invalid" : ""), onBlur: onBlur &&
                    ((event) => {
                        const newValue = getValue(event, multiple);
                        onBlur(id, processValue(schema, newValue));
                    }), onFocus: onFocus &&
                    ((event) => {
                        const newValue = getValue(event, multiple);
                        onFocus(id, processValue(schema, newValue));
                    }), onChange: (event) => {
                    const newValue = getValue(event, multiple);
                    onChange(processValue(schema, newValue));
                } },
                !multiple && schema.default === undefined && (React.createElement("option", { value: "" }, placeholder)),
                enumOptions.map(({ value, label }, i) => {
                    const disabled = Array.isArray(enumDisabled) &&
                        enumDisabled.indexOf(value) != -1;
                    return (React.createElement("option", { key: i, id: label, value: value, disabled: disabled }, label));
                })))));
};
export default SelectWidget;
//# sourceMappingURL=SelectWidget.js.map