import { gql, type TypedDocumentNode } from "@apollo/client";
import type { UserRole } from "@/lib/auth/api/graphql";

export type SearchParams = {
    search?: string;
    sort_by?: string;
    sort_order?: "asc" | "desc";
    page?: number;
    limit?: number;
};

export type Paginated<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
};

export type Option = { id: string; name: string };

export type UserListItem = {
    id: string;
    created_at: string;
    email: string;
    role: UserRole;
    is_verified: boolean;
    profile: { first_name: string | null; last_name: string | null; avatar: string | null };
    department: Option | null;
    position: Option | null;
};

const USER_LIST_FIELDS = gql`
  fragment UserListFields on User {
    id
    created_at
    email
    role
    is_verified
    profile {
      first_name
      last_name
      avatar
    }
    department {
      id
      name
    }
    position {
      id
      name
    }
  }
`;

export const USERS_QUERY: TypedDocumentNode<
    { users: Paginated<UserListItem> },
    { params: SearchParams }
> = gql`
  query Users($params: SearchPaginationInput) {
    users(params: $params) {
      items {
        ...UserListFields
      }
      total
      page
      limit
      total_pages
    }
  }
  ${USER_LIST_FIELDS}
`;

export const DEPARTMENTS_QUERY: TypedDocumentNode<{ departments: Paginated<Option> }> = gql`
  query Departments {
    departments(params: { limit: 100, sort_by: "name" }) {
      items {
        id
        name
      }
    }
  }
`;

export const POSITIONS_QUERY: TypedDocumentNode<{ positions: Paginated<Option> }> = gql`
  query Positions {
    positions(params: { limit: 100, sort_by: "name" }) {
      items {
        id
        name
      }
    }
  }
`;

export type CreateUserVariables = {
    user: {
        auth: { email: string; password: string };
        profile: { first_name: string; last_name: string };
        departmentId: string;
        positionId: string;
        role: UserRole;
    };
};

export const CREATE_USER_MUTATION: TypedDocumentNode<{ createUser: { id: string } }, CreateUserVariables> = gql`
  mutation CreateUser($user: CreateUserInput!) {
    createUser(user: $user) {
      id
    }
  }
`;

export type UpdateUserVariables = {
    user: { userId: string; departmentId: string; positionId: string; role: UserRole };
};

export const UPDATE_USER_MUTATION: TypedDocumentNode<{ updateUser: { id: string } }, UpdateUserVariables> = gql`
  mutation UpdateUser($user: UpdateUserInput!) {
    updateUser(user: $user) {
      id
    }
  }
`;

export type UpdateProfileVariables = {
    profile: { userId: string; first_name: string; last_name: string };
};

export const UPDATE_PROFILE_MUTATION: TypedDocumentNode<{ updateProfile: { id: string } }, UpdateProfileVariables> = gql`
  mutation UpdateProfile($profile: UpdateProfileInput!) {
    updateProfile(profile: $profile) {
      id
    }
  }
`;

export const DELETE_USER_MUTATION: TypedDocumentNode<{ deleteUser: { affected: number } }, { userId: string }> = gql`
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId) {
      affected
    }
  }
`;