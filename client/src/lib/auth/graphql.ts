import { gql, type TypedDocumentNode } from "@apollo/client";

export type SignupVariables = {
    auth: { email: string; password: string; confirmPassword: string };
};

export type SignupData = {
    signup: {
        access_token: string;
        refresh_token: string;
        user: { id: string; email: string };
    };
};

export const SIGNUP_MUTATION: TypedDocumentNode<SignupData, SignupVariables> = gql`
  mutation SignupUser($auth: SignupInput!) {
    signup(auth: $auth) {
      access_token
      refresh_token
      user {
        id
        email
      }
    }
  }
`;