import { useState } from "react";
import { Users, Heart, MessageSquare, Share2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Post {
  id: string;
  author: string;
  avatar: string;
  location: string;
  content: string;
  likes: number;
  image: string;
}

export function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      author: "Zayn Malik",
      avatar: "👨‍🎤",
      location: "Attabad Lake, Hunza",
      content: "Cruising on the crystal turquoise water with the Karakorams towering above. WanderSync planned the perfect day itinerary!",
      likes: 42,
      image: "photo-1542051841857-5f90071e7989",
    },
  ]);

  const [newContent, setNewContent] = useState("");

  const handleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent) return;
    setPosts([
      {
        id: Date.now().toString(),
        author: "You",
        avatar: "👤",
        location: "Current Trip",
        content: newContent,
        likes: 0,
        image: "photo-1506744038136-46273834b3fb",
      },
      ...posts,
    ]);
    setNewContent("");
  };

  return (
    <div className="space-y-6 rounded-3xl border border-brand-500/30 bg-ink-900/90 p-6 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-ink-700 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-100">
            <Users className="size-5 text-brand-400" /> WanderSync Travel Community & Stories
          </h3>
          <p className="text-xs text-slate-400">Share travel stories, photos, and destination recommendations with global explorers.</p>
        </div>
      </div>

      {/* Post Creator */}
      <form onSubmit={handlePost} className="space-y-3 rounded-2xl border border-ink-700 bg-ink-950 p-4">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Share your travel story or photo caption..."
          className="w-full h-16 rounded-xl border border-ink-700 bg-ink-900 p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none resize-none"
        />
        <div className="flex justify-end">
          <Button size="sm" type="submit" className="rounded-xl">
            <Plus className="size-4 mr-1" /> Post Story
          </Button>
        </div>
      </form>

      {/* Feed Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="rounded-2xl border border-brand-500/20 bg-ink-950 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-500/20 text-xl">{post.avatar}</span>
              <div>
                <p className="text-xs font-bold text-slate-100">{post.author}</p>
                <p className="text-[10px] text-brand-300">📍 {post.location}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{post.content}</p>

            <div className="aspect-video rounded-xl overflow-hidden border border-ink-700">
              <img src={`https://images.unsplash.com/${post.image}?auto=format&fit=crop&w=800&q=80`} alt="" className="h-full w-full object-cover" />
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 pt-1">
              <button onClick={() => handleLike(post.id)} className="flex items-center gap-1 hover:text-red-400">
                <Heart className="size-4 text-red-400" /> {post.likes} Likes
              </button>
              <button className="flex items-center gap-1 hover:text-brand-300">
                <MessageSquare className="size-4" /> Comments
              </button>
              <button className="flex items-center gap-1 hover:text-brand-300">
                <Share2 className="size-4" /> Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
