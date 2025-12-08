import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Trash2, Loader2, Heart, MessageCircle, Share2, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ConvertibleImage } from "@/components/ConvertibleImage";
import { ConvertibleAvatar } from "@/components/ConvertibleAvatar";

interface Post {
  id: string;
  user_id: string;
  description: string | null;
  image_url: string | null;
  location: string | null;
  mentions: string[] | null;
  tag_ids: string[] | null;
  tags_name: string[] | null;
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

interface PostWithProfile extends Post {
  profile?: Profile;
  total_likes?: number;
  total_comments?: number;
  total_shares?: number;
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
  const { toast } = useToast();

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // Get total count
      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true });

      setTotalCount(count || 0);

      // Fetch posts with pagination
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (postsError) throw postsError;

      if (postsData && postsData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(postsData.map(p => p.user_id))];
        
        // Fetch profiles for these users
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);

        const profilesMap: Record<string, Profile> = {};
        profilesData?.forEach(profile => {
          profilesMap[profile.user_id] = profile;
        });
        setProfiles(profilesMap);

        // Fetch engagement counts
        const postIds = postsData.map(p => p.id);
        
        const [likesRes, commentsRes, sharesRes] = await Promise.all([
          supabase.from("post_likes").select("post_id").in("post_id", postIds),
          supabase.from("post_comments").select("post_id").in("post_id", postIds),
          supabase.from("post_shares").select("post_id").in("post_id", postIds),
        ]);

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
          total_shares: sharesCount[post.id] || 0,
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
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  const handleDeletePost = async () => {
    if (!deletingPostId) return;

    setIsDeleting(true);
    try {
      // Delete related data first
      await Promise.all([
        supabase.from("post_likes").delete().eq("post_id", deletingPostId),
        supabase.from("post_comments").delete().eq("post_id", deletingPostId),
        supabase.from("post_shares").delete().eq("post_id", deletingPostId),
        supabase.from("post_favorites").delete().eq("post_id", deletingPostId),
      ]);

      // Delete the post
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", deletingPostId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletingPostId(null);
    }
  };

  const filteredPosts = posts.filter(post => {
    const searchLower = searchTerm.toLowerCase();
    return (
      post.description?.toLowerCase().includes(searchLower) ||
      post.profile?.full_name?.toLowerCase().includes(searchLower) ||
      post.profile?.username?.toLowerCase().includes(searchLower) ||
      post.location?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => setCurrentPage(1)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Posts</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Table>
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
                  {filteredPosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No posts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          {post.image_url ? (
                            <ConvertibleImage
                              src={post.image_url}
                              alt="Post"
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ConvertibleAvatar
                              src={post.profile?.profile_picture_url || ""}
                              alt={post.profile?.full_name || "User"}
                              fallback={post.profile?.full_name?.charAt(0) || "U"}
                              className="h-8 w-8"
                            />
                            <div>
                              <p className="font-medium text-sm break-words overflow-wrap-anywhere">
                                {post.profile?.full_name || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @{post.profile?.username || "unknown"}
                              </p>
                            </div>
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
                        <TableCell>
                          {format(new Date(post.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewingPost(post)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingPostId(post.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {renderPaginationItems()}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Post Dialog */}
      <Dialog open={!!viewingPost} onOpenChange={() => setViewingPost(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {viewingPost && (
            <div className="space-y-6">
              {/* User Information */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Posted By</h4>
                <div className="flex items-start gap-4">
                  <ConvertibleAvatar
                    src={viewingPost.profile?.profile_picture_url || ""}
                    alt={viewingPost.profile?.full_name || "User"}
                    fallback={viewingPost.profile?.full_name?.charAt(0) || "U"}
                    className="h-16 w-16"
                  />
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

              {/* Post Image */}
              {viewingPost.image_url && (
                <div>
                  <h4 className="font-semibold mb-2">Post Image</h4>
                  <ConvertibleImage
                    src={viewingPost.image_url}
                    alt="Post"
                    className="w-full max-h-96 object-contain rounded-lg border"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm whitespace-pre-wrap">
                  {viewingPost.description || "No description"}
                </p>
              </div>

              {/* Location */}
              {viewingPost.location && (
                <div>
                  <h4 className="font-semibold mb-2">Location</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {viewingPost.location}
                  </div>
                </div>
              )}

              {/* Tags */}
              {viewingPost.tags_name && viewingPost.tags_name.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingPost.tags_name.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mentions */}
              {viewingPost.mentions && viewingPost.mentions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Mentions</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingPost.mentions.map((mention, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                      >
                        @{mention}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
            </div>
          )}
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
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Posts;
