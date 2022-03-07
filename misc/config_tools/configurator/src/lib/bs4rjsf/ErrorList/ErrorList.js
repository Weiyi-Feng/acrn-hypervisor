import React from "react";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
const ErrorList = ({ errors }) => (React.createElement(Card, { border: "danger", className: "mb-4" },
    React.createElement(Card.Header, { className: "alert-danger" }, "Errors"),
    React.createElement(Card.Body, { className: "p-0" },
        React.createElement(ListGroup, null, errors.map((error, i) => {
            return (React.createElement(ListGroup.Item, { key: i, className: "border-0" },
                React.createElement("span", null, error.stack)));
        })))));
export default ErrorList;
//# sourceMappingURL=ErrorList.js.map