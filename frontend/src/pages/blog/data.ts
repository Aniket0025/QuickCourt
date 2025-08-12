export interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  type: 'blog' | 'article' | 'event' | 'award';
  sport?: string;
  excerpt?: string;
  coverUrl?: string;
  readMinutes?: number;
  publishedAt?: string;
  updatedAt?: string;
  content?: string;
}

export const staticBlogs: BlogItem[] = [
  {
    _id: '1',
    title: 'Rising Stars: Kishore Jena and Neeraj Chopra – India\'s Javelin Champions',
    slug: 'rising-stars-kishore-jena-neeraj-chopra',
    type: 'blog',
    sport: 'athletics',
    excerpt: 'Discover the inspiring journey of India\'s javelin throw champions who are making the nation proud on the global stage.',
    coverUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop&auto=format',
    readMinutes: 4,
    publishedAt: '2024-07-23T00:00:00Z',
    content: `
      <h2>The Golden Era of Indian Javelin</h2>
      <p>India's javelin throw has witnessed a remarkable transformation in recent years, with athletes like Neeraj Chopra and Kishore Jena leading the charge. Their dedication, technique, and mental fortitude have not only brought glory to the nation but also inspired a new generation of athletes.</p>
      
      <h3>Neeraj Chopra: The Olympic Champion</h3>
      <p>Neeraj Chopra's historic gold medal at the Tokyo Olympics marked a watershed moment for Indian athletics. His consistent performances and technical excellence have made him a household name and a role model for aspiring athletes across the country.</p>
      
      <h3>Kishore Jena: The Rising Star</h3>
      <p>Kishore Jena has emerged as another promising talent in Indian javelin throw. His impressive performances at various national and international competitions showcase the depth of talent in Indian athletics.</p>
      
      <h3>Impact on Indian Sports</h3>
      <p>The success of these athletes has led to increased interest in athletics across India, with more young people taking up the sport and better infrastructure being developed to support their training.</p>
    `
  },
  {
    _id: '2',
    title: 'Empowering Innings: The Rise of Women\'s Cricket Worldwide',
    slug: 'empowering-innings-womens-cricket-rise',
    type: 'article',
    sport: 'cricket',
    excerpt: 'Exploring the phenomenal growth and recognition of women\'s cricket on the global stage.',
    coverUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500&h=300&fit=crop&auto=format',
    readMinutes: 6,
    publishedAt: '2024-07-11T00:00:00Z',
    content: `
      <h2>Breaking Barriers in Cricket</h2>
      <p>Women's cricket has experienced unprecedented growth in recent years, with increased viewership, better pay structures, and greater recognition from cricket boards worldwide.</p>
      
      <h3>Global Tournaments and Recognition</h3>
      <p>Major tournaments like the Women's T20 World Cup and the Women's Cricket World Cup have gained significant traction, showcasing the skill and athleticism of female cricketers.</p>
      
      <h3>Professional Leagues</h3>
      <p>The establishment of professional women's cricket leagues in various countries has provided a platform for players to showcase their talent and earn a living from the sport.</p>
      
      <h3>Future Prospects</h3>
      <p>With continued investment and support, women's cricket is poised for even greater heights, inspiring young girls worldwide to take up the sport.</p>
    `
  },
  {
    _id: '3',
    title: 'And that was the Final!',
    slug: 'and-that-was-the-final',
    type: 'event',
    sport: 'cricket',
    excerpt: 'Reliving the thrilling moments of an unforgettable cricket final that kept fans on the edge of their seats.',
    coverUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&h=300&fit=crop&auto=format',
    readMinutes: 3,
    publishedAt: '2024-07-28T00:00:00Z',
    content: `
      <h2>A Final to Remember</h2>
      <p>The atmosphere was electric as two powerhouse teams faced off in what would become one of the most memorable finals in recent cricket history.</p>
      
      <h3>The Build-Up</h3>
      <p>Both teams had fought hard throughout the tournament, displaying exceptional skill and determination to reach the final stage.</p>
      
      <h3>The Match</h3>
      <p>From the first ball to the last, the match was filled with spectacular catches, powerful batting, and strategic bowling that kept spectators glued to their seats.</p>
      
      <h3>The Celebration</h3>
      <p>The winning team's celebration was a testament to their hard work and dedication throughout the season, creating memories that will last a lifetime.</p>
    `
  },
  {
    _id: '4',
    title: 'QuickCourt: Revolutionizing Sports Facility Booking',
    slug: 'quickcourt-revolutionizing-sports-booking',
    type: 'blog',
    sport: 'general',
    excerpt: 'How QuickCourt is transforming the way athletes and sports enthusiasts book and manage sports facilities.',
    coverUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=300&fit=crop&auto=format',
    readMinutes: 5,
    publishedAt: '2024-07-15T00:00:00Z',
    content: `
      <h2>The Future of Sports Facility Management</h2>
      <p>QuickCourt represents a paradigm shift in how sports facilities are booked, managed, and utilized, bringing technology to the forefront of sports infrastructure.</p>
      
      <h3>Seamless Booking Experience</h3>
      <p>With just a few clicks, users can browse available courts, check real-time availability, and secure their preferred time slots without the hassle of traditional booking methods.</p>
      
      <h3>Smart Features</h3>
      <p>The platform includes intelligent features like automated reminders, weather updates, and facility recommendations based on user preferences and location.</p>
      
      <h3>Community Building</h3>
      <p>Beyond booking, QuickCourt fosters a community of sports enthusiasts, enabling players to connect, form teams, and participate in tournaments.</p>
      
      <h3>Impact on Sports Culture</h3>
      <p>By making sports facilities more accessible and easier to book, QuickCourt is contributing to a more active and engaged sports community.</p>
    `
  },
  {
    _id: '5',
    title: 'Excellence in Badminton: Championship Highlights',
    slug: 'excellence-badminton-championship-highlights',
    type: 'award',
    sport: 'badminton',
    excerpt: 'Celebrating outstanding performances and achievements from the recent badminton championship.',
    coverUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500&h=300&fit=crop&auto=format',
    readMinutes: 4,
    publishedAt: '2024-07-05T00:00:00Z',
    content: `
      <h2>A Showcase of Badminton Excellence</h2>
      <p>The recent badminton championship witnessed some of the finest displays of skill, strategy, and sportsmanship from players across different categories.</p>
      
      <h3>Outstanding Performances</h3>
      <p>Several players delivered career-best performances, showcasing the evolution of badminton techniques and training methods.</p>
      
      <h3>Rising Talents</h3>
      <p>The championship also provided a platform for emerging players to demonstrate their potential and compete against established champions.</p>
      
      <h3>Awards and Recognition</h3>
      <p>Beyond the main titles, special awards were given for sportsmanship, most improved player, and breakthrough performance of the tournament.</p>
      
      <h3>Looking Forward</h3>
      <p>These championships continue to elevate the standard of badminton and inspire the next generation of players to pursue excellence in the sport.</p>
    `
  }
];
