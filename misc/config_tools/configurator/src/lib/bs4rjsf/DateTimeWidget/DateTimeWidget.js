import React from "react";
import { utils } from "@rjsf/core";
const { localToUTC, utcToLocal } = utils;
const DateTimeWidget = (props) => {
    const { registry } = props;
    const { TextWidget } = registry.widgets;
    const value = utcToLocal(props.value);
    const onChange = (value) => {
        props.onChange(localToUTC(value));
    };
    return (React.createElement(TextWidget, { ...props, type: "datetime-local", value: value, onChange: onChange }));
};
export default DateTimeWidget;
//# sourceMappingURL=DateTimeWidget.js.map