import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowRight, CalendarDays, Newspaper, Sparkles } from "lucide-react";
import logo from "@/assets/logo.svg";
import { formatDate } from "@/components/admin/ui";
import type { Doc } from "@/convex/_generated/dataModel";

type PostRow = Doc<"posts">;

function BlogNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-cream/5 bg-base/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Pulse Athletics" width={32} height={32} className="rounded-lg" />
          <span className="text-[15px] font-semibold tracking-tight">
            Pulse <span className="text-brass">Athletics</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-cream-dim md:flex">
          <Link to="/#programs" className="transition-colors hover:text-cream">Programs</Link>
          <Link to="/#reels" className="transition-colors hover:text-cream">Reels</Link>
          <Link to="/#membership" className="transition-colors hover:text-cream">Membership</Link>
          <Link to="/blogs" className="text-brass transition-colors hover:text-ember">Blog</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/auth?returnTo=/dashboard"
            className="hidden rounded-lg border border-cream/10 px-3.5 py-2 text-sm font-medium text-cream/80 transition-colors hover:border-cream/30 hover:text-cream sm:block"
          >
            Member sign in
          </Link>
          <Link
            to="/auth?returnTo=/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ember px-3.5 py-2 text-sm font-semibold text-base transition-colors hover:bg-ember/90"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}

function BlogCard({ post }: { post: PostRow }) {
  return (
    <Link
      to={`/blogs/${post._id}`}
      className="group overflow-hidden rounded-2xl border border-cream/10 bg-surface transition-colors hover:border-brass/40"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-elevated to-base">
        {post.image ? (
          <img src={post.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl opacity-40">🏋️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base/60 to-transparent" />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 text-[11px] text-cream-dim">
          <CalendarDays className="size-3.5" />
          {post.publishedAt ? formatDate(post.publishedAt) : "Just published"}
          <span className="rounded-full border border-cream/10 px-2 py-0.5 uppercase tracking-wide">Article</span>
        </div>
        <h3 className="mt-2.5 text-base font-semibold leading-6 text-cream transition-colors group-hover:text-ember">
          {post.title}
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-cream-dim">{post.excerpt}</p>}
        <p className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brass">
          Read article <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </Link>
  );
}

function BlogDetail({ posts, post }: { posts: PostRow[]; post: PostRow }) {
  const more = posts.filter((p) => p._id !== post._id).slice(0, 3);
  const paragraphs = (post.body ?? "").split(/\n+/).filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link to="/blogs" className="inline-flex items-center gap-1.5 text-sm text-cream-dim transition-colors hover:text-brass">
        <ArrowLeft className="size-4" /> All articles
      </Link>

      <div className="mt-8">
        <div className="flex items-center gap-2 text-xs text-cream-dim">
          <CalendarDays className="size-4" />
          {post.publishedAt ? formatDate(post.publishedAt) : "Just published"}
          <span className="rounded-full border border-brass/25 bg-brass/10 px-2.5 py-0.5 text-[11px] font-medium text-brass">
            Pulse Athletics Journal
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-lg leading-8 text-cream-dim">{post.excerpt}</p>}
      </div>

      {post.image && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-cream/10">
          <img src={post.image} alt="" className="aspect-[16/9] w-full object-cover" />
        </div>
      )}

      <div className="mt-8 space-y-5">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => (
            <p key={i} className="text-[15px] leading-7 text-cream/80">
              {p}
            </p>
          ))
        ) : (
          <p className="text-[15px] leading-7 text-cream-dim">
            This article is still being written — check back soon for the full story. Meanwhile, ask the front desk or any
            trainer and they'll walk you through it in person.
          </p>
        )}
      </div>

      {more.length > 0 && (
        <div className="mt-14 border-t border-cream/5 pt-10">
          <h2 className="text-lg font-semibold tracking-tight">Keep reading</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {more.map((p) => (
              <Link
                key={p._id}
                to={`/blogs/${p._id}`}
                className="group overflow-hidden rounded-xl border border-cream/10 bg-surface transition-colors hover:border-brass/40"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-elevated to-base">
                  {p.image ? (
                    <img src={p.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl opacity-40">💪</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm font-medium leading-5 text-cream transition-colors group-hover:text-ember">{p.title}</p>
                  <p className="mt-1.5 text-[11px] text-cream-dim">{p.publishedAt ? formatDate(p.publishedAt) : ""}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Blogs() {
  const data = useQuery(api.content.getPublic);
  const { id } = useParams();
  const posts = (data?.posts ?? []).filter((p) => p.type === "blog");
  const post = id ? posts.find((p) => p._id === id) : undefined;

  return (
    <div className="min-h-screen bg-base text-cream antialiased">
      <BlogNav />

      {post ? (
        <BlogDetail posts={posts} post={post} />
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-brass/25 bg-brass/10 px-3.5 py-1.5 text-xs font-medium text-brass">
              <Newspaper className="size-3.5" /> The Pulse Athletics Journal
            </p>
            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Training intel, <span className="bg-gradient-to-r from-brass to-ember bg-clip-text text-transparent">coach advice</span> & gym news
            </h1>
            <p className="mt-4 text-base leading-7 text-cream-dim">
              Articles written by our coaches and the front desk — programming tips, nutrition notes, member stories and
              everything happening at the club.
            </p>
          </div>

          <div className="mt-12">
            {!data ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-cream/10 bg-surface">
                    <div className="aspect-[16/9] bg-elevated" />
                    <div className="space-y-3 p-5">
                      <div className="h-3 w-24 rounded bg-elevated" />
                      <div className="h-4 w-4/5 rounded bg-elevated" />
                      <div className="h-3 w-full rounded bg-elevated" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-cream/10 py-20 text-center">
                <Sparkles className="mx-auto size-8 text-brass/50" />
                <p className="mt-4 text-sm text-cream-dim">No articles published yet — the coaches are busy writing.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <BlogCard key={p._id} post={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="mt-10 border-t border-cream/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Pulse Athletics" width={24} height={24} className="rounded-md" />
            <span className="text-sm text-cream-dim">
              Pulse <span className="text-cream">Athletics</span> · 42 Stadium Road, Indiranagar, Bengaluru
            </span>
          </div>
          <Link to="/" className="text-xs text-cream-dim transition-colors hover:text-cream/80">
            Back to homepage
          </Link>
        </div>
      </footer>
    </div>
  );
}