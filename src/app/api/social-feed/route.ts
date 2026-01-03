import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/connectDB';
import { SocialPost, User, Friend } from '@/db/models';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';

type AuthUserDoc = {
  _id: any;
  name?: string;
  image?: string;
};

/**
 * Resolve a better-auth user by id, handling both:
 * - `_id` stored as a string
 * - `_id` stored as an ObjectId
 * And handling both common collection names: `user` and `users`.
 */
async function findAuthUserByIdFlexible(userId: string): Promise<AuthUserDoc | null> {
  if (!mongoose.connection?.db) return null;

  const or: any[] = [{ _id: userId }];
  if (mongoose.Types.ObjectId.isValid(userId)) {
    or.push({ _id: new mongoose.Types.ObjectId(userId) });
  }

  // Prefer `user` (better-auth default), but also try `users` for older setups.
  for (const collectionName of ['user', 'users']) {
    try {
      const doc = (await mongoose.connection.db
        .collection(collectionName)
        .findOne({ $or: or })) as AuthUserDoc | null;

      if (doc) return doc;
    } catch {
      // Ignore missing collection / query errors and try next.
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await connectDB();

    const { auth } = await import('@/lib/auth');
    const session = await auth.api.getSession({ 
      headers: request.headers as any
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

      const userId = session.user.id;
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type');

      const query: any = {};
      
      if (type) {
        query.type = type;
      }

    const posts = await SocialPost.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

        const postsData = await Promise.all(
          posts.map(async (post) => {
            // Try to get author from better-auth session if it's the current user
              let authorData;
              
              if (post.userId === userId) {
              authorData = {
                id: userId,
                name: session.user.name,
                image: session.user.image
              };
                } else {
                  // Don't rely on Mongoose casting for `_id` here because better-auth may store `_id`
                  // as ObjectId while our social docs store `userId` as a string.
                  const author = await findAuthUserByIdFlexible(String(post.userId));
                  authorData = {
                    id: author?._id?.toString?.() ?? String(post.userId),
                    name: author?.name || 'Unknown User',
                    image: author?.image
                  };
                }

          
          return {
            id: post._id,
            postId: post.postId,
            author: authorData,
          type: post.type,
          content: post.content,
          imageUrl: post.imageUrl,
          metadata: post.metadata,
          likes: post.likes.length,
          isLiked: post.likes.includes(userId),
            comments: await Promise.all(
              post.comments.map(async (comment: any) => {
                // Use session data if comment is from current user
                let commentAuthorData;
                if (comment.userId === userId) {
                  commentAuthorData = {
                    userName: session.user.name || 'Unknown',
                    userImage: session.user.image
                  };
                  } else {
                    const commentAuthor = await findAuthUserByIdFlexible(String(comment.userId));
                    commentAuthorData = {
                      userName: commentAuthor?.name || 'Unknown',
                      userImage: commentAuthor?.image
                    };
                  }

                
                return {
                  userId: comment.userId,
                  ...commentAuthorData,
                  text: comment.text,
                  createdAt: comment.createdAt
                };
              })
            ),
          createdAt: post.createdAt
        };
      })
    );

    return NextResponse.json(postsData);
  } catch (error) {
    console.error('Error fetching social feed:', error);
    return NextResponse.json({ error: 'Failed to fetch social feed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await connectDB();

    const { auth } = await import('@/lib/auth');
    const session = await auth.api.getSession({ 
      headers: request.headers as any
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { type, content, imageUrl, metadata } = body;

    if (!type || !content) {
      return NextResponse.json({ error: 'Type and content are required' }, { status: 400 });
    }

    const postId = randomUUID();

    const newPost = new SocialPost({
      postId,
      userId,
      type,
      content,
      imageUrl,
      metadata,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString()
    });

      await newPost.save();

      // Use session user data directly instead of User collection lookup
      const author = {
        id: userId,
        name: session.user.name,
        image: session.user.image
      };

      return NextResponse.json({
        message: 'Post created successfully',
        post: {
          id: newPost._id,
          postId: newPost.postId,
          author,
        type: newPost.type,
        content: newPost.content,
        imageUrl: newPost.imageUrl,
        metadata: newPost.metadata,
        likes: 0,
        isLiked: false,
        comments: [],
        createdAt: newPost.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await connectDB();

    const { auth } = await import('@/lib/auth');
    const session = await auth.api.getSession({ 
      headers: request.headers as any
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { postId, action, comment } = body;

    if (!postId || !action) {
      return NextResponse.json({ error: 'Post ID and action are required' }, { status: 400 });
    }

    const post = await SocialPost.findOne({ postId });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (action === 'like') {
      if (post.likes.includes(userId)) {
        post.likes = post.likes.filter((id: string) => id !== userId);
      } else {
        post.likes.push(userId);
      }
      await post.save();
      return NextResponse.json({ 
        message: 'Post liked',
        likes: post.likes.length,
        isLiked: post.likes.includes(userId)
      });
    } else if (action === 'comment') {
      if (!comment) {
        return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
      }

      post.comments.push({
        userId,
        text: comment,
        createdAt: new Date().toISOString()
      });

        await post.save();

        // Use session user data directly
        return NextResponse.json({
          message: 'Comment added',
          comment: {
            userId,
            userName: session.user.name || 'Unknown',
            userImage: session.user.image,
          text: comment,
          createdAt: post.comments[post.comments.length - 1].createdAt
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await connectDB();

    const { auth } = await import('@/lib/auth');
    const session = await auth.api.getSession({ 
      headers: request.headers as any
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const post = await SocialPost.findOne({ postId });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await SocialPost.deleteOne({ postId });

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
