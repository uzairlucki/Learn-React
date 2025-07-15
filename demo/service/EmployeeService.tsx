
// src/demo/service/EmployeeService.ts
import { Demo } from '@/types';
import axios from 'axios';

export const EmployeeService = {
    API_BASE_URL: 'http://localhost:8080/api/employees',

    // Method to get all employees (might still be useful for other purposes, but not for lazy DataTable)
    async getEmployees(): Promise<Demo.Employee[]> {
        try {
            const response = await axios.get<Demo.Employee[]>(this.API_BASE_URL);
            return response.data;
        } catch (error) {
            console.error('Error fetching employees:', error);
            throw error;
        }
    },

    /**
     * @description Fetches employees with pagination, sorting, and filtering.
     * @param first The starting index of the data (offset).
     * @param rows The number of rows to retrieve per page (limit).
     * @param sortField The field to sort by.
     * @param sortOrder The sort order (1 for ascending, -1 for descending).
     * @param filters An object containing filter criteria for columns.
     * @returns A Promise resolving to an object containing content (employees) and totalElements.
     */
    async getEmployeesLazy(
        first: number,
        rows: number,
        sortField: string | null,
        sortOrder: number | null,
        filters: { [key: string]: { value: any; matchMode: string } }
    ): Promise<{ content: Demo.Employee[]; totalElements: number }> {
        try {
            // Calculate the page number (0-indexed for Spring Data JPA)
            const page = first / rows;

            // Construct query parameters
            const params: any = {
                page: page,
                size: rows,
            };

            // Add sorting parameters if present
            if (sortField) {
                // Spring Boot expects sort in the format: "fieldName,asc" or "fieldName,desc"
                params.sort = `${sortField},${sortOrder === 1 ? 'asc' : 'desc'}`;
            }

           
            for (const field in filters) {
                if (filters[field].value !== null && filters[field].value !== undefined && filters[field].value !== '') {
                    if (field === 'global') {
                        // For a global search input
                        params.search = filters[field].value; 
                    } else {
                        // For individual column filters (e.g., firstname=value, email=value)
                        // PrimeReact filter object includes 'matchMode', you might send this too if your backend supports it
                        params[`${field}`] = filters[field].value;
                    }
                }
            }
            console.log("Sending API request with params:", params);

            const response = await axios.get<{ content: Demo.Employee[]; totalElements: number }>(this.API_BASE_URL, { params });
            return response.data; 
        } catch (error) {
            console.error('Error fetching employees (lazy):', error);
            throw error;
        }
    },

    async getEmployeeById(id: string): Promise<Demo.Employee> {
        try {
            const response = await axios.get<Demo.Employee>(`${this.API_BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching employee with ID ${id}:`, error);
            throw error;
        }
    },

    async createEmployee(employee: Demo.Employee): Promise<Demo.Employee> {
        try {
            const { id, ...employeeDataToSend } = employee;
            const response = await axios.post<Demo.Employee>(this.API_BASE_URL, employeeDataToSend);
            return response.data;
        } catch (error) {
            console.error('Error creating employee:', error);
            throw error;
        }
    },

    async updateEmployee(employee: Demo.Employee): Promise<Demo.Employee> {
        if (!employee.id) {
            throw new Error('Employee ID is required for update.');
        }
        try {
            const response = await axios.put<Demo.Employee>(`${this.API_BASE_URL}/${employee.id}`, employee);
            return response.data;
        } catch (error) {
            console.error(`Error updating employee with ID ${employee.id}:`, error);
            throw error;
        }
    },

    async deleteEmployee(id: string): Promise<void> {
        try {
            await axios.delete(`${this.API_BASE_URL}/${id}`);
        } catch (error) {
            console.error(`Error deleting employee with ID ${id}:`, error);
            throw error;
        }
    },

    
    async deleteMultipleEmployees(ids: string[]): Promise<void> {
        try {
            await axios.post(`${this.API_BASE_URL}/batch-delete`, { ids });
        } catch (error) {
            console.error('Error deleting multiple employees:', error);
            throw error;
        }
    },
};

// // src/demo/service/EmployeeService.ts
// import { Demo } from '@/types'; // Import your Demo namespace
// import axios from 'axios'; 

// export const EmployeeService = {

    
//     API_BASE_URL: 'http://localhost:8080/api/employees',

//     // Method to get all employees
//     async getEmployees(): Promise<Demo.Employee[]> {
//         try {
//             const response = await axios.get<Demo.Employee[]>(this.API_BASE_URL);
//             return response.data;
//         } catch (error) {
//             console.error('Error fetching employees:', error);
//             throw error; 
//         }
//     },

//     // Method to get an employee by ID
//     async getEmployeeById(id: string): Promise<Demo.Employee> {
//         try {
//             const response = await axios.get<Demo.Employee>(`${this.API_BASE_URL}/${id}`);
//             return response.data;
//         } catch (error) {
//             console.error(`Error fetching employee with ID ${id}:`, error);
//             throw error;
//         }
//     },

//     // Method to create a new employee
//     async createEmployee(employee: Demo.Employee): Promise<Demo.Employee> {
//         try {
            
//             const { id, ...employeeDataToSend } = employee;
//             const response = await axios.post<Demo.Employee>(this.API_BASE_URL, employeeDataToSend);
//             return response.data;
//         } catch (error) {
//             console.error('Error creating employee:', error);
//             throw error;
//         }
//     },

//     // Method to update an existing employee
//     async updateEmployee(employee: Demo.Employee): Promise<Demo.Employee> {
//         if (!employee.id) {
//             throw new Error('Employee ID is required for update.');
//         }
//         try {
//             const response = await axios.put<Demo.Employee>(`${this.API_BASE_URL}/${employee.id}`, employee);
//             return response.data;
//         } catch (error) {
//             console.error(`Error updating employee with ID ${employee.id}:`, error);
//             throw error;
//         }
//     },

//     // Method to delete an employee by ID
//     async deleteEmployee(id: string): Promise<void> {
//         try {
//             await axios.delete(`${this.API_BASE_URL}/${id}`);
//         } catch (error) {
//             console.error(`Error deleting employee with ID ${id}:`, error);
//             throw error;
//         }
//     },

//     // // Optional: Method for bulk deletion
//     // async deleteEmployees(ids: string[]): Promise<void> {
//     //     try {
//     //         if (ids.length === 0) {
//     //             throw new Error('No employee IDs provided for deletion.');
//     //         }
//     //         await axios.post(`${this.API_BASE_URL}/batch-delete`, { ids });
//     //     } catch (error) {
//     //         console.error('Error deleting multiple employees:', error);
//     //         throw error;
//     //     }
//     // }
// };