import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "../Layout";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import Placeholder from "../pages/Placeholder";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true,          element: <Dashboard /> },
            { path: "negociations",  element: <Placeholder page="negociations" /> },
            { path: "demandes",      element: <Placeholder page="demandes" /> },
            { path: "emplois",       element: <Placeholder page="emplois" /> },
            { path: "statistiques",  element: <Placeholder page="statistiques" /> },
            { path: "profil",        element: <Profile /> },
            { path: "parametres",    element: <Placeholder page="parametres" /> },
        ],
    },
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;