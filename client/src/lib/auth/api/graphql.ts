import { gql, type TypedDocumentNode } from "@apollo/client";
import { AuthUser } from "../model/auth-slice";

export type UserRole = "Employee" | "Admin"

export type AuthResult = {
  access_token: string,
  refresh_token: string,
  user: { id: string; email: string; role: UserRole; is_verified: boolean },
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
        is_verified
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
        is_verified
      }
    }
  }
`;

export const VERIFY_EMAIL_MUTATION: TypedDocumentNode<{ verifyMail: null }, { mail: { otp: string } }> = gql`
  mutation VerifyMail($mail: VerifyMailInput!) {
    verifyMail(mail: $mail)
  }
`;

export const UPDATE_TOKEN_MUTATION: TypedDocumentNode<{ updateToken: { access_token: string; refresh_token: string } }> = gql`
  mutation UpdateToken {
    updateToken {
      access_token
      refresh_token
    }
  }
`;

export const USER_QUERY: TypedDocumentNode<{ user: AuthUser }, { userId: string }> = gql`
  query User($userId: ID!) {
    user(userId: $userId) {
      id
      email
      role
      is_verified
    }
  }
`;