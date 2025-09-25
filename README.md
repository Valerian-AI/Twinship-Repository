# Twinship Repository

A comprehensive full-stack personal portfolio and creative media management application built with Node.js, MongoDB, and vanilla JavaScript. This project features a modern glassmorphism design with extensive media handling capabilities, real-time communication, and advanced content management systems.

## Table of Contents
- [Features Overview](#features-overview)
- [Tech Stack](#tech-stack)
- [Installation & Setup](#installation--setup)
- [File Structure](#file-structure)
- [Feature Documentation](#feature-documentation)
- [Admin Mode](#admin-mode)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features Overview

### 🎨 Frontend & User Interface
- **Glassmorphism Design**: Modern "frosted glass" aesthetic with backdrop blur effects
- **Custom Animated Cursors**: Complete set of custom cursors for different interaction states
- **Dynamic Theme System**: Persistent light/dark theme toggle with localStorage
- **Customizable Backgrounds**: User-controlled background selection with SFW/NSFW categories
- **Toast Notification System**: Custom notifications replacing browser alerts
- **Responsive Layout**: Adaptive design supporting desktop, tablet, and mobile devices
- **Smooth Animations**: Lenis smooth scrolling and CSS transitions throughout
- **Real-time Clock Widget**: System time display with 12-hour format

### 🖼️ Advanced Gallery System
- **Dual Gallery Widgets**: Separate SFW and NSFW image galleries with animated covers
- **GIF Gallery System**: Dedicated GIF management with category support
- **Interactive Lightbox**: Full-screen image viewing with keyboard navigation
- **Multiple File Upload**: Batch upload capability for images and GIFs
- **Category Management**: Admin-controlled content organization
- **Drag-and-Drop**: Intuitive file upload interface
- **Image Optimization**: Automatic resizing and format optimization

### 🎵 Integrated Media Player
- **Dynamic Music Library**: Automatic detection of music files and cover art
- **Full Playback Controls**: Play/pause, next/previous, seek functionality
- **Visual Playlist**: Click-to-play song selection with album art
- **Progress Tracking**: Real-time playback progress with time display
- **Automatic Scanning**: Server-side music folder monitoring
- **Cover Art Support**: Automatic pairing of audio files with cover images

### 📚 Content Management
- **Story Repository**: "Valerian Sci-fi" collection with file-based story support
- **Document Management**: Categorized project repository with 5 document types:
  - Word Documents (.doc, .docx)
  - PDF Documents (.pdf)
  - AutoCAD Projects (.dwg)
  - SolidWorks Files (.sldprt, .sldasm)
  - PowerPoint Presentations (.ppt, .pptx)
- **Story Viewer**: Modal-based reading interface with page navigation
- **Comment System**: User comments on stories with timestamp tracking
- **Search Functionality**: Real-time story search with content filtering

### 🌐 Social Media Integration
- **Multi-Platform Support**: YouTube, Steam, Reddit, and Discord integration
- **Profile Fetching**: Automatic username extraction from profile URLs
- **Dynamic Updates**: Real-time profile information updates
- **Clickable Links**: Direct navigation to social media profiles
- **Fallback System**: Manual profile updates if automatic fetching fails

### 💬 Real-time Communication
- **Live Chat System**: Socket.IO-powered instant messaging
- **User Presence**: Real-time connection status
- **Message History**: Persistent chat log during sessions

### 🔧 Administration Panel
- **Secure Admin Mode**: URL parameter-based admin access
- **Content Management**: Upload, delete, and organize all media types
- **Database Maintenance**: Orphaned file cleanup and synchronization
- **Profile Customization**: Banner positioning, username changes
- **Settings Management**: Comprehensive configuration controls

## Tech Stack

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB Atlas**: Cloud database with Mongoose ODM
- **Socket.IO**: Real-time bidirectional event-based communication
- **Multer**: Middleware for file upload handling
- **dotenv**: Environment variable management

### Frontend
- **Vanilla JavaScript (ES6+)**: Modern JavaScript without frameworks
- **HTML5**: Semantic markup structure
- **CSS3**: Advanced styling with custom properties and animations
- **Lenis**: Smooth scrolling library
- **SortableJS**: Drag and drop functionality

### External Services
- **MongoDB Atlas**: Database hosting and management
- **Render/Vercel**: Deployment platforms
- **CDNJS**: External library hosting

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (free tier available)
- Git version control

### Local Development Setup

1. **Clone Repository**
```bash
git clone <repository-url>
cd twinship-repository
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create `.env` file in project root:
```env
DATABASE_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database>?retryWrites=true&w=majority
PORT=3000
```

4. **Directory Structure Creation**
The server automatically creates required directories:
```
public/
├── assets/
│   ├── backgrounds/
│   │   ├── sfw/         # SFW background images
│   │   └── nsfw/        # NSFW background images
│   ├── gallery-covers/  # Gallery widget cover images
│   ├── gif-covers/      # GIF gallery covers
│   ├── icons/           # Social media and document icons
│   ├── music/           # Music files and cover art
│   └── cursors/         # Custom cursor files
└── uploads/             # User-uploaded content
```

5. **Asset Setup**
Add your assets to the appropriate directories:
- **Backgrounds**: Add background images to `/public/assets/backgrounds/sfw/` and `/public/assets/backgrounds/nsfw/`
- **Music**: Place `.mp3` files and matching cover art in `/public/assets/music/`
- **Icons**: Add platform icons to `/public/assets/icons/`
- **Cursors**: Place cursor files in `/public/assets/cursors/`

6. **Start Development Server**
```bash
node server.js
```

7. **Access Application**
- User Mode: `http://localhost:3000`
- Admin Mode: `http://localhost:3000?admin=true`

## File Structure

```
twinship-repository/
├── public/                    # Static assets
│   ├── assets/               # Media assets
│   │   ├── backgrounds/      # Background images
│   │   ├── cursors/          # Custom cursors
│   │   ├── gallery-covers/   # Gallery thumbnails
│   │   ├── gif-covers/       # GIF gallery covers
│   │   ├── icons/            # Platform icons
│   │   └── music/            # Music library
│   ├── uploads/              # User uploads
│   ├── styles.css           # Main stylesheet
│   └── script.js            # Frontend JavaScript
├── .env                      # Environment variables
├── .gitignore               # Git ignore rules
├── index.html               # Main HTML file
├── package.json             # Node.js dependencies
├── server.js                # Express server
└── README.md                # This file
```

## Feature Documentation

### Gallery System

#### Image Galleries
- **SFW Gallery**: Safe-for-work image collection
- **NSFW Gallery**: Adult content with restricted access
- **Upload Process**: Drag-and-drop or file selection
- **Batch Upload**: Multiple file selection support
- **Management**: Admin deletion and organization tools

#### GIF Management
- **Separate GIF Galleries**: Independent SFW/NSFW GIF collections
- **Animated Covers**: GIF preview thumbnails
- **Category Support**: Organized content management

### Music Player

#### Setup Instructions
1. Create music directory: `/public/assets/music/`
2. Add MP3 files to the directory
3. Add matching cover art with identical filename:
   - `song.mp3` → `song.jpg` or `song.png`
4. Restart server to scan for new files

#### Player Features
- **Automatic Detection**: Server scans music folder on startup
- **Playlist Generation**: Dynamic playlist creation
- **Playback Controls**: Full media control interface
- **Progress Tracking**: Visual progress bar with time display
- **Click-to-Play**: Direct song selection from playlist

### Document Repository

#### Supported Categories
1. **Word Documents**: .doc, .docx files
2. **PDF Documents**: .pdf files
3. **AutoCAD Projects**: .dwg files
4. **SolidWorks**: .sldprt, .sldasm files
5. **PowerPoint**: .ppt, .pptx files

#### Usage
- Click "Browse Projects" to open repository
- Select category widget to view files
- Download files directly from browser
- Admin can upload/delete files by category

### Social Media Integration

#### Supported Platforms
- **YouTube**: Channel URLs and usernames
- **Steam**: Community profile URLs
- **Reddit**: User profile URLs
- **Discord**: Username display only

#### Configuration
1. Enter admin mode (`?admin=true`)
2. Click pencil icon next to social widget
3. Enter profile URL or username
4. System attempts automatic profile fetching
5. Manual fallback if automatic fetch fails

### Story Management

#### Story Repository
- **"Valerian Sci-fi" Collection**: Themed story repository
- **File Support**: Upload PDF and DOCX story files
- **Text Stories**: Direct text entry through web interface
- **Preview System**: Story previews in sidebar
- **Search Functionality**: Real-time story filtering

#### Story Viewer
- **Modal Interface**: Full-screen reading experience
- **Page Navigation**: Next/previous page controls
- **Comment System**: User feedback on stories
- **Responsive Design**: Mobile-optimized reading

### Real-time Features

#### Live Chat
- **Socket.IO Integration**: Instant message delivery
- **User Sessions**: Persistent chat during visit
- **Message History**: Session-based message storage

#### Toast Notifications
- **Custom System**: Replaces browser alerts
- **Multiple Types**: Success, error, warning, info
- **Auto-dismiss**: Timed automatic removal
- **Manual Close**: User-controlled dismissal

## Admin Mode

### Activation
Add `?admin=true` to any URL to enable admin mode.

### Admin Capabilities

#### Content Management
- **Upload Controls**: Batch file uploads across all categories
- **Delete Operations**: Remove any content type
- **Category Management**: Organize content by type
- **Reorder Content**: Drag-and-drop content organization

#### Profile Customization
- **Username Changes**: Real-time profile updates
- **Profile Pictures**: Upload and crop profile images
- **Banner Management**: Upload and position banner images
- **Banner Positioning**: Drag-to-position banner images
- **Social Media**: Configure all platform connections

#### System Maintenance
- **Database Cleanup**: Remove orphaned database entries
- **File Synchronization**: Sync database with file system
- **Cache Management**: Clear system caches
- **Error Monitoring**: View system error logs

#### Admin Tools Panel
- **Floating Action Button**: Quick access to admin functions
- **Clean Database**: Remove orphaned entries
- **Remove Banner**: Clear banner image
- **Exit Admin Mode**: Return to user view

## API Endpoints

### Content Management
```
POST /upload              # Single file upload
POST /upload-multiple     # Multiple file upload
DELETE /api/media         # Delete media files
GET /api/data            # Retrieve all application data
```

### Gallery Operations
```
GET /api/gallery/:category    # Get gallery by category (sfw/nsfw)
GET /api/gifs/:category      # Get GIFs by category
POST /api/gallery/reorder    # Reorder gallery items
```

### Document Management
```
GET /api/homework/:category  # Get documents by category
```

### Story Management
```
GET /api/stories/all        # Get all stories
GET /api/story/:id          # Get specific story
POST /api/stories           # Create new story
DELETE /api/stories/:id     # Delete story
```

### Comments
```
GET /api/comments/:storyId   # Get story comments
POST /api/comments           # Add comment
```

### Music Library
```
GET /api/music              # Get music library
```

### Social Media
```
POST /api/fetch-social-profile  # Fetch social media profile
```

### Settings & Configuration
```
POST /api/settings             # Update user settings
POST /api/banner-position      # Update banner position
POST /api/remove-banner        # Remove banner image
POST /api/sync-database        # Database maintenance
```

## Deployment

### Render Deployment

1. **Repository Setup**
   - Push code to GitHub repository
   - Ensure all sensitive data is in `.env` file

2. **Render Configuration**
   - Create new "Web Service" on Render
   - Connect to GitHub repository
   - Build Command: `npm install`
   - Start Command: `node server.js`

3. **Environment Variables**
   Add to Render environment:
   ```
   DATABASE_URL=<your-mongodb-atlas-connection-string>
   ```

4. **Asset Management**
   - Upload assets through admin interface post-deployment
   - Or include in repository before deployment



### Common Issues

#### Music Player Not Working
- **Check File Format**: Ensure MP3 format
- **Verify Cover Art**: Matching filenames required
- **Console Errors**: Check browser console for audio errors
- **File Permissions**: Ensure server can read music directory

#### Upload Failures
- **File Size**: Check file size limits (50MB default)
- **Timeout Issues**: Increase timeout for large files
- **Network Connectivity**: Verify stable internet connection
- **Database Connection**: Check MongoDB Atlas connection

#### Social Media Integration
- **URL Format**: Ensure proper platform URL format
- **API Limits**: Some platforms have rate limiting
- **CORS Issues**: Check cross-origin request policies
- **Authentication**: Some platforms require authentication

#### Database Issues
- **Connection String**: Verify MongoDB Atlas connection
- **Network Access**: Check MongoDB Atlas network settings
- **Database Permissions**: Ensure proper user permissions
- **Orphaned Files**: Use admin cleanup tools

### Performance Optimization

#### File Management
- **Image Compression**: Optimize images before upload
- **File Organization**: Regular cleanup of unused files
- **Database Indexing**: Monitor database performance
- **Caching Strategy**: Implement browser caching

#### Network Performance
- **CDN Usage**: Consider CDN for static assets
- **Gzip Compression**: Enable server compression
- **Minification**: Minify CSS and JavaScript
- **Lazy Loading**: Implement progressive loading

## Security Considerations

### Admin Access
- **URL Parameter Security**: Admin mode is URL-based (consider authentication upgrade)
- **File Upload Validation**: Server-side file type validation
- **Input Sanitization**: All user inputs are sanitized
- **Database Security**: MongoDB Atlas provides built-in security

### Recommended Enhancements
- **Authentication System**: Implement proper admin login
- **HTTPS Enforcement**: Use SSL certificates
- **Rate Limiting**: Implement request rate limiting
- **Content Security Policy**: Add CSP headers

## Contributing

### Development Guidelines
1. Follow existing code style and structure
2. Test all features thoroughly before submission
3. Update documentation for new features
4. Use meaningful commit messages
5. Consider backward compatibility

### Feature Requests
- Open GitHub issues for feature requests
- Provide detailed use case descriptions
- Consider implementation complexity
- Test proposed solutions

### Bug Reports
- Include browser and system information
- Provide reproduction steps
- Include console error messages
- Attach relevant screenshots

## License

MIT License - See LICENSE file for details.

## Credits

### Development
- **Primary Assistant**: Claude Sonnet 4 (Anthropic) - Major feature development and architecture
- **Additional Support**: ChatGPT (OpenAI), Gemini Pro 2.5 (Google)
- **Human Developer**: Project conception and requirements

### Assets
- **Custom Cursors**: Community-contributed cursor designs
- **Background Images**: User-provided background collection
- **Music Library**: User-provided audio content
- **Icons**: Platform-specific iconography

### Open Source Libraries
- **Node.js & Express**: Server framework
- **MongoDB & Mongoose**: Database management
- **Socket.IO**: Real-time communication
- **Lenis**: Smooth scrolling
- **SortableJS**: Drag and drop functionality

## Support

For technical support or questions:
1. Check troubleshooting section above
2. Review GitHub issues for similar problems
3. Create new issue with detailed description
4. Include system information and error messages

## Version History

- **v1.0.0**: Initial release with basic functionality
- **v1.1.0**: Added music player and GIF galleries
- **v1.2.0**: Implemented social media integration
- **v1.3.0**: Enhanced document repository system
- **v1.4.0**: Added real-time chat and comments
- **v2.0.0**: Complete UI overhaul with glassmorphism design

---

**Note**: This project represents a learning journey from zero coding knowledge to a full-stack application, demonstrating the potential of AI-assisted development while maintaining focus on functionality and user experience.
