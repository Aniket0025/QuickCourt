import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { staticBlogs } from "./data";

export default function Blogs() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Sports Blog & Articles • QuickCourt</title>
        </Helmet>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Sports Stories, Events & Awards</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Curated sports content featuring the latest stories, events, and achievements from the world of athletics.
          </p>
        </div>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {staticBlogs.map((blog) => (
            <Link key={blog._id} to={`/blogs/${blog.slug}`} className="block group">
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  {blog.coverUrl ? (
                    <img 
                      src={blog.coverUrl} 
                      alt={blog.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                      <span>No Image Available</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3 text-sm">
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
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {blog.title}
                  </h3>
                  {blog.excerpt && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
                      {blog.excerpt}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {staticBlogs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 text-lg">No blog posts available at the moment.</div>
          </div>
        )}
      </div>
    </div>
  );
}
