import { gql, type TypedDocumentNode } from "@apollo/client";

export type Employee = {
  id: string;
  created_at: string;
  email: string;
  role: "Admin" | "Employee";
  is_verified: boolean;
  profile: { first_name: string | null; last_name: string | null; avatar: string | null };
  department: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
};

export type EmployeeListParams = {
  search?: string;
  sort_by?: "first_name" | "last_name" | "department" | "position" | "created_at";
  sort_order?: "ASC" | "DESC";
  page: number;
  limit: number;
};

const employeeFields = gql`
  fragment EmployeeFields on User {
    id
    created_at
    email
    role
    is_verified
    profile { first_name last_name avatar }
    department { id name }
    position { id name }
  }
`;

export const EMPLOYEES_QUERY: TypedDocumentNode<
  { users: { items: Employee[]; total: number; page: number; total_pages: number } },
  { params: EmployeeListParams }
> = gql`
  ${employeeFields}
  query Employees($params: SearchPaginationInput) {
    users(params: $params) {
      items { ...EmployeeFields }
      total
      page
      total_pages
    }
  }
`;

export const EMPLOYEE_QUERY: TypedDocumentNode<{ user: Employee }, { userId: string }> = gql`
  ${employeeFields}
  query Employee($userId: ID!) {
    user(userId: $userId) { ...EmployeeFields }
  }
`;

export type EmployeeFormValues = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  departmentId: string;
  positionId: string;
  role: "Admin" | "Employee";
};

export const CREATE_EMPLOYEE_MUTATION: TypedDocumentNode<
  { createUser: { id: string } },
  { user: { auth: { email: string; password: string }; profile: { first_name: string; last_name: string }; departmentId: string; positionId: string; role: EmployeeFormValues["role"] } }
> = gql`
  mutation CreateEmployee($user: CreateUserInput!) {
    createUser(user: $user) { id }
  }
`;

export const DELETE_EMPLOYEE_MUTATION: TypedDocumentNode<
  { deleteUser: { affected: number } }, { userId: string }
> = gql`
  mutation DeleteEmployee($userId: ID!) {
    deleteUser(userId: $userId) { affected }
  }
`;
