import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "../Layout";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import Placeholder from "../pages/Placeholder";
import NegotiationOngoing from "../pages/NegotiationOngoing";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import PublicRoute from "../components/PublicRoute.jsx";

const router = createBrowserRouter([
    {
        element: <PublicRoute />,
        children: [
            { path: "/login", element: <Login /> },
            { path: "/signup", element: <Signup /> },
        ],
    },
    {
        element: <ProtectedRoute />,
        children: [
            {
                path: "/",
                element: <Layout />,
                children: [
                    { index: true, element: <Dashboard /> },
                    { path: "negociations", element: <NegotiationOngoing /> },
                    { path: "demandes", element: <Placeholder page="demandes" /> },
                    { path: "emplois", element: <Placeholder page="emplois" /> },
                    { path: "statistiques", element: <Placeholder page="statistiques" /> },
                    { path: "profil", element: <Profile /> },
                    { path: "parametres", element: <Placeholder page="parametres" /> },
                ],
            },
        ],
    },
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
