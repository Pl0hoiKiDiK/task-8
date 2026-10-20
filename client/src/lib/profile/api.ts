import { gql, type TypedDocumentNode } from "@apollo/client";
import type { UserRole } from "@/lib/auth/api/graphql";

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

type CatalogData = { departments: { items: CatalogItem[]; total_pages: number }; positions: { items: CatalogItem[]; total_pages: number } };
export const PROFILE_CATALOGS_QUERY: TypedDocumentNode<CatalogData, { page: number }> = gql`
  query ProfileCatalogs($page: Int!) {
    departments(params: { page: $page, limit: 100 }) { items { id name } total_pages }
    positions(params: { page: $page, limit: 100 }) { items { id name } total_pages }
  }
`;

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

export const SEND_PROFILE_VERIFICATION_MUTATION: TypedDocumentNode<
  { sendVerification: null }, { email: string }
> = gql`
  mutation SendProfileVerification($email: String!) {
    sendVerification(email: $email)
  }
`;
