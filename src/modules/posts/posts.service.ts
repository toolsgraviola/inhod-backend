import { ApprovalStatus, PostStatus, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { HttpError } from "../../utils/http-error.js";
import { assertActiveCommunityMember } from "../communities/communities.service.js";

type MediaType = "image" | "video";

export type CreateCommunityPostInput = {
  text?: string | null;
  mediaType?: MediaType | null;
  mediaUrl?: string | null;
  mediaItems?: Array<{
    mediaType: MediaType;
    mediaUrl: string;
  }> | null;
  linkUrl?: string | null;
};

export type CreateCommunityPostCommentInput = {
  text: string;
};

const postInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      mobileNumber: true,
      profilePhotoUrl: true
    }
  },
  media: {
    select: {
      id: true,
      mediaType: true,
      url: true,
      sortOrder: true
    },
    orderBy: {
      sortOrder: "asc"
    }
  },
  _count: {
    select: {
      comments: true,
      likes: true
    }
  }
} satisfies Prisma.PostInclude;

type PostWithRelations = Prisma.PostGetPayload<{
  include: typeof postInclude;
}>;

const commentInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      mobileNumber: true,
      profilePhotoUrl: true
    }
  }
} satisfies Prisma.CommentInclude;

type CommentWithRelations = Prisma.CommentGetPayload<{
  include: typeof commentInclude;
}>;

const serializePost = (post: PostWithRelations) => ({
  id: post.id,
  communityId: post.communityId,
  userId: post.userId,
  text: post.text,
  linkUrl: post.linkUrl,
  linkTitle: post.linkTitle,
  linkDescription: post.linkDescription,
  linkImageUrl: post.linkImageUrl,
  linkSiteName: post.linkSiteName,
  status: post.status,
  approvalStatus: post.approvalStatus,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  user: post.user,
  media: post.media,
  _count: post._count
});

const serializeComment = (comment: CommentWithRelations) => ({
  id: comment.id,
  postId: comment.postId,
  userId: comment.userId,
  text: comment.text,
  status: comment.status,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  user: comment.user
});

const decodeHtml = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const extractMeta = (html: string, keys: string[]) => {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const propertyFirst = new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    );
    const contentFirst = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
      "i"
    );
    const match = html.match(propertyFirst) ?? html.match(contentFirst);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return null;
};

const extractTitle = (html: string) => {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1].trim()) : null;
};

const fetchLinkMetadata = async (linkUrl?: string | null) => {
  if (!linkUrl) {
    return {
      linkUrl: null,
      linkTitle: null,
      linkDescription: null,
      linkImageUrl: null,
      linkSiteName: null
    };
  }

  try {
    const response = await fetch(linkUrl, {
      headers: {
        "user-agent": "INHODBot/0.1 (+https://inhod.com)"
      },
      signal: AbortSignal.timeout(5000)
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.includes("text/html")) {
      return {
        linkUrl,
        linkTitle: null,
        linkDescription: null,
        linkImageUrl: null,
        linkSiteName: null
      };
    }

    const html = (await response.text()).slice(0, 200_000);
    return {
      linkUrl,
      linkTitle: extractMeta(html, ["og:title", "twitter:title"]) ?? extractTitle(html),
      linkDescription: extractMeta(html, [
        "og:description",
        "twitter:description",
        "description"
      ]),
      linkImageUrl: extractMeta(html, ["og:image", "twitter:image"]),
      linkSiteName: extractMeta(html, ["og:site_name", "application-name"])
    };
  } catch {
    return {
      linkUrl,
      linkTitle: null,
      linkDescription: null,
      linkImageUrl: null,
      linkSiteName: null
    };
  }
};

export const listCommunityPosts = async (communityId: number, userId: number) => {
  await assertActiveCommunityMember(communityId, userId);

  const posts = await prisma.post.findMany({
    where: {
      communityId,
      status: PostStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED
    },
    include: postInclude,
    orderBy: {
      createdAt: "desc"
    }
  });

  return posts.map(serializePost);
};

export const createCommunityPost = async (
  communityId: number,
  userId: number,
  input: CreateCommunityPostInput
) => {
  await assertActiveCommunityMember(communityId, userId);
  const text = input.text?.trim() || null;
  const metadata = await fetchLinkMetadata(input.linkUrl?.trim() || null);
  const mediaItems =
    input.mediaItems?.length
      ? input.mediaItems
      : input.mediaType && input.mediaUrl
        ? [{ mediaType: input.mediaType, mediaUrl: input.mediaUrl }]
        : [];

  const post = await prisma.post.create({
    data: {
      communityId,
      userId,
      scope: "community",
      text,
      ...metadata,
      status: PostStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      media: mediaItems.length
        ? {
            create: mediaItems.map((item, index) => ({
              mediaType: item.mediaType,
              storageKey: item.mediaUrl.trim(),
              url: item.mediaUrl.trim(),
              sortOrder: index
            }))
          }
        : undefined
    },
    include: postInclude
  });

  return serializePost(post);
};

const assertCommunityPost = async (communityId: number, postId: number) => {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      communityId,
      status: PostStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED
    },
    select: {
      id: true
    }
  });

  if (!post) {
    throw new HttpError(404, "Post not found.", "POST_NOT_FOUND");
  }
};

export const listCommunityPostComments = async (
  communityId: number,
  postId: number,
  userId: number
) => {
  await assertActiveCommunityMember(communityId, userId);
  await assertCommunityPost(communityId, postId);

  const comments = await prisma.comment.findMany({
    where: {
      postId,
      status: "published"
    },
    include: commentInclude,
    orderBy: {
      createdAt: "asc"
    }
  });

  return comments.map(serializeComment);
};

export const createCommunityPostComment = async (
  communityId: number,
  postId: number,
  userId: number,
  input: CreateCommunityPostCommentInput
) => {
  await assertActiveCommunityMember(communityId, userId);
  await assertCommunityPost(communityId, postId);

  const comment = await prisma.comment.create({
    data: {
      postId,
      userId,
      text: input.text.trim(),
      status: "published"
    },
    include: commentInclude
  });

  return serializeComment(comment);
};
