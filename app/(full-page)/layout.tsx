import { Metadata } from 'next';
import AppConfig from '../../layout/AppConfig';
import React from 'react';


interface SimpleLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'Employee Management System',
    description: 'Employee Management System using PrimeReact and Spring Boot',
    keywords: 'Employee Management, PrimeReact, Spring Boot, React',
};

export default function SimpleLayout({ children }: SimpleLayoutProps) {
    return (
        <React.Fragment>
            {children}
            <AppConfig simple />
        </React.Fragment>
    );
}
