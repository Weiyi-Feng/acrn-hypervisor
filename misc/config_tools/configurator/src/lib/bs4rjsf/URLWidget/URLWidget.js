import React from "react";
const URLWidget = (props) => {
    const { registry } = props;
    const { TextWidget } = registry.widgets;
    return React.createElement(TextWidget, { ...props, type: "url" });
};
export default URLWidget;
//# sourceMappingURL=URLWidget.js.map