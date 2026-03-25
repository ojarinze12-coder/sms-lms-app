import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-server';
import { z } from 'zod';

const createForumSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['GENERAL', 'Q_A', 'ANNOUNCEMENTS']).default('GENERAL'),
  courseId: z.string().uuid(),
});

const createPostSchema = z.object({
  content: z.string().min(1),
  forumId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const forumId = searchParams.get('forumId');

    if (forumId) {
      const posts = await prisma.discussionPost.findMany({
        where: { forumId },
        include: {
          parent: { select: { id: true, content: true } },
        },
        orderBy: { createdAt: 'asc' },
      });
      return NextResponse.json(posts || []);
    }

    const where: any = {};
    if (courseId) where.courseId = courseId;

    const forums = await prisma.discussionForum.findMany({
      where,
      include: {
        course: { select: { id: true, name: true } },
        _count: { select: { posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(forums || []);
  } catch (error) {
    console.error('Forums GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (body.forumId) {
      const data = createPostSchema.parse(body);
      
      const post = await prisma.discussionPost.create({
        data: {
          content: data.content,
          forumId: data.forumId,
          parentId: data.parentId,
          userId: authUser.userId,
        },
      });

      return NextResponse.json(post, { status: 201 });
    }

    const data = createForumSchema.parse(body);

    const forum = await prisma.discussionForum.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        courseId: data.courseId,
        createdById: authUser.userId,
      },
    });

    return NextResponse.json(forum, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Forum POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId, action } = body;

    if (!postId || !action) {
      return NextResponse.json({ error: 'Post ID and action required' }, { status: 400 });
    }

    const post = await prisma.discussionPost.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (action === 'upvote') {
      await prisma.discussionPost.update({
        where: { id: postId },
        data: { upvotes: { increment: 1 } },
      });
    } else if (action === 'downvote') {
      await prisma.discussionPost.update({
        where: { id: postId },
        data: { downvotes: { increment: 1 } },
      });
    } else if (action === 'markAnswer') {
      await prisma.discussionPost.update({
        where: { id: postId },
        data: { isAnswer: true },
      });
    } else if (action === 'pin') {
      await prisma.discussionPost.update({
        where: { id: postId },
        data: { isPinned: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Post PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
