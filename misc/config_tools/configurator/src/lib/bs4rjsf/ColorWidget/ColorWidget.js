import React from "react";
const ColorWidget = (props) => {
    const { registry } = props;
    const { TextWidget } = registry.widgets;
    return React.createElement(TextWidget, { ...props, type: "color" });
};
export default ColorWidget;
//# sourceMappingURL=ColorWidget.js.map