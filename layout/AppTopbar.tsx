// layout/AppTopbar.tsx
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import { useRouter } from 'next/navigation';
import { logout } from '../demo/service/AuthService';
import { Toast } from 'primereact/toast';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    // Renamed for clarity: This will be the button that triggers the logout dropdown
    const userProfileDropdownButtonRef = useRef(null);
    const profileMenuRef = useRef<Menu>(null);
    const toast = useRef<Toast>(null);
    const router = useRouter();

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current
        // Removed topbarmenubutton from imperative handle as it's no longer used for the primary menu
    }));

    const handleLogout = async () => {
        const result = await logout();
        if (result.success) {
            toast.current?.show({ severity: 'success', summary: 'Success', detail: result.message, life: 3000 });
            router.push('/auth/login');
        } else {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: result.message, life: 3000 });
        }
    };

    const profileMenuItems: MenuItem[] = [
        {
            label: 'Profile',
            icon: 'pi pi-user',
            command: () => {
                // Optional: Redirect to a profile page or open a profile modal
                // router.push('/pages/profile');
            }
        },
        {
            label: 'Settings',
            icon: 'pi pi-cog',
            command: () => {
                // Optional: Redirect to a settings page or open a settings modal
                // router.push('/pages/settings');
            }
        },
        {
            separator: true
        },
        {
            label: 'Logout',
            icon: 'pi pi-power-off',
            command: handleLogout
        }
    ];

    return (
        <div className="layout-topbar">
            <Toast ref={toast} />
            <Link href="/" className="layout-topbar-logo">
                <img src={`/layout/images/logo-dps.png`} width="47.22px" height={'35px'} alt="logo" />
                <span>DPS - Kuwait</span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            {/* This is the highlighted user icon button */}
            <div className='layout-topbar-menu'>
            <button
                ref={userProfileDropdownButtonRef}
                type="button"
                className="p-link layout-topbar-button" // <-- Changed this
                onClick={(event) => profileMenuRef.current?.toggle(event)}
            >
                <i className="pi pi-user" />
            </button>

            {/*
                This div (layout-topbar-menu) will now only contain the PrimeReact Menu.
                The other buttons (Calendar, Profile, Settings) are removed from here
                as per your request to only show the highlighted user icon which triggers the dropdown.
            */}
            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                {/* Removed the 'target' prop from Menu */}
                <Menu model={profileMenuItems} popup ref={profileMenuRef} id="profile_menu" />
            </div>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;

// import Link from 'next/link';
// import { classNames } from 'primereact/utils';
// import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
// import { AppTopbarRef } from '@/types';
// import { LayoutContext } from './context/layoutcontext';

// const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
//     const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
//     const menubuttonRef = useRef(null);
//     const topbarmenuRef = useRef(null);
//     const topbarmenubuttonRef = useRef(null);

//     useImperativeHandle(ref, () => ({
//         menubutton: menubuttonRef.current,
//         topbarmenu: topbarmenuRef.current,
//         topbarmenubutton: topbarmenubuttonRef.current
//     }));

//     return (
//         <div className="layout-topbar">
//             <Link href="/" className="layout-topbar-logo">
//                 <img src={`/layout/images/logo-${layoutConfig.colorScheme !== 'light' ? 'white' : 'dark'}.svg`} width="47.22px" height={'35px'} alt="logo" />
//                 <span>SAKAI</span>
//             </Link>

//             <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
//                 <i className="pi pi-bars" />
//             </button>

//             <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
//                 <i className="pi pi-ellipsis-v" />
//             </button>

//             <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
//                 <button type="button" className="p-link layout-topbar-button">
//                     <i className="pi pi-calendar"></i>
//                     <span>Calendar</span>
//                 </button>
//                 <button type="button" className="p-link layout-topbar-button">
//                     <i className="pi pi-user"></i>
//                     <span>Profile</span>
//                 </button>
//                 <Link href="/documentation">
//                     <button type="button" className="p-link layout-topbar-button">
//                         <i className="pi pi-cog"></i>
//                         <span>Settings</span>
//                     </button>
//                 </Link>
//             </div>
//         </div>
//     );
// });

// AppTopbar.displayName = 'AppTopbar';

// export default AppTopbar;
