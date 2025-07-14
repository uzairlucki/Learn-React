// src/demo/service/EmployeeService.ts
import { Demo } from '@/types'; // Import your Demo namespace
import axios from 'axios'; 

export const EmployeeService = {

    
    API_BASE_URL: 'http://localhost:8080/api/employees',

    // Method to get all employees
    async getEmployees(): Promise<Demo.Employee[]> {
        try {
            const response = await axios.get<Demo.Employee[]>(this.API_BASE_URL);
            return response.data;
        } catch (error) {
            console.error('Error fetching employees:', error);
            throw error; 
        }
    },

    // Method to get an employee by ID
    async getEmployeeById(id: string): Promise<Demo.Employee> {
        try {
            const response = await axios.get<Demo.Employee>(`${this.API_BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching employee with ID ${id}:`, error);
            throw error;
        }
    },

    // Method to create a new employee
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

    // Method to update an existing employee
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

    // Method to delete an employee by ID
    async deleteEmployee(id: string): Promise<void> {
        try {
            await axios.delete(`${this.API_BASE_URL}/${id}`);
        } catch (error) {
            console.error(`Error deleting employee with ID ${id}:`, error);
            throw error;
        }
    },

    // // Optional: Method for bulk deletion
    // async deleteEmployees(ids: string[]): Promise<void> {
    //     try {
    //         if (ids.length === 0) {
    //             throw new Error('No employee IDs provided for deletion.');
    //         }
    //         await axios.post(`${this.API_BASE_URL}/batch-delete`, { ids });
    //     } catch (error) {
    //         console.error('Error deleting multiple employees:', error);
    //         throw error;
    //     }
    // }
};