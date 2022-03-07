import React from "react";
const DateWidget = (props) => {
    const { registry } = props;
    const { TextWidget } = registry.widgets;
    return (React.createElement(TextWidget, { ...props, type: "date" }));
};
export default DateWidget;
//# sourceMappingURL=DateWidget.js.map