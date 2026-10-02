import { gql, type TypedDocumentNode } from "@apollo/client";

export type UserRole = "Employee" | "Admin"

export type AuthResult = {
  access_token: string,
  refresh_token: string,
  user: { id: string; email: string; role: UserRole },
}

export type SignupVariables = {
  auth: { email: string; password: string; confirmPassword: string },
}
export type SignupData = { signup: AuthResult }

export const SIGNUP_MUTATION: TypedDocumentNode<SignupData, SignupVariables> = gql`
  mutation SignupUser($auth: SignupInput!) {
    signup(auth: $auth) {
      access_token
      refresh_token
      user {
        id
        email
        role
      }
    }
  }
`;

export type LoginVariables = {
  auth: { email: string, password: string }
}
export type LoginData = { login: AuthResult }

export const LOGIN_MUTATION: TypedDocumentNode<LoginData, LoginVariables> = gql`
  mutation LoginUser($auth: AuthInput!) {
    login(auth: $auth) {
      access_token
      refresh_token
      user {
        id
        email
        role
      }
    }
  }
`;