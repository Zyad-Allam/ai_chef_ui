"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChefHat, ListChecks, Loader, CheckCircle, Clock } from "lucide-react";

/** --- Data Structures --- **/

/**
 * @typedef {'pending' | 'preparing' | 'completed'} OrderStatus
 * @typedef {Object} Recipe
 * @property {string} meal
 * @property {string[]} steps
 *
 * @typedef {Object} OrderTicket
 * @property {string} id
 * @property {number} orderNumber
 * @property {Recipe} recipe
 * @property {OrderStatus} status
 * @property {number} timestamp
 */

/** --- Utility Functions --- **/

const createNewTicket = (existingOrders, recipeData) => {
  const nextOrderNumber =
    existingOrders.length > 0
      ? Math.max(...existingOrders.map((o) => o.orderNumber)) + 1
      : 101;

  return {
    id: crypto.randomUUID(),
    orderNumber: nextOrderNumber,
    recipe: recipeData,
    status: "pending",
    timestamp: Date.now(),
  };
};

const getStatusBadge = (status) => {
  switch (status) {
    case "pending":
      return {
        className: "bg-red-100 text-red-700",
        icon: Clock,
        label: "Pending",
      };
    case "preparing":
      return {
        className: "bg-yellow-100 text-yellow-700",
        icon: Loader,
        label: "In Progress",
      };
    case "completed":
      return {
        className: "bg-green-100 text-green-700",
        icon: CheckCircle,
        label: "Completed",
      };
    default:
      return {
        className: "bg-gray-100 text-gray-500",
        icon: Clock,
        label: "Unknown",
      };
  }
};

/** --- Subcomponents --- **/

const TicketItem = ({ ticket, isSelected, onSelect }) => {
  const {
    className: badgeClass,
    icon: Icon,
    label,
  } = getStatusBadge(ticket.status);
  const timeString = new Date(ticket.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      onClick={() => onSelect(ticket.id)}
      className={`
        p-4 mb-2 rounded-lg cursor-pointer transition-all duration-200
        shadow-sm hover:shadow-md border-2
        ${isSelected ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500" : "bg-white border-gray-200 hover:bg-gray-50"}
      `}
    >
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-gray-800">
          Order{" "}
          <span className="text-xl font-extrabold text-blue-600">
            #{ticket.orderNumber}
          </span>
        </p>
        <div
          className={`flex items-center space-x-1 px-2 py-0.5 text-xs font-medium rounded-full ${badgeClass}`}
        >
          <Icon size={12} />
          <span>{label}</span>
        </div>
      </div>
      <p className="text-lg font-medium mt-1 text-gray-900 truncate">
        {ticket.recipe.meal}
      </p>
      <p className="text-xs text-gray-500 mt-1">Received at {timeString}</p>
    </div>
  );
};

const RecipeDetail = ({ order, onUpdateStatus }) => {
  if (!order) {
    return (
      <div className="p-8 h-full flex items-center justify-center bg-gray-50 rounded-lg shadow-inner">
        <div className="text-center text-gray-500">
          <ListChecks size={48} className="mx-auto text-gray-300" />
          <h3 className="mt-4 text-xl font-semibold">Select an Order Ticket</h3>
          <p className="mt-1">
            Choose a pending order from the list to view its steps.
          </p>
        </div>
      </div>
    );
  }

  const {
    className: badgeClass,
    icon: Icon,
    label,
  } = getStatusBadge(order.status);

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl h-full flex flex-col">
      <div className="pb-4 border-b border-gray-200 mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Order #{order.orderNumber}: {order.meal}
        </h2>
        <div
          className={`inline-flex items-center space-x-2 mt-2 px-3 py-1 text-sm font-semibold rounded-full ${badgeClass}`}
        >
          <Icon size={16} />
          <span>{label}</span>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto pr-2">
        <h3 className="text-xl font-bold text-gray-700 mb-3">
          Preparation Steps:
        </h3>
        <ol className="space-y-4">
          {order.recipe.steps.map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-500 text-white font-bold rounded-full mr-3 text-sm shadow-md">
                {index + 1}
              </span>
              <p className="text-gray-800 text-base pt-0.5">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="pt-6 border-t border-gray-200 mt-6 flex justify-end space-x-4">
        {order.status !== "completed" && (
          <button
            onClick={() =>
              onUpdateStatus(
                order.id,
                order.status === "pending" ? "preparing" : "pending",
              )
            }
            className="flex items-center px-4 py-2 border border-yellow-500 text-yellow-500 font-semibold rounded-lg shadow-sm hover:bg-yellow-50 transition duration-150"
            title={
              order.status === "pending"
                ? "Start cooking this meal"
                : "Pause / Revert to Pending"
            }
          >
            <Loader size={20} className="mr-2" />
            {order.status === "pending" ? "Start Cooking" : "Pause"}
          </button>
        )}

        {order.status !== "completed" && (
          <button
            onClick={() => onUpdateStatus(order.id, "completed")}
            className="flex items-center px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-150 transform hover:scale-[1.02]"
          >
            <CheckCircle size={20} className="mr-2" />
            Mark as Complete
          </button>
        )}
      </div>
    </div>
  );
};

/** --- Main App Component --- **/

export default function App() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  const handleUpdateStatus = useCallback((id, newStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === id ? { ...order, status: newStatus } : order,
      ),
    );
    if (newStatus === "completed")
      setTimeout(() => setSelectedOrderId(null), 500);
  }, []);

  // --- SSE Stream Setup ---
  useEffect(() => {
    const eventSource = new EventSource("http://localhost:5000/stream-recipes");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        //console.log("data:", data);
        console.log("meal: ", data.meal);
        if (data && data.meal) {
          const newTicket = createNewTicket(orders, data);
          console.log("newTicket: ", newTicket);
          setOrders((prevOrders) => [...prevOrders, newTicket]);
          console.log("orders: ", orders);
          setSelectedOrderId(newTicket.id);
        }
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === "pending"),
    [orders],
  );
  const activeOrders = useMemo(
    () => orders.filter((o) => o.status === "preparing"),
    [orders],
  );
  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "completed"),
    [],
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 flex items-center">
          <ChefHat size={36} className="text-blue-600 mr-3" />
          Oi, panini head! ...
        </h1>
        <p className="text-sm text-gray-500">Listening for new orders...</p>
      </header>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
        {/* Ticket List */}
        <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-lg flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
            Active Tickets ({pendingOrders.length + activeOrders.length})
          </h2>
          <div className="overflow-y-auto flex-grow pr-2">
            {activeOrders.length > 0 && (
              <>
                <h3 className="text-sm font-bold uppercase text-yellow-700 mb-2 mt-2">
                  Preparing ({activeOrders.length})
                </h3>
                {activeOrders.map((ticket) => (
                  <TicketItem
                    key={ticket.id}
                    ticket={ticket}
                    isSelected={ticket.id === selectedOrderId}
                    onSelect={setSelectedOrderId}
                  />
                ))}
              </>
            )}

            {pendingOrders.length > 0 && (
              <>
                <h3 className="text-sm font-bold uppercase text-red-700 mb-2 mt-4">
                  Pending ({pendingOrders.length})
                </h3>
                {pendingOrders.map((ticket) => (
                  <TicketItem
                    key={ticket.id}
                    ticket={ticket}
                    isSelected={ticket.id === selectedOrderId}
                    onSelect={setSelectedOrderId}
                  />
                ))}
              </>
            )}

            {pendingOrders.length === 0 && activeOrders.length === 0 && (
              <p className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-300 rounded-lg mt-4">
                No active orders currently.
              </p>
            )}
          </div>
        </div>

        {/* Recipe Detail */}
        <div className="lg:col-span-2 h-full">
          <RecipeDetail
            order={selectedOrder}
            onUpdateStatus={handleUpdateStatus}
          />
        </div>
      </div>

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <div className="mt-6 p-4 bg-white rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-700 flex items-center">
            <ListChecks size={20} className="mr-2 text-green-500" />
            Completed Orders ({completedOrders.length}).
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {completedOrders.map((order) => (
              <span
                key={order.id}
                className="text-sm px-3 py-1 bg-green-50 text-green-700 rounded-full"
              >
                #{order.orderNumber} - {order.recipe.meal}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
