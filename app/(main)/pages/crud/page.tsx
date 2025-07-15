// main/pages/crud/page.tsx
/* eslint-disable @next/next/no-img-element */
'use client';

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta, DataTablePageEvent, DataTableSortEvent } from 'primereact/datatable'; // Import event types
import { Dialog } from 'primereact/dialog';
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import { Demo } from '@/types';
import { EmployeeService } from '../../../../demo/service/EmployeeService'; // Corrected path

const Crud = () => {
    let emptyEmployee: Demo.Employee = {
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        position: '',
        salary: 0,
    };

    const [employees, setEmployees] = useState<Demo.Employee[] | null>(null);
    const [employeeDialog, setEmployeeDialog] = useState(false);
    const [deleteEmployeeDialog, setDeleteEmployeeDialog] = useState(false);
    const [deleteEmployeesDialog, setDeleteEmployeesDialog] = useState(false);
    const [employee, setEmployee] = useState<Demo.Employee>(emptyEmployee);
    const [selectedEmployees, setSelectedEmployees] = useState<Demo.Employee[] | null>(null);
    const [submitted, setSubmitted] = useState(false);
    // REMOVED: const [globalFilter, setGlobalFilter] = useState(''); // Managed by lazyParams now
    const toast = useRef<Toast>(null);
    const dt = useRef<DataTable<any>>(null);

    // --- NEW STATE FOR LAZY LOADING ---
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lazyParams, setLazyParams] = useState({
        first: 0, // Current starting index (for pagination)
        rows: 10, // Number of rows per page
        page: 0, // Current page number (calculated from first/rows)
        sortField: null as string | null, // The field currently being sorted
        sortOrder: null as 1 | -1 | null, // Sort order: 1 for asc, -1 for desc
        filters: {} as DataTableFilterMeta // Object to store current filters
    });
    // --- END NEW STATE ---

    // --- MODIFIED useEffect to trigger data load on lazyParams change ---
    useEffect(() => {
        loadLazyData();
    }, [lazyParams]); // This effect now depends on lazyParams

    // --- NEW loadLazyData function ---
    const loadLazyData = async () => {
        setLoading(true);
        try {
            // Ensure all filters have a defined matchMode (PrimeReact sometimes leaves it undefined)
            const normalizedFilters: { [key: string]: { value: any; matchMode: string } } = {};
            Object.entries(lazyParams.filters || {}).forEach(([key, filter]) => {
                if (filter && typeof filter === 'object' && 'value' in filter) {
                    normalizedFilters[key] = {
                        value: (filter as any).value,
                        matchMode: (filter as any).matchMode ?? 'contains'
                    };
                }
            });

            const data = await EmployeeService.getEmployeesLazy(
                lazyParams.first,
                lazyParams.rows,
                lazyParams.sortField,
                lazyParams.sortOrder,
                normalizedFilters // Pass the normalized filters
            );
            console.log("Received data:", data); // For debugging
            setEmployees(data.content);
            setTotalRecords(data.totalElements); // Update total records count from backend
            setLoading(false);
        } catch (error) {
            console.error('Error fetching employees (lazy):', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load employees.', life: 3000 });
            setLoading(false);
        }
    };
    // --- END NEW loadLazyData ---


    // --- NEW HANDLERS FOR LAZY LOADING EVENTS ---
    const onPage = (event: DataTablePageEvent) => {
        // Merge event values with existing lazyParams to preserve sort/filter state
        setLazyParams(prevParams => ({
            ...prevParams,
            first: event.first,
            rows: event.rows,
            page: event.page !== undefined ? event.page : 0
        }));
    };

    const onSort = (event: DataTableSortEvent) => {
        // Event contains: sortField, sortOrder, multiSortMeta
        setLazyParams(prevParams => ({
            ...prevParams,
            sortField: event.sortField,
            sortOrder:
                event.sortOrder === 1 || event.sortOrder === -1
                    ? event.sortOrder
                    : null
        }));
    };

    const onFilter = (event: { filters: DataTableFilterMeta; filteredValue?: any[] }) => {
        // Event contains: filters, filteredValue
        setLazyParams(prevParams => ({
            ...prevParams,
            filters: event.filters,
            first: 0, // Reset to first page when filters change
            page: 0
        }));
    };

    // Global filter template for the header (updated to use onFilter)
    const globalFilterTemplate = () => {
        const filters = lazyParams.filters || {};
        const globalFilterValue =
            filters.global && 'value' in filters.global
                ? (filters.global as { value: string }).value
                : '';

        return (
            <span className="p-input-icon-left ml-auto">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    value={globalFilterValue}
                    onInput={(e) => {
                        const newFilters: DataTableFilterMeta = {
                            ...filters,
                            global: { value: (e.target as HTMLInputElement).value, matchMode: 'contains' }
                        };
                        onFilter({ filters: newFilters });
                    }}
                    placeholder="Search..."
                />
            </span>
        );
    };
    // --- END NEW HANDLERS ---

    const formatCurrency = (value: number) => {
        return value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    };

    const openNew = () => {
        setEmployee(emptyEmployee);
        setSubmitted(false);
        setEmployeeDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setEmployeeDialog(false);
    };

    const hideDeleteEmployeeDialog = () => {
        setDeleteEmployeeDialog(false);
    };

    const hideDeleteEmployeesDialog = () => {
        setDeleteEmployeesDialog(false);
    };

    const saveEmployee = async () => {
        setSubmitted(true);

        if (employee.firstName.trim() && employee.email.trim() && employee.position.trim()) {
            try {
                if (employee.id) {
                    await EmployeeService.updateEmployee(employee);
                    toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Employee Updated', life: 3000 });
                } else {
                    await EmployeeService.createEmployee(employee);
                    toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Employee Created', life: 3000 });
                }
                setEmployeeDialog(false);
                setEmployee(emptyEmployee);
                await loadLazyData(); // Refresh list after CUD operation
            } catch (error) {
                console.error('Error saving employee:', error);
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save employee.', life: 3000 });
            }
        }
    };

    const editEmployee = (employee: Demo.Employee) => {
        setEmployee({ ...employee });
        setEmployeeDialog(true);
    };

    const confirmDeleteEmployee = (employee: Demo.Employee) => {
        setEmployee(employee);
        setDeleteEmployeeDialog(true);
    };

    const deleteEmployee = async () => {
        if (!employee.id) return;
        try {
            await EmployeeService.deleteEmployee(employee.id);
            setDeleteEmployeeDialog(false);
            setEmployee(emptyEmployee);
            toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Employee Deleted', life: 3000 });
            await loadLazyData(); // Refresh list after CUD operation
        } catch (error) {
            console.error('Error deleting employee:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete employee.', life: 3000 });
        }
    };

    const exportCSV = () => {
        dt.current?.exportCSV();
    };

    const confirmDeleteSelected = () => {
        setDeleteEmployeesDialog(true);
    };

    const deleteSelectedEmployees = async () => { // Corrected name and implementation
        if (selectedEmployees && selectedEmployees.length > 0) {
            try {
                const idsToDelete = selectedEmployees.map(e => e.id as string);
                await EmployeeService.deleteMultipleEmployees(idsToDelete); // Call service for batch delete
                setDeleteEmployeesDialog(false);
                setSelectedEmployees(null);
                toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Employees Deleted', life: 3000 });
                await loadLazyData(); // Refresh list after CUD operation
            } catch (error) {
                console.error('Error deleting selected employees:', error);
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete selected employees.', life: 3000 });
            }
        }
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, name: keyof Demo.Employee) => {
        const val = (e.target && e.target.value) || '';
        let _employee = { ...employee };
        (_employee as any)[name] = val; // Type assertion needed here
        setEmployee(_employee);
    };

    const onInputNumberChange = (e: InputNumberValueChangeEvent, name: keyof Demo.Employee) => {
        const val = e.value || 0;
        let _employee = { ...employee };
        (_employee as any)[name] = val; // Type assertion needed here
        setEmployee(_employee);
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" severity="success" className="mr-2" onClick={openNew} />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" onClick={confirmDeleteSelected} disabled={!selectedEmployees || !(selectedEmployees as any).length} />
                </div>
            </React.Fragment>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Export" icon="pi pi-upload" severity="help" onClick={exportCSV} />
            </React.Fragment>
        );
    };

    const idBodyTemplate = (rowData: Demo.Employee) => {
        return (
            <>
                <span className="p-column-title">ID</span>
                {rowData.id}
            </>
        );
    };

    const firstNameBodyTemplate = (rowData: Demo.Employee) => {
        return (
            <>
                <span className="p-column-title">First Name</span>
                {rowData.firstName}
            </>
        );
    };

    const lastNameBodyTemplate = (rowData: Demo.Employee) => {
        return (
            <>
                <span className="p-column-title">Last Name</span>
                {rowData.lastName}
            </>
        );
    };

    const emailBodyTemplate = (rowData: Demo.Employee) => {
        return (
            <>
                <span className="p-column-title">Email</span>
                {rowData.email}
            </>
        );
    };

    const positionBodyTemplate = (rowData: Demo.Employee) => {
        return (
            <>
                <span className="p-column-title">Position</span>
                {rowData.position}
            </>
        );
    };

    const salaryBodyTemplate = (rowData: Demo.Employee) => {
        return (
            <>
                <span className="p-column-title">Salary</span>
                {formatCurrency(rowData.salary as number)}
            </>
        );
    };

    const createdDateBodyTemplate = (rowData: Demo.Employee) => {
        return (
            <>
                <span className="p-column-title">Created Date</span>
                {rowData.createdDate ? new Date(rowData.createdDate).toLocaleDateString() : ''}
            </>
        );
    };

    const modifiedDateBodyTemplate = (rowData: Demo.Employee) => {
        return (
            <>
                <span className="p-column-title">Modified Date</span>
                {rowData.modifiedDate ? new Date(rowData.modifiedDate).toLocaleDateString() : ''}
            </>
        );
    };


    const actionBodyTemplate = (rowData: Demo.Employee) => {
        return (
            <>
                <Button icon="pi pi-pencil" rounded severity="success" className="mr-2" onClick={() => editEmployee(rowData)} />
                <Button icon="pi pi-trash" rounded severity="warning" onClick={() => confirmDeleteEmployee(rowData)} />
            </>
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Employees</h5>
            {globalFilterTemplate()} {/* Use the updated global filter template */}
        </div>
    );

    const employeeDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" text onClick={saveEmployee} />
        </>
    );
    const deleteEmployeeDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" text onClick={hideDeleteEmployeeDialog} />
            <Button label="Yes" icon="pi pi-check" text onClick={deleteEmployee} />
        </>
    );
    const deleteEmployeesDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" text onClick={hideDeleteEmployeesDialog} />
            <Button label="Yes" icon="pi pi-check" text onClick={deleteSelectedEmployees} />
        </>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

                    <DataTable
                        ref={dt}
                        value={employees}
                        selection={selectedEmployees}
                        onSelectionChange={(e) => setSelectedEmployees(e.value as any)}
                        dataKey="id"
                        // --- LAZY LOADING PROPS ---
                        lazy // Enable lazy mode
                        paginator // Enable pagination UI
                        rows={lazyParams.rows} // Number of rows per page
                        totalRecords={totalRecords} // Total records count from backend
                        onPage={onPage} // Handle pagination changes
                        first={lazyParams.first} // Current first row index
                        sortField={lazyParams.sortField ?? undefined}
                        sortOrder={lazyParams.sortOrder}
                        onSort={onSort} // Handle sorting changes
                        onFilter={onFilter} // Handle filtering changes
                        filters={lazyParams.filters} // Pass current filter state
                        loading={loading} // Show loading spinner
                        // --- END LAZY LOADING PROPS ---

                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} employees"
                        // REMOVED: globalFilter={globalFilter} // Now managed by lazyParams.filters
                        emptyMessage="No employees found."
                        header={header}
                        responsiveLayout="scroll"
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: '4rem' }}></Column>
                        <Column field="id" header="ID" sortable body={idBodyTemplate} headerStyle={{ minWidth: '8rem' }}></Column>
                        <Column field="firstName" header="First Name" sortable filter filterPlaceholder="Search by first name" body={firstNameBodyTemplate} headerStyle={{ minWidth: '12rem' }}></Column>
                        <Column field="lastName" header="Last Name" sortable filter filterPlaceholder="Search by last name" body={lastNameBodyTemplate} headerStyle={{ minWidth: '12rem' }}></Column>
                        <Column field="email" header="Email" sortable filter filterPlaceholder="Search by email" body={emailBodyTemplate} headerStyle={{ minWidth: '20rem' }}></Column>
                        <Column field="position" header="Position" sortable filter filterPlaceholder="Search by position" body={positionBodyTemplate} headerStyle={{ minWidth: '12rem' }}></Column>
                        <Column field="salary" header="Salary" body={salaryBodyTemplate} sortable filter filterPlaceholder="Search by salary"></Column>
                        <Column field="createdDate" header="Created Date" body={createdDateBodyTemplate} sortable></Column>
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    <Dialog visible={employeeDialog} style={{ width: '450px' }} header="Employee Details" modal className="p-fluid" footer={employeeDialogFooter} onHide={hideDialog}>
                        <div className="field">
                            <label htmlFor="firstName">First Name</label>
                            <InputText
                                id="firstName"
                                value={employee.firstName}
                                onChange={(e) => onInputChange(e, 'firstName')}
                                required
                                autoFocus
                                className={classNames({ 'p-invalid': submitted && !employee.firstName })}
                            />
                            {submitted && !employee.firstName && <small className="p-invalid">First Name is required.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="lastName">Last Name</label>
                            <InputText
                                id="lastName"
                                value={employee.lastName}
                                onChange={(e) => onInputChange(e, 'lastName')}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="email">Email</label>
                            <InputText
                                id="email"
                                type="email"
                                value={employee.email}
                                onChange={(e) => onInputChange(e, 'email')}
                                required
                                className={classNames({ 'p-invalid': submitted && !employee.email })}
                            />
                            {submitted && !employee.email && <small className="p-invalid">Email is required.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="position">Position</label>
                            <InputText
                                id="position"
                                value={employee.position}
                                onChange={(e) => onInputChange(e, 'position')}
                                required
                                className={classNames({ 'p-invalid': submitted && !employee.position })}
                            />
                            {submitted && !employee.position && <small className="p-invalid">Position is required.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="salary">Salary</label>
                            <InputNumber
                                id="salary"
                                value={employee.salary}
                                onValueChange={(e) => onInputNumberChange(e, 'salary')}
                                mode="currency"
                                currency="USD"
                                locale="en-US"
                                required
                                className={classNames({ 'p-invalid': submitted && !employee.salary })}
                            />
                            {submitted && !employee.salary && <small className="p-invalid">Salary is required.</small>}
                        </div>
                    </Dialog>

                    <Dialog visible={deleteEmployeeDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteEmployeeDialogFooter} onHide={hideDeleteEmployeeDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {employee && (
                                <span>
                                    Are you sure you want to delete <b>{employee.firstName} {employee.lastName}</b>?
                                </span>
                            )}
                        </div>
                    </Dialog>

                    <Dialog visible={deleteEmployeesDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteEmployeesDialogFooter} onHide={hideDeleteEmployeesDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {<span>Are you sure you want to delete the selected employees?</span>}
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default Crud;




// // main/pages/crud/page.tsx
// /* eslint-disable @next/next/no-img-element */
// 'use client';

// import { Button } from 'primereact/button';
// import { Column } from 'primereact/column';
// import { DataTable } from 'primereact/datatable';
// import { Dialog } from 'primereact/dialog';
// import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber'; // Keep if salary is InputNumber
// import { InputText } from 'primereact/inputtext';
// import { InputTextarea } from 'primereact/inputtextarea'; // Keep if description-like field for employee
// import { Toast } from 'primereact/toast';
// import { Toolbar } from 'primereact/toolbar';
// import { classNames } from 'primereact/utils';
// import React, { useEffect, useRef, useState } from 'react';
// import { Demo } from '@/types';
// // ✅ NEW: Import your EmployeeService
// import { EmployeeService } from '../../../../demo/service/EmployeeService';
// //import { EmployeeService } from '../../../../src/demo/service/EmployeeService'; // Adjust path as needed

// const Crud = () => {
//     // ✅ emptyEmployee definition (matching Demo.Employee)
//     let emptyEmployee: Demo.Employee = {
//         id: '', // Spring Boot Long ID will come as string in JSON usually
//         firstName: '',
//         lastName: '',
//         email: '',
//         position: '',
//         salary: 0,
//         // createdDate and modifiedDate are often set by backend, not frontend
//     };

//     // ✅ State variables updated for Employees
//     const [employees, setEmployees] = useState<Demo.Employee[] | null>(null);
//     const [employeeDialog, setEmployeeDialog] = useState(false);
//     const [deleteEmployeeDialog, setDeleteEmployeeDialog] = useState(false);
//     const [deleteEmployeesDialog, setDeleteEmployeesDialog] = useState(false);
//     const [employee, setEmployee] = useState<Demo.Employee>(emptyEmployee);
//     const [selectedEmployees, setSelectedEmployees] = useState<Demo.Employee[] | null>(null);
//     const [submitted, setSubmitted] = useState(false);
//     const [globalFilter, setGlobalFilter] = useState('');
//     const toast = useRef<Toast>(null);
//     const dt = useRef<DataTable<any>>(null);

//     // ✅ Fetch Employees instead of Products
//     const fetchEmployees = async () => {
//         try {
//             const data = await EmployeeService.getEmployees();
//             setEmployees(data);
//         } catch (error) {
//             console.error('Error fetching employees:', error);
//             toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load employees.', life: 3000 });
//         }
//     };

//     useEffect(() => {
//         fetchEmployees();
//     }, []);

//     const formatCurrency = (value: number) => {
//         return value.toLocaleString('en-US', {
//             style: 'currency',
//             currency: 'USD'
//         });
//     };

//     const openNew = () => {
//         setEmployee(emptyEmployee); // product -> employee
//         setSubmitted(false);
//         setEmployeeDialog(true); // productDialog -> employeeDialog
//     };

//     const hideDialog = () => {
//         setSubmitted(false);
//         setEmployeeDialog(false); // productDialog -> employeeDialog
//     };

//     const hideDeleteEmployeeDialog = () => { // hideDeleteProductDialog -> hideDeleteEmployeeDialog
//         setDeleteEmployeeDialog(false); // setDeleteProductDialog -> setDeleteEmployeeDialog
//     };

//     const hideDeleteEmployeesDialog = () => { // hideDeleteProductsDialog -> hideDeleteEmployeesDialog
//         setDeleteEmployeesDialog(false); // setDeleteProductsDialog -> setDeleteEmployeesDialog
//     };

//     // ✅ saveEmployee
//     const saveEmployee = async () => {
//         setSubmitted(true);

//         // ✅ Validation based on employee fields
//         if (employee.firstName.trim() && employee.email.trim() && employee.position.trim()) {
//             try {
//                 if (employee.id) {
//                     await EmployeeService.updateEmployee(employee);
//                     toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Employee Updated', life: 3000 });
//                 } else {
//                     await EmployeeService.createEmployee(employee);
//                     toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Employee Created', life: 3000 });
//                 }
//                 setEmployeeDialog(false); // productDialog -> employeeDialog
//                 setEmployee(emptyEmployee); // product -> employee
//                 await fetchEmployees(); // Refresh list
//             } catch (error) {
//                 console.error('Error saving employee:', error);
//                 toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save employee.', life: 3000 });
//             }
//         }
//     };

//     const editEmployee = (employee: Demo.Employee) => { // editProduct -> editEmployee
//         setEmployee({ ...employee }); // setProduct -> setEmployee
//         setEmployeeDialog(true); // setProductDialog -> setEmployeeDialog
//     };

//     const confirmDeleteEmployee = (employee: Demo.Employee) => { // confirmDeleteProduct -> confirmDeleteEmployee
//         setEmployee(employee); // setProduct -> setEmployee
//         setDeleteEmployeeDialog(true); // setDeleteProductDialog -> setDeleteEmployeeDialog
//     };

//     const deleteEmployee = async () => { // deleteProduct -> deleteEmployee
//         if (!employee.id) return;
//         try {
//             await EmployeeService.deleteEmployee(employee.id);
//             setDeleteEmployeeDialog(false); // setDeleteProductDialog -> setDeleteEmployeeDialog
//             setEmployee(emptyEmployee); // setProduct -> setEmployee
//             toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Employee Deleted', life: 3000 });
//             await fetchEmployees(); // Refresh list
//         } catch (error) {
//             console.error('Error deleting employee:', error);
//             toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete employee.', life: 3000 });
//         }
//     };

//     // Not strictly needed if backend handles ID generation
//     // const findIndexById = (id: string) => { /* ... */ };
//     // const createId = () => { /* ... */ };

//     const exportCSV = () => {
//         dt.current?.exportCSV();
//     };

//     const confirmDeleteSelected = () => {
//         setDeleteEmployeesDialog(true); // setDeleteProductsDialog -> setDeleteEmployeesDialog
//     };

//     // const deleteSelectedEmployees = async () => { // deleteSelectedPrdoducts -> deleteSelectedEmployees
//     //     if (selectedEmployees && selectedEmployees.length > 0) {
//     //         try {
//     //             const idsToDelete = selectedEmployees.map(e => e.id as string); // selectedProducts -> selectedEmployees, p -> e
//     //             setDeleteEmployeesDialog(false); // setDeleteProductsDialog -> setDeleteEmployeesDialog
//     //             setSelectedEmployees(null); // setSelectedProducts -> setSelectedEmployees
//     //             toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Employees Deleted', life: 3000 }); // Products -> Employees
//     //             await fetchEmployees(); // Refresh list
//     //         } catch (error) {
//     //             console.error('Error deleting selected employees:', error);
//     //             toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete selected employees.', life: 3000 });
//     //         }
//     //     }
//     // };

//     // ✅ onInputChange for Employee fields
// const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, name: keyof Demo.Employee) => {
//     const val = (e.target && e.target.value) || '';
//     let _employee = { ...employee };
//     // Type assertion to tell TypeScript that 'name' is a valid key and 'val' is the correct type for that key
//     (_employee as any)[name] = val;
//     setEmployee(_employee);
// };

// // ✅ onInputNumberChange for Salary field (if applicable)
// const onInputNumberChange = (e: InputNumberValueChangeEvent, name: keyof Demo.Employee) => {
//     const val = e.value || 0;
//     let _employee = { ...employee };
//     // Type assertion for number values
//     (_employee as any)[name] = val;
//     setEmployee(_employee);
// };

//     const leftToolbarTemplate = () => {
//         return (
//             <React.Fragment>
//                 <div className="my-2">
//                     <Button label="New" icon="pi pi-plus" severity="success" className=" mr-2" onClick={openNew} />
//                     <Button label="Delete" icon="pi pi-trash" severity="danger" onClick={confirmDeleteSelected} disabled={!selectedEmployees || !(selectedEmployees as any).length} />
//                 </div>
//             </React.Fragment>
//         );
//     };

//     const rightToolbarTemplate = () => {
//         return (
//             <React.Fragment>
//                 <Button label="Export" icon="pi pi-upload" severity="help" onClick={exportCSV} />
//             </React.Fragment>
//         );
//     };

//     // ✅ Column Body Templates for Employee fields
//     const idBodyTemplate = (rowData: Demo.Employee) => {
//         return (
//             <>
//                 <span className="p-column-title">ID</span>
//                 {rowData.id}
//             </>
//         );
//     };

//     const firstNameBodyTemplate = (rowData: Demo.Employee) => {
//         return (
//             <>
//                 <span className="p-column-title">First Name</span>
//                 {rowData.firstName}
//             </>
//         );
//     };

//     const lastNameBodyTemplate = (rowData: Demo.Employee) => {
//         return (
//             <>
//                 <span className="p-column-title">Last Name</span>
//                 {rowData.lastName}
//             </>
//         );
//     };

//     const emailBodyTemplate = (rowData: Demo.Employee) => {
//         return (
//             <>
//                 <span className="p-column-title">Email</span>
//                 {rowData.email}
//             </>
//         );
//     };

//     const positionBodyTemplate = (rowData: Demo.Employee) => {
//         return (
//             <>
//                 <span className="p-column-title">Position</span>
//                 {rowData.position}
//             </>
//         );
//     };

//     const salaryBodyTemplate = (rowData: Demo.Employee) => {
//         return (
//             <>
//                 <span className="p-column-title">Salary</span>
//                 {formatCurrency(rowData.salary as number)}
//             </>
//         );
//     };

//     const createdDateBodyTemplate = (rowData: Demo.Employee) => {
//         return (
//             <>
//                 <span className="p-column-title">Created Date</span>
//                 {rowData.createdDate ? new Date(rowData.createdDate).toLocaleDateString() : ''} {/* Format date */}
//             </>
//         );
//     };

//     const modifiedDateBodyTemplate = (rowData: Demo.Employee) => {
//         return (
//             <>
//                 <span className="p-column-title">Modified Date</span>
//                 {rowData.modifiedDate ? new Date(rowData.modifiedDate).toLocaleDateString() : ''} {/* Format date */}
//             </>
//         );
//     };


//     const actionBodyTemplate = (rowData: Demo.Employee) => { // rowData: Demo.Product -> Demo.Employee
//         return (
//             <>
//                 <Button icon="pi pi-pencil" rounded severity="success" className="mr-2" onClick={() => editEmployee(rowData)} />
//                 <Button icon="pi pi-trash" rounded severity="warning" onClick={() => confirmDeleteEmployee(rowData)} />
//             </>
//         );
//     };

//     const header = (
//         <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
//             <h5 className="m-0">Manage Employees</h5> {/* Products -> Employees */}
//             <span className="block mt-2 md:mt-0 p-input-icon-left">
//                 <i className="pi pi-search" />
//                 <InputText type="search" onInput={(e) => setGlobalFilter(e.currentTarget.value)} placeholder="Search..." />
//             </span>
//         </div>
//     );

//     const employeeDialogFooter = ( // productDialogFooter -> employeeDialogFooter
//         <>
//             <Button label="Cancel" icon="pi pi-times" text onClick={hideDialog} />
//             <Button label="Save" icon="pi pi-check" text onClick={saveEmployee} />
//         </>
//     );
//     const deleteEmployeeDialogFooter = ( // deleteProductDialogFooter -> deleteEmployeeDialogFooter
//         <>
//             <Button label="No" icon="pi pi-times" text onClick={hideDeleteEmployeeDialog} />
//             <Button label="Yes" icon="pi pi-check" text onClick={deleteEmployee} />
//         </>
//     );
//     // const deleteEmployeesDialogFooter = ( // deleteProductsDialogFooter -> deleteEmployeesDialogFooter
//     //     <>
//     //         <Button label="No" icon="pi pi-times" text onClick={hideDeleteEmployeesDialog} />
//     //         <Button label="Yes" icon="pi pi-check" text onClick={deleteSelectedEmployees} />
//     //     </>
//     // );

//     return (
//         <div className="grid crud-demo">
//             <div className="col-12">
//                 <div className="card">
//                     <Toast ref={toast} />
//                     <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

//                     <DataTable
//                         ref={dt}
//                         value={employees} // products -> employees
//                         selection={selectedEmployees} // selectedProducts -> selectedEmployees
//                         onSelectionChange={(e) => setSelectedEmployees(e.value as any)} // setSelectedProducts -> setSelectedEmployees
//                         dataKey="id"
//                         paginator
//                         rows={10}
//                         rowsPerPageOptions={[5, 10, 25]}
//                         className="datatable-responsive"
//                         paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
//                         currentPageReportTemplate="Showing {first} to {last} of {totalRecords} employees" // products -> employees
//                         globalFilter={globalFilter}
//                         emptyMessage="No employees found." // products -> employees
//                         header={header}
//                         responsiveLayout="scroll"
//                     >
//                         <Column selectionMode="multiple" headerStyle={{ width: '4rem' }}></Column>
//                         {/* ✅ Updated Columns for Employee Fields */}
//                         <Column field="id" header="ID" sortable body={idBodyTemplate} headerStyle={{ minWidth: '8rem' }}></Column>
//                         <Column field="firstName" header="First Name" sortable body={firstNameBodyTemplate} headerStyle={{ minWidth: '12rem' }}></Column>
//                         <Column field="lastName" header="Last Name" sortable body={lastNameBodyTemplate} headerStyle={{ minWidth: '12rem' }}></Column>
//                         <Column field="email" header="Email" sortable body={emailBodyTemplate} headerStyle={{ minWidth: '20rem' }}></Column>
//                         <Column field="position" header="Position" sortable body={positionBodyTemplate} headerStyle={{ minWidth: '12rem' }}></Column>
//                         <Column field="salary" header="Salary" body={salaryBodyTemplate} sortable></Column>
//                         <Column field="createdDate" header="Created Date" body={createdDateBodyTemplate} sortable></Column>
//                         <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
//                     </DataTable>

//                     {/* ✅ Dialog for Employee Details */}
//                     <Dialog visible={employeeDialog} style={{ width: '450px' }} header="Employee Details" modal className="p-fluid" footer={employeeDialogFooter} onHide={hideDialog}>
//                         {/* No image for employee by default, remove or adjust if you have employee photos */}
//                         {/* {employee.image && <img src={`/demo/images/employee/${employee.image}`} alt={employee.image} width="150" className="mt-0 mx-auto mb-5 block shadow-2" />} */}
//                         <div className="field">
//                             <label htmlFor="firstName">First Name</label>
//                             <InputText
//                                 id="firstName"
//                                 value={employee.firstName}
//                                 onChange={(e) => onInputChange(e, 'firstName')}
//                                 required
//                                 autoFocus
//                                 className={classNames({
//                                     'p-invalid': submitted && !employee.firstName
//                                 })}
//                             />
//                             {submitted && !employee.firstName && <small className="p-invalid">First Name is required.</small>}
//                         </div>
//                         <div className="field">
//                             <label htmlFor="lastName">Last Name</label>
//                             <InputText
//                                 id="lastName"
//                                 value={employee.lastName}
//                                 onChange={(e) => onInputChange(e, 'lastName')}
//                             />
//                         </div>
//                         <div className="field">
//                             <label htmlFor="email">Email</label>
//                             <InputText
//                                 id="email"
//                                 type="email" // Use type="email" for email input
//                                 value={employee.email}
//                                 onChange={(e) => onInputChange(e, 'email')}
//                                 required
//                                 className={classNames({
//                                     'p-invalid': submitted && !employee.email
//                                 })}
//                             />
//                             {submitted && !employee.email && <small className="p-invalid">Email is required.</small>}
//                         </div>
//                          <div className="field">
//                             <label htmlFor="position">Position</label>
//                             <InputText
//                                 id="position"
//                                 value={employee.position}
//                                 onChange={(e) => onInputChange(e, 'position')}
//                                 required
//                                 className={classNames({
//                                     'p-invalid': submitted && !employee.position
//                                 })}
//                             />
//                             {submitted && !employee.position && <small className="p-invalid">Position is required.</small>}
//                         </div>
//                         <div className="field">
//                             <label htmlFor="salary">Salary</label>
//                             <InputNumber
//                                 id="salary"
//                                 value={employee.salary}
//                                 onValueChange={(e) => onInputNumberChange(e, 'salary')}
//                                 mode="currency"
//                                 currency="USD"
//                                 locale="en-US"
//                                 required
//                                 className={classNames({
//                                     'p-invalid': submitted && !employee.salary
//                                 })}
//                             />
//                             {submitted && !employee.salary && <small className="p-invalid">Salary is required.</small>}
//                         </div>
//                         {/* You might not need InputTextarea, RadioButton, Rating for Employee directly unless you have corresponding fields */}
//                         {/* Remove or replace as per your employee model */}
//                     </Dialog>

//                     {/* ✅ Delete Employee Dialog */}
//                     <Dialog visible={deleteEmployeeDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteEmployeeDialogFooter} onHide={hideDeleteEmployeeDialog}>
//                         <div className="flex align-items-center justify-content-center">
//                             <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
//                             {employee && ( // product -> employee
//                                 <span>
//                                     Are you sure you want to delete <b>{employee.firstName} {employee.lastName}</b>? {/* Display employee name */}
//                                 </span>
//                             )}
//                         </div>
//                     </Dialog>

//                    {/* /* ✅ Delete Multiple Employees Dialog */}
//                     {/* <Dialog visible={deleteEmployeesDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteEmployeesDialogFooter} onHide={hideDeleteEmployeesDialog}> */}
//                         {/* <div className="flex align-items-center justify-content-center"> */}
//                             {/* <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} /> */}
//                             {/* {employee && <span>Are you sure you want to delete the selected employees?</span>} product -> employee */}
//                         {/* </div> */}
//                     {/* </Dialog> */ }

//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Crud;





// /* eslint-disable @next/next/no-img-element */
// 'use client';
// import { Button } from 'primereact/button';
// import { Column } from 'primereact/column';
// import { DataTable } from 'primereact/datatable';
// import { Dialog } from 'primereact/dialog';
// import { FileUpload } from 'primereact/fileupload';
// import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber';
// import { InputText } from 'primereact/inputtext';
// import { InputTextarea } from 'primereact/inputtextarea';
// import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
// import { Rating } from 'primereact/rating';
// import { Toast } from 'primereact/toast';
// import { Toolbar } from 'primereact/toolbar';
// import { classNames } from 'primereact/utils';
// import React, { useEffect, useRef, useState } from 'react';
// import { ProductService } from '../../../../demo/service/ProductService';
// import { Demo } from '@/types';

// /* @todo Used 'as any' for types here. Will fix in next version due to onSelectionChange event type issue. */
// const Crud = () => {
//     let emptyProduct: Demo.Product = {
//         id: '',
//         name: '',
//         image: '',
//         description: '',
//         category: '',
//         price: 0,
//         quantity: 0,
//         rating: 0,
//         inventoryStatus: 'INSTOCK'
//     };

//     const [products, setProducts] = useState(null);
//     const [productDialog, setProductDialog] = useState(false);
//     const [deleteProductDialog, setDeleteProductDialog] = useState(false);
//     const [deleteProductsDialog, setDeleteProductsDialog] = useState(false);
//     const [product, setProduct] = useState<Demo.Product>(emptyProduct);
//     const [selectedProducts, setSelectedProducts] = useState(null);
//     const [submitted, setSubmitted] = useState(false);
//     const [globalFilter, setGlobalFilter] = useState('');
//     const toast = useRef<Toast>(null);
//     const dt = useRef<DataTable<any>>(null);

//     useEffect(() => {
//         ProductService.getProducts().then((data) => setProducts(data as any));
//     }, []);

//     const formatCurrency = (value: number) => {
//         return value.toLocaleString('en-US', {
//             style: 'currency',
//             currency: 'USD'
//         });
//     };

//     const openNew = () => {
//         setProduct(emptyProduct);
//         setSubmitted(false);
//         setProductDialog(true);
//     };

//     const hideDialog = () => {
//         setSubmitted(false);
//         setProductDialog(false);
//     };

//     const hideDeleteProductDialog = () => {
//         setDeleteProductDialog(false);
//     };

//     const hideDeleteProductsDialog = () => {
//         setDeleteProductsDialog(false);
//     };

//     const saveProduct = () => {
//         setSubmitted(true);

//         if (product.name.trim()) {
//             let _products = [...(products as any)];
//             let _product = { ...product };
//             if (product.id) {
//                 const index = findIndexById(product.id);

//                 _products[index] = _product;
//                 toast.current?.show({
//                     severity: 'success',
//                     summary: 'Successful',
//                     detail: 'Product Updated',
//                     life: 3000
//                 });
//             } else {
//                 _product.id = createId();
//                 _product.image = 'product-placeholder.svg';
//                 _products.push(_product);
//                 toast.current?.show({
//                     severity: 'success',
//                     summary: 'Successful',
//                     detail: 'Product Created',
//                     life: 3000
//                 });
//             }

//             setProducts(_products as any);
//             setProductDialog(false);
//             setProduct(emptyProduct);
//         }
//     };

//     const editProduct = (product: Demo.Product) => {
//         setProduct({ ...product });
//         setProductDialog(true);
//     };

//     const confirmDeleteProduct = (product: Demo.Product) => {
//         setProduct(product);
//         setDeleteProductDialog(true);
//     };

//     const deleteProduct = () => {
//         let _products = (products as any)?.filter((val: any) => val.id !== product.id);
//         setProducts(_products);
//         setDeleteProductDialog(false);
//         setProduct(emptyProduct);
//         toast.current?.show({
//             severity: 'success',
//             summary: 'Successful',
//             detail: 'Product Deleted',
//             life: 3000
//         });
//     };

//     const findIndexById = (id: string) => {
//         let index = -1;
//         for (let i = 0; i < (products as any)?.length; i++) {
//             if ((products as any)[i].id === id) {
//                 index = i;
//                 break;
//             }
//         }

//         return index;
//     };

//     const createId = () => {
//         let id = '';
//         let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//         for (let i = 0; i < 5; i++) {
//             id += chars.charAt(Math.floor(Math.random() * chars.length));
//         }
//         return id;
//     };

//     const exportCSV = () => {
//         dt.current?.exportCSV();
//     };

//     const confirmDeleteSelected = () => {
//         setDeleteProductsDialog(true);
//     };

//     const deleteSelectedProducts = () => {
//         let _products = (products as any)?.filter((val: any) => !(selectedProducts as any)?.includes(val));
//         setProducts(_products);
//         setDeleteProductsDialog(false);
//         setSelectedProducts(null);
//         toast.current?.show({
//             severity: 'success',
//             summary: 'Successful',
//             detail: 'Products Deleted',
//             life: 3000
//         });
//     };

//     const onCategoryChange = (e: RadioButtonChangeEvent) => {
//         let _product = { ...product };
//         _product['category'] = e.value;
//         setProduct(_product);
//     };

//     const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, name: string) => {
//         const val = (e.target && e.target.value) || '';
//         let _product = { ...product };
//         _product[`${name}`] = val;

//         setProduct(_product);
//     };

//     const onInputNumberChange = (e: InputNumberValueChangeEvent, name: string) => {
//         const val = e.value || 0;
//         let _product = { ...product };
//         _product[`${name}`] = val;

//         setProduct(_product);
//     };

//     const leftToolbarTemplate = () => {
//         return (
//             <React.Fragment>
//                 <div className="my-2">
//                     <Button label="New" icon="pi pi-plus" severity="success" className=" mr-2" onClick={openNew} />
//                     <Button label="Delete" icon="pi pi-trash" severity="danger" onClick={confirmDeleteSelected} disabled={!selectedProducts || !(selectedProducts as any).length} />
//                 </div>
//             </React.Fragment>
//         );
//     };

//     const rightToolbarTemplate = () => {
//         return (
//             <React.Fragment>
//                 <FileUpload mode="basic" accept="image/*" maxFileSize={1000000} chooseLabel="Import" className="mr-2 inline-block" />
//                 <Button label="Export" icon="pi pi-upload" severity="help" onClick={exportCSV} />
//             </React.Fragment>
//         );
//     };

//     const codeBodyTemplate = (rowData: Demo.Product) => {
//         return (
//             <>
//                 <span className="p-column-title">Code</span>
//                 {rowData.code}
//             </>
//         );
//     };

//     const nameBodyTemplate = (rowData: Demo.Product) => {
//         return (
//             <>
//                 <span className="p-column-title">Name</span>
//                 {rowData.name}
//             </>
//         );
//     };

//     const imageBodyTemplate = (rowData: Demo.Product) => {
//         return (
//             <>
//                 <span className="p-column-title">Image</span>
//                 <img src={`/demo/images/product/${rowData.image}`} alt={rowData.image} className="shadow-2" width="100" />
//             </>
//         );
//     };

//     const priceBodyTemplate = (rowData: Demo.Product) => {
//         return (
//             <>
//                 <span className="p-column-title">Price</span>
//                 {formatCurrency(rowData.price as number)}
//             </>
//         );
//     };

//     const categoryBodyTemplate = (rowData: Demo.Product) => {
//         return (
//             <>
//                 <span className="p-column-title">Category</span>
//                 {rowData.category}
//             </>
//         );
//     };

//     const ratingBodyTemplate = (rowData: Demo.Product) => {
//         return (
//             <>
//                 <span className="p-column-title">Reviews</span>
//                 <Rating value={rowData.rating} readOnly cancel={false} />
//             </>
//         );
//     };

//     const statusBodyTemplate = (rowData: Demo.Product) => {
//         return (
//             <>
//                 <span className="p-column-title">Status</span>
//                 <span className={`product-badge status-${rowData.inventoryStatus?.toLowerCase()}`}>{rowData.inventoryStatus}</span>
//             </>
//         );
//     };

//     const actionBodyTemplate = (rowData: Demo.Product) => {
//         return (
//             <>
//                 <Button icon="pi pi-pencil" rounded severity="success" className="mr-2" onClick={() => editProduct(rowData)} />
//                 <Button icon="pi pi-trash" rounded severity="warning" onClick={() => confirmDeleteProduct(rowData)} />
//             </>
//         );
//     };

//     const header = (
//         <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
//             <h5 className="m-0">Manage Products</h5>
//             <span className="block mt-2 md:mt-0 p-input-icon-left">
//                 <i className="pi pi-search" />
//                 <InputText type="search" onInput={(e) => setGlobalFilter(e.currentTarget.value)} placeholder="Search..." />
//             </span>
//         </div>
//     );

//     const productDialogFooter = (
//         <>
//             <Button label="Cancel" icon="pi pi-times" text onClick={hideDialog} />
//             <Button label="Save" icon="pi pi-check" text onClick={saveProduct} />
//         </>
//     );
//     const deleteProductDialogFooter = (
//         <>
//             <Button label="No" icon="pi pi-times" text onClick={hideDeleteProductDialog} />
//             <Button label="Yes" icon="pi pi-check" text onClick={deleteProduct} />
//         </>
//     );
//     const deleteProductsDialogFooter = (
//         <>
//             <Button label="No" icon="pi pi-times" text onClick={hideDeleteProductsDialog} />
//             <Button label="Yes" icon="pi pi-check" text onClick={deleteSelectedProducts} />
//         </>
//     );

//     return (
//         <div className="grid crud-demo">
//             <div className="col-12">
//                 <div className="card">
//                     <Toast ref={toast} />
//                     <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

//                     <DataTable
//                         ref={dt}
//                         value={products}
//                         selection={selectedProducts}
//                         onSelectionChange={(e) => setSelectedProducts(e.value as any)}
//                         dataKey="id"
//                         paginator
//                         rows={10}
//                         rowsPerPageOptions={[5, 10, 25]}
//                         className="datatable-responsive"
//                         paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
//                         currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
//                         globalFilter={globalFilter}
//                         emptyMessage="No products found."
//                         header={header}
//                         responsiveLayout="scroll"
//                     >
//                         <Column selectionMode="multiple" headerStyle={{ width: '4rem' }}></Column>
//                         <Column field="code" header="Code" sortable body={codeBodyTemplate} headerStyle={{ minWidth: '15rem' }}></Column>
//                         <Column field="name" header="Name" sortable body={nameBodyTemplate} headerStyle={{ minWidth: '15rem' }}></Column>
//                         <Column header="Image" body={imageBodyTemplate}></Column>
//                         <Column field="price" header="Price" body={priceBodyTemplate} sortable></Column>
//                         <Column field="category" header="Category" sortable body={categoryBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
//                         <Column field="rating" header="Reviews" body={ratingBodyTemplate} sortable></Column>
//                         <Column field="inventoryStatus" header="Status" body={statusBodyTemplate} sortable headerStyle={{ minWidth: '10rem' }}></Column>
//                         <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
//                     </DataTable>

//                     <Dialog visible={productDialog} style={{ width: '450px' }} header="Product Details" modal className="p-fluid" footer={productDialogFooter} onHide={hideDialog}>
//                         {product.image && <img src={`/demo/images/product/${product.image}`} alt={product.image} width="150" className="mt-0 mx-auto mb-5 block shadow-2" />}
//                         <div className="field">
//                             <label htmlFor="name">Name</label>
//                             <InputText
//                                 id="name"
//                                 value={product.name}
//                                 onChange={(e) => onInputChange(e, 'name')}
//                                 required
//                                 autoFocus
//                                 className={classNames({
//                                     'p-invalid': submitted && !product.name
//                                 })}
//                             />
//                             {submitted && !product.name && <small className="p-invalid">Name is required.</small>}
//                         </div>
//                         <div className="field">
//                             <label htmlFor="description">Description</label>
//                             <InputTextarea id="description" value={product.description} onChange={(e) => onInputChange(e, 'description')} required rows={3} cols={20} />
//                         </div>

//                         <div className="field">
//                             <label className="mb-3">Category</label>
//                             <div className="formgrid grid">
//                                 <div className="field-radiobutton col-6">
//                                     <RadioButton inputId="category1" name="category" value="Accessories" onChange={onCategoryChange} checked={product.category === 'Accessories'} />
//                                     <label htmlFor="category1">Accessories</label>
//                                 </div>
//                                 <div className="field-radiobutton col-6">
//                                     <RadioButton inputId="category2" name="category" value="Clothing" onChange={onCategoryChange} checked={product.category === 'Clothing'} />
//                                     <label htmlFor="category2">Clothing</label>
//                                 </div>
//                                 <div className="field-radiobutton col-6">
//                                     <RadioButton inputId="category3" name="category" value="Electronics" onChange={onCategoryChange} checked={product.category === 'Electronics'} />
//                                     <label htmlFor="category3">Electronics</label>
//                                 </div>
//                                 <div className="field-radiobutton col-6">
//                                     <RadioButton inputId="category4" name="category" value="Fitness" onChange={onCategoryChange} checked={product.category === 'Fitness'} />
//                                     <label htmlFor="category4">Fitness</label>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="formgrid grid">
//                             <div className="field col">
//                                 <label htmlFor="price">Price</label>
//                                 <InputNumber id="price" value={product.price} onValueChange={(e) => onInputNumberChange(e, 'price')} mode="currency" currency="USD" locale="en-US" />
//                             </div>
//                             <div className="field col">
//                                 <label htmlFor="quantity">Quantity</label>
//                                 <InputNumber id="quantity" value={product.quantity} onValueChange={(e) => onInputNumberChange(e, 'quantity')} />
//                             </div>
//                         </div>
//                     </Dialog>

//                     <Dialog visible={deleteProductDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteProductDialogFooter} onHide={hideDeleteProductDialog}>
//                         <div className="flex align-items-center justify-content-center">
//                             <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
//                             {product && (
//                                 <span>
//                                     Are you sure you want to delete <b>{product.name}</b>?
//                                 </span>
//                             )}
//                         </div>
//                     </Dialog>

//                     <Dialog visible={deleteProductsDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteProductsDialogFooter} onHide={hideDeleteProductsDialog}>
//                         <div className="flex align-items-center justify-content-center">
//                             <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
//                             {product && <span>Are you sure you want to delete the selected products?</span>}
//                         </div>
//                     </Dialog>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Crud;
