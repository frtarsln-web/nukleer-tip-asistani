import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts';

// Lazy load pages for better performance
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const PatientManagementPage = React.lazy(() => import('./pages/PatientManagementPage'));
const StockManagementPage = React.lazy(() => import('./pages/StockManagementPage'));
const DoctorPage = React.lazy(() => import('./pages/DoctorPage'));
const PhysicistPage = React.lazy(() => import('./pages/PhysicistPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const WastePage = React.lazy(() => import('./pages/WastePage'));
const HandbookPage = React.lazy(() => import('./pages/HandbookPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));

// Loading fallback
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020202] via-[#0a0a1a] to-[#020202]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 font-bold">Yükleniyor...</p>
        </div>
    </div>
);

// Wrap lazy components with Suspense
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
    <React.Suspense fallback={<PageLoader />}>
        <Component />
    </React.Suspense>
);

export const router = createBrowserRouter([
    {
        path: '/login',
        element: withSuspense(LoginPage),
    },
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: withSuspense(DashboardPage),
            },
            {
                path: 'patients',
                element: withSuspense(PatientManagementPage),
            },
            {
                path: 'stock',
                element: withSuspense(StockManagementPage),
            },
            {
                path: 'doctor',
                element: withSuspense(DoctorPage),
            },
            {
                path: 'physicist',
                element: withSuspense(PhysicistPage),
            },
            {
                path: 'reports',
                element: withSuspense(ReportsPage),
            },
            {
                path: 'waste',
                element: withSuspense(WastePage),
            },
            {
                path: 'handbook',
                element: withSuspense(HandbookPage),
            },
            {
                path: 'settings',
                element: withSuspense(SettingsPage),
            },
        ],
    },
    {
        path: '*',
        element: <Navigate to="/" replace />,
    },
]);
