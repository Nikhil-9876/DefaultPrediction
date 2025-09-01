// src/components/SummaryCards.jsx
import React from "react";

function SummaryCards({ data }) {
  const cardData = [
    {
      type: "Approve",
      title: "Approved",
      icon: "fa-check-circle",
      bgColor: "bg-green-600",
      textColor: "text-white"
    },
    {
      type: "Review",
      title: "Needs Review",
      icon: "fa-exclamation-circle",
      bgColor: "bg-yellow-500",
      textColor: "text-white"
    },
    {
      type: "Reject",
      title: "Rejected",
      icon: "fa-times-circle",
      bgColor: "bg-red-500",
      textColor: "text-white"
    },
    {
      type: "Total",
      title: "Total Applications",
      icon: "fa-file-alt",
      bgColor: "bg-blue-500",
      textColor: "text-white",
      value: (data?.Approve || 0) + (data?.Review || 0) + (data?.Reject || 0)
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cardData.map((card) => (
        <div
          key={card.type}
          className={`p-5 rounded-xl shadow-md ${card.bgColor} ${card.textColor}`}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">{card.title}</div>
              <div className="text-2xl font-bold mt-1">
                {card.value || data?.[card.type] || 0}
              </div>
            </div>
            <div className="text-2xl">
              <i className={`fas ${card.icon}`}></i>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SummaryCards;