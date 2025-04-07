import axios, { type AxiosResponse } from 'axios';
import createApiUrl from 'lib/create-api-url';
import { CommentThread } from 'types/comment-thread';
import { Comment } from 'types/comment';
import { type Diff } from 'types/diff';

export const create = async (
  data: Record<string, unknown>,
): Promise<AxiosResponse> => {
  return await axios.post(createApiUrl(`/diffs`), data);
};

export const get = async (
  slug: string,
  cookie?: string,
): Promise<AxiosResponse> => {
  const config = cookie ? { headers: { Cookie: cookie } } : undefined;
  return await axios.get(createApiUrl(`/diffs/${slug}`), config);
};

export const del = async ({
  slug,
  secretKey,
}: {
  slug: string;
  secretKey?: string;
}): Promise<AxiosResponse> => {
  const secretKeyBody = secretKey ? { data: { secretKey } } : undefined;
  return await axios.delete(createApiUrl(`/diffs/${slug}`), secretKeyBody);
};

export const patchSharing = async ({
  slug,
  isPrivate,
  collaborators,
  permission,
}: Pick<
  Diff,
  'slug' | 'isPrivate' | 'collaborators' | 'permission'
>): Promise<AxiosResponse> => {
  return await axios.patch(createApiUrl(`/diffs/${slug}/sharing`), {
    collaborators,
    isPrivate,
    permission,
  });
};

export const getCommentThreads = async ({
  slug,
}: {
  slug: string;
}): Promise<AxiosResponse<CommentThread[]>> => {
  return await axios.get(createApiUrl(`/diffs/${slug}/comment-threads/`));
};

export const loadCommentsForThread = async ({
  slug,
  side,
  lineNumber,
}: {
  slug: string;
  lineNumber: number;
  side: 'left' | 'right';
}): Promise<AxiosResponse<Comment[]>> => {
  return await axios.get(
    createApiUrl(`/diffs/${slug}/comments/${side}/${lineNumber}`),
  );
};

export const createComment = async ({
  slug,
  side,
  lineNumber,
  contents,
}: {
  slug: string;
  lineNumber: number;
  side: 'left' | 'right';
  contents: string;
}): Promise<AxiosResponse<Comment>> => {
  return await axios.post(
    createApiUrl(`/diffs/${slug}/comments/${side}/${lineNumber}`),
    { lineNumber, side, contents },
  );
};

export const deleteComment = async ({
  slug,
  commentUuid,
}: {
  slug: string;
  commentUuid: string;
}): Promise<AxiosResponse<Comment>> => {
  return await axios.delete(
    createApiUrl(`/diffs/${slug}/comments/${commentUuid}`),
  );
};
