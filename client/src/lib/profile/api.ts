import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client";
import type { UserRole } from "@/lib/auth/api/graphql";
import { DEPARTMENTS_QUERY, loadAllCatalogItems, POSITIONS_QUERY } from "@/lib/catalog-api";

export type CatalogItem = { id: string; name: string };
export type ProfileUser = {
  id: string;
  email: string;
  created_at: string;
  is_verified: boolean;
  role: UserRole;
  profile: { first_name: string | null; last_name: string | null; avatar: string | null };
  department: CatalogItem | null;
  position: CatalogItem | null;
};

export const PROFILE_USER_QUERY: TypedDocumentNode<{ user: ProfileUser }, { userId: string }> = gql`
  query ProfileUser($userId: ID!) {
    user(userId: $userId) {
      id email created_at is_verified role
      profile { first_name last_name avatar }
      department { id name }
      position { id name }
    }
  }
`;

export async function loadCatalogs(client: ApolloClient) {
  const [departments, positions] = await Promise.all([
    loadAllCatalogItems(client, DEPARTMENTS_QUERY, "departments"),
    loadAllCatalogItems(client, POSITIONS_QUERY, "positions"),
  ]);
  return { departments, positions };
}

export const UPDATE_PROFILE_MUTATION: TypedDocumentNode<
  { updateProfile: { id: string } },
  { profile: { userId: string; first_name: string; last_name: string } }
> = gql`
  mutation UpdateMyProfile($profile: UpdateProfileInput!) {
    updateProfile(profile: $profile) { id }
  }
`;

export const UPDATE_PROFILE_USER_MUTATION: TypedDocumentNode<
  { updateUser: { id: string } },
  { user: { userId: string; departmentId: string; positionId: string; role: UserRole } }
> = gql`
  mutation UpdateProfileUser($user: UpdateUserInput!) {
    updateUser(user: $user) { id }
  }
`;

export const UPLOAD_PROFILE_AVATAR_MUTATION: TypedDocumentNode<
  { uploadAvatar: string },
  { avatar: { userId: string; base64: string; size: number; type: string } }
> = gql`
  mutation UploadProfileAvatar($avatar: UploadAvatarInput!) {
    uploadAvatar(avatar: $avatar)
  }
`;

