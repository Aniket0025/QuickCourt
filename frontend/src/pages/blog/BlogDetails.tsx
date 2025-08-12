import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { staticBlogs } from "./data";

export default function BlogDetails() {
  const { slug = "" } = useParams();
  const blog = staticBlogs.find((b) => b.slug === slug);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>{blog ? `${blog.title} • QuickCourt` : 'Blog Not Found • QuickCourt'}</title>
        </Helmet>

        <div className="mb-8">
          <Link 
            to="/blogs" 
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
          >
            ← Back to Blogs
          </Link>
        </div>

        {!blog && (
          <div className="text-center py-16">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg max-w-md mx-auto">
              <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Blog Post Not Found</h1>
              <p className="text-gray-600 dark:text-gray-300">The blog post you're looking for doesn't exist.</p>
            </div>
          </div>
        )}

        {blog && (
          <article className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="p-8 pb-6">
                <div className="flex items-center gap-3 mb-6 text-sm">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide">
                    {blog.type}
                  </span>
                  {blog.sport && (
                    <span className="text-gray-500 dark:text-gray-400 capitalize font-medium">
                      {blog.sport}
                    </span>
                  )}
                  {blog.readMinutes && (
                    <span className="text-gray-500 dark:text-gray-400">
                      • {blog.readMinutes} min read
                    </span>
                  )}
                  {blog.publishedAt && (
                    <span className="text-gray-500 dark:text-gray-400">
                      • {new Date(blog.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
                  {blog.title}
                </h1>
                
                {blog.excerpt && (
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 italic leading-relaxed">
                    {blog.excerpt}
                  </p>
                )}
              </div>

              {/* Cover Image */}
              {blog.coverUrl && (
                <div className="px-8 mb-8">
                  <img 
                    src={blog.coverUrl} 
                    alt={blog.title} 
                    className="w-full h-64 md:h-80 object-cover rounded-lg shadow-md" 
                  />
                </div>
              )}
              
              {/* Content */}
              <div className="px-8 pb-8">
                {blog.content ? (
                  <div 
                    className="prose prose-lg prose-gray dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: blog.content }} 
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No content available for this blog post.</p>
                  </div>
                )}
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
