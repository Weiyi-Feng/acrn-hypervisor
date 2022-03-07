import React from "react";
import Form from "react-bootstrap/Form";
const selectValue = (value, selected, all) => {
    const at = all.indexOf(value);
    const updated = selected.slice(0, at).concat(value, selected.slice(at));
    // As inserting values at predefined index positions doesn't work with empty
    // arrays, we need to reorder the updated selection to match the initial order
    return updated.sort((a, b) => all.indexOf(a) > all.indexOf(b));
};
const deselectValue = (value, selected) => {
    return selected.filter((v) => v !== value);
};
const CheckboxesWidget = ({ schema, label, id, disabled, options, value, autofocus, readonly, required, onChange, onBlur, onFocus, }) => {
    const { enumOptions, enumDisabled, inline } = options;
    const _onChange = (option) => ({ target: { checked }, }) => {
        const all = enumOptions.map(({ value }) => value);
        if (checked) {
            onChange(selectValue(option.value, value, all));
        }
        else {
            onChange(deselectValue(option.value, value));
        }
    };
    const _onBlur = ({ target: { value } }) => onBlur(id, value);
    const _onFocus = ({ target: { value }, }) => onFocus(id, value);
    return (React.createElement(React.Fragment, null,
        React.createElement(Form.Label, { htmlFor: id }, label || schema.title),
        React.createElement(Form.Group, null, enumOptions.map((option, index) => {
            const checked = value.indexOf(option.value) !== -1;
            const itemDisabled = enumDisabled && enumDisabled.indexOf(option.value) != -1;
            return inline ? (React.createElement(Form, { key: index },
                React.createElement(Form.Check, { required: required, inline: true, className: "bg-transparent border-0", custom: true, checked: checked, type: "checkbox", id: `${id}_${index}`, label: option.label, autoFocus: autofocus && index === 0, onChange: _onChange(option), onBlur: _onBlur, onFocus: _onFocus, disabled: disabled || itemDisabled || readonly }))) : (React.createElement(Form, { key: index },
                React.createElement(Form.Check, { custom: true, required: required, checked: checked, className: "bg-transparent border-0", type: "checkbox", id: `${id}_${index}`, label: option.label, autoFocus: autofocus && index === 0, onChange: _onChange(option), onBlur: _onBlur, onFocus: _onFocus, disabled: disabled || itemDisabled || readonly })));
        }))));
};
export default CheckboxesWidget;
//# sourceMappingURL=CheckboxesWidget.js.map