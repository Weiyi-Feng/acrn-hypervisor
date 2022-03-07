import React from "react";
const FileWidget = (props) => {
    const { registry } = props;
    const { TextWidget } = registry.widgets;
    return React.createElement(TextWidget, { ...props, type: "file" });
};
export default FileWidget;
//# sourceMappingURL=FileWidget.js.map