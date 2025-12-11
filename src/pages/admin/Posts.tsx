import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Trash2, Loader2, Heart, MessageCircle, Share2, MapPin, Play } from "lucide-react";
import { format } from "date-fns";
import { ConvertibleImage } from "@/components/ConvertibleImage";
import { ConvertibleAvatar } from "@/components/ConvertibleAvatar";
interface Post {
  id: string;
  user_id: string;
  description: string | null;
  image_url: string[] | null;
  location: string | null;
  mentions: string[] | null;
  tag_ids: string[] | null;
  tags_name: string[] | null;
  tag_people_ids: string[] | null;
  tag_people_name: string[] | null;
  created_at: string;
  updated_at: string;
}
interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  phone_number: string;
  country_code: string;
  profile_picture_url: string | null;
  username: string;
}
interface PostLike {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
  profile?: Profile;
}
interface PostComment {
  id: string;
  user_id: string;
  post_id: string;
  comment_text: string;
  created_at: string;
  profile?: Profile;
}
interface PostWithProfile extends Post {
  profile?: Profile;
  total_likes?: number;
  total_comments?: number;
  total_shares?: number;
  likes?: PostLike[];
  comments?: PostComment[];
}
const ITEMS_PER_PAGE = 10;
const Posts = () => {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewingPost, setViewingPost] = useState<PostWithProfile | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const {
    toast
  } = useToast();
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // Get total count
      const {
        count
      } = await supabase.from("posts").select("*", {
        count: "exact",
        head: true
      });
      setTotalCount(count || 0);

      // Fetch posts with pagination
      const {
        data: postsData,
        error: postsError
      } = await supabase.from("posts").select("*").order("created_at", {
        ascending: false
      }).range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);
      if (postsError) throw postsError;
      if (postsData && postsData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(postsData.map(p => p.user_id))];

        // Fetch profiles for these users
        const {
          data: profilesData
        } = await supabase.from("profiles").select("*").in("user_id", userIds);
        const profilesMap: Record<string, Profile> = {};
        profilesData?.forEach(profile => {
          profilesMap[profile.user_id] = profile;
        });
        setProfiles(profilesMap);

        // Fetch engagement counts
        const postIds = postsData.map(p => p.id);
        const [likesRes, commentsRes, sharesRes] = await Promise.all([supabase.from("post_likes").select("post_id").in("post_id", postIds), supabase.from("post_comments").select("post_id").in("post_id", postIds), supabase.from("post_shares").select("post_id").in("post_id", postIds)]);
        const likesCount: Record<string, number> = {};
        const commentsCount: Record<string, number> = {};
        const sharesCount: Record<string, number> = {};
        likesRes.data?.forEach(like => {
          likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
        });
        commentsRes.data?.forEach(comment => {
          commentsCount[comment.post_id] = (commentsCount[comment.post_id] || 0) + 1;
        });
        sharesRes.data?.forEach(share => {
          sharesCount[share.post_id] = (sharesCount[share.post_id] || 0) + 1;
        });
        const enrichedPosts = postsData.map(post => ({
          ...post,
          profile: profilesMap[post.user_id],
          total_likes: likesCount[post.id] || 0,
          total_comments: commentsCount[post.id] || 0,
          total_shares: sharesCount[post.id] || 0
        }));
        setPosts(enrichedPosts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch posts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const fetchPostDetails = async (post: PostWithProfile) => {
    setIsLoadingDetails(true);
    try {
      // Fetch likes with user profiles
      const {
        data: likesData
      } = await supabase.from("post_likes").select("*").eq("post_id", post.id).order("created_at", {
        ascending: false
      });

      // Fetch comments with user profiles
      const {
        data: commentsData
      } = await supabase.from("post_comments").select("*").eq("post_id", post.id).order("created_at", {
        ascending: false
      });

      // Get unique user IDs from likes and comments
      const likeUserIds = likesData?.map(l => l.user_id) || [];
      const commentUserIds = commentsData?.map(c => c.user_id) || [];
      const allUserIds = [...new Set([...likeUserIds, ...commentUserIds])];
      let userProfiles: Record<string, Profile> = {};
      if (allUserIds.length > 0) {
        const {
          data: profilesData
        } = await supabase.from("profiles").select("*").in("id", allUserIds);
        profilesData?.forEach(profile => {
          userProfiles[profile.id] = profile;
        });
      }

      // Enrich likes and comments with profiles
      const enrichedLikes = likesData?.map(like => ({
        ...like,
        profile: userProfiles[like.user_id]
      })) || [];
      const enrichedComments = commentsData?.map(comment => ({
        ...comment,
        profile: userProfiles[comment.user_id]
      })) || [];
      setViewingPost({
        ...post,
        likes: enrichedLikes,
        comments: enrichedComments
      });
    } catch (error) {
      console.error("Error fetching post details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch post details",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };
  useEffect(() => {
    fetchPosts();
  }, [currentPage]);
  const handleViewPost = (post: PostWithProfile) => {
    setViewingPost(post);
    fetchPostDetails(post);
  };
  const handleDeletePost = async () => {
    if (!deletingPostId) return;
    setIsDeleting(true);
    try {
      // Delete related data first
      await Promise.all([supabase.from("post_likes").delete().eq("post_id", deletingPostId), supabase.from("post_comments").delete().eq("post_id", deletingPostId), supabase.from("post_shares").delete().eq("post_id", deletingPostId), supabase.from("post_favorites").delete().eq("post_id", deletingPostId)]);

      // Delete the post
      const {
        error
      } = await supabase.from("posts").delete().eq("id", deletingPostId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Post deleted successfully"
      });
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeletingPostId(null);
    }
  };
  const filteredPosts = posts.filter(post => {
    const searchLower = searchTerm.toLowerCase();
    return post.description?.toLowerCase().includes(searchLower) || post.profile?.full_name?.toLowerCase().includes(searchLower) || post.profile?.username?.toLowerCase().includes(searchLower) || post.location?.toLowerCase().includes(searchLower);
  });
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1, 2);
      if (currentPage > 4) pages.push("...");
      for (let i = Math.max(3, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages - 1, totalPages);
    }
    return pages;
  };
  return <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Posts</h1>
        <p className="text-muted-foreground">Manage and review user posts</p>
      </div>

      <div className="mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search by description, user, or location..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        {isLoading ? <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div> : <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Posted By</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.length === 0 ? <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No posts found
                  </TableCell>
                </TableRow> : filteredPosts.map(post => <TableRow key={post.id}>
                    <TableCell>
                      {post.image_url && post.image_url.length > 0 ? (
                        (() => {
                          const firstUrl = post.image_url[0];
                          const isVideo = firstUrl.match(/\.(mp4|webm|mov|avi|mkv)$/i);
                          return isVideo ? (
                            <div className="relative w-12 h-12">
                              <video src={firstUrl} className="w-12 h-12 object-cover rounded" muted preload="metadata" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                                <Play className="h-4 w-4 text-white fill-white" />
                              </div>
                            </div>
                          ) : (
                            <ConvertibleImage src={firstUrl} alt="Post" className="w-12 h-12 object-cover rounded" />
                          );
                        })()
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[150px]">
                      <div className="break-words text-sm">
                        {post.profile?.full_name || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate text-sm">
                        {post.description || "No description"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {post.location || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {post.total_likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> {post.total_comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="h-3 w-3" /> {post.total_shares}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(post.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewPost(post)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingPostId(post.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
            </TableBody>
          </Table>}
      </div>

      {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
            Previous
          </Button>
          {renderPageNumbers().map((page, index) => page === "..." ? <span key={`ellipsis-${index}`} className="px-2">
                ...
              </span> : <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page as number)}>
                {page}
              </Button>)}
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>}

      {/* View Post Dialog */}
      <Dialog open={!!viewingPost} onOpenChange={() => setViewingPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
            <DialogDescription>
              View the complete post information
            </DialogDescription>
          </DialogHeader>
          {viewingPost && <div className="space-y-6">
              {/* User Information */}
              <div className="bg-muted/50 p-4 rounded-lg py-[5px] px-[5px]">
                <h4 className="font-semibold mb-3">Posted By</h4>
                <div className="flex items-start gap-4">
                  <ConvertibleAvatar src={viewingPost.profile?.profile_picture_url || ""} alt={viewingPost.profile?.full_name || "User"} fallback={viewingPost.profile?.full_name?.charAt(0) || "U"} className="h-16 w-16" />
                  <div className="space-y-1">
                    <p className="font-medium break-words overflow-wrap-anywhere">
                      {viewingPost.profile?.full_name || "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{viewingPost.profile?.username || "unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {viewingPost.profile?.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {viewingPost.profile?.country_code} {viewingPost.profile?.phone_number}
                    </p>
                  </div>
                </div>
              </div>

              {/* Post Media */}
              {viewingPost.image_url && viewingPost.image_url.length > 0 && <div>
                  <h4 className="font-semibold mb-2">Post Media ({viewingPost.image_url.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {viewingPost.image_url.map((url, index) => {
                const isVideo = url.match(/\.(mp4|webm|mov|avi|mkv)$/i);
                return isVideo ? <video key={index} src={url} controls className="w-full h-40 object-cover rounded-lg border" /> : <ConvertibleImage key={index} src={url} alt={`Post media ${index + 1}`} className="w-full h-40 object-cover rounded-lg border" />;
              })}
                  </div>
                </div>}

              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm whitespace-pre-wrap">
                  {viewingPost.description || "No description"}
                </p>
              </div>

              {/* Location */}
              {viewingPost.location && <div>
                  <h4 className="font-semibold mb-2">Location</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {viewingPost.location}
                  </div>
                </div>}

              {/* Tags */}
              {viewingPost.tags_name && viewingPost.tags_name.length > 0 && <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingPost.tags_name.map((tag, index) => <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                        {tag}
                      </span>)}
                  </div>
                </div>}

              {/* Mentions */}
              {viewingPost.mentions && viewingPost.mentions.length > 0 && <div>
                  <h4 className="font-semibold mb-2">Mentions</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingPost.mentions.map((mention, index) => <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                        {mention.startsWith("#") ? mention : mention.replace(/^@/, "")}
                      </span>)}
                  </div>
                </div>}

              {/* Tagged People */}
              {viewingPost.tag_people_name && viewingPost.tag_people_name.length > 0 && <div>
                  <h4 className="font-semibold mb-2">Tagged People</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingPost.tag_people_name.map((name, index) => <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                        @{name}
                      </span>)}
                  </div>
                </div>}

              {/* Engagement Stats */}
              <div>
                <h4 className="font-semibold mb-2">Engagement</h4>
                <div className="flex items-center gap-6 text-sm">
                  <span className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    {viewingPost.total_likes} likes
                  </span>
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    {viewingPost.total_comments} comments
                  </span>
                  <span className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-green-500" />
                    {viewingPost.total_shares} shares
                  </span>
                </div>
              </div>

              {/* Likes Listing */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Liked By ({viewingPost.likes?.length || 0})
                </h4>
                {isLoadingDetails ? <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div> : viewingPost.likes && viewingPost.likes.length > 0 ? <div className={`bg-muted/30 rounded-lg p-3 ${viewingPost.likes.length > 5 ? 'max-h-64 overflow-y-auto' : ''}`}>
                    <div className="space-y-2">
                    {viewingPost.likes.map(like => <div key={like.id} className="flex items-center gap-3 p-2 bg-background rounded-lg">
                          <ConvertibleAvatar src={like.profile?.profile_picture_url || ""} alt={like.profile?.username || "User"} fallback={like.profile?.username?.charAt(0) || "U"} className="h-8 w-8" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {like.profile?.username || "Unknown User"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(like.created_at), "MMM dd, yyyy HH:mm")}
                            </p>
                          </div>
                        </div>)}
                    </div>
                  </div> : <p className="text-sm text-muted-foreground">No likes yet</p>}
              </div>

              {/* Comments Listing */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  Comments ({viewingPost.comments?.length || 0})
                </h4>
                {isLoadingDetails ? <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div> : viewingPost.comments && viewingPost.comments.length > 0 ? <div className={`bg-muted/30 rounded-lg p-3 ${viewingPost.comments.length > 5 ? 'max-h-72 overflow-y-auto' : ''}`}>
                    <div className="space-y-3">
                      {viewingPost.comments.map(comment => <div key={comment.id} className="p-3 bg-background rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <ConvertibleAvatar src={comment.profile?.profile_picture_url || ""} alt={comment.profile?.username || "User"} fallback={comment.profile?.username?.charAt(0) || "U"} className="h-8 w-8" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {comment.profile?.username || "Unknown User"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(comment.created_at), "MMM dd, yyyy HH:mm")}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm pl-11 whitespace-pre-wrap">
                            {comment.comment_text}
                          </p>
                        </div>)}
                    </div>
                  </div> : <p className="text-sm text-muted-foreground">No comments yet</p>}
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {format(new Date(viewingPost.created_at), "MMM dd, yyyy HH:mm")}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>{" "}
                  {format(new Date(viewingPost.updated_at), "MMM dd, yyyy HH:mm")}
                </div>
              </div>
            </div>}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPostId} onOpenChange={() => setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
              All likes, comments, shares, and favorites associated with this post will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default Posts;