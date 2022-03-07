import React from "react";
const EmailWidget = (props) => {
    const { registry } = props;
    const { TextWidget } = registry.widgets;
    return React.createElement(TextWidget, { ...props, type: "email" });
};
export default EmailWidget;
//# sourceMappingURL=EmailWidget.js.map