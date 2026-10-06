import { CombinedGraphQLErrors, type ApolloClient } from "@apollo/client";
import { refreshTokenStorage } from "@/lib/auth/model/auth-slice";
import { decodeJwt } from "@/lib/auth/model/jwt";
import { UPDATE_TOKEN_MUTATION, USER_QUERY } from "@/lib/auth/api/graphql";

export async function restoreSession(client: ApolloClient) {
    const refreshToken = refreshTokenStorage.get();
    if (!refreshToken) return null;

    try {
        const { data } = await client.mutate({
            mutation: UPDATE_TOKEN_MUTATION,
            context: { headers: { authorization: `Bearer ${refreshToken}` } },
        });
        if (!data) return null;

        const { access_token, refresh_token } = data.updateToken;
        refreshTokenStorage.set(refresh_token);

        const claims = decodeJwt(access_token);
        if (!claims) return null;

        const { data: userData } = await client.query({
            query: USER_QUERY,
            variables: { userId: claims.sub },
            fetchPolicy: "network-only",
            context: { headers: { authorization: `Bearer ${access_token}` } },
        });
        if (!userData) return null;

        return { user: userData.user, accessToken: access_token };
    } catch (error) {
        if (CombinedGraphQLErrors.is(error)) refreshTokenStorage.clear();
        return null;
    }
}