# Twinship Repository

Welcome to the Twinship Repository, a full-stack personal portfolio and creative media application built with Node.js and MongoDB. This is a pet project made by someone with 0 prior coding knowledge with the aid of AI assistants!

## Features

This app is packed with an array of tools for media handling and content management.

### 🎨 Front-End & UI

**Glassmorphism UI**: A modern "frosted glass" aesthetic for all panels and sections, providing a sense of depth and visual appeal.

**Custom Animated Cursors**: A full set of custom animated cursors for different interactions (default, link hover, text input, and loading states).

**Light/Dark Theme**: A persistent theme toggle that saves the user's preference across sessions.

**Customizable Backgrounds**: A user-facing control panel with two categories (SFW/NSFW) of selectable backgrounds that persist across sessions.

**Image Lightbox**: Click on any image or GIF in a gallery to view it in a full-screen overlay with arrow key navigation to browse the entire gallery.

**Responsive Layout**: A flexible two-column layout that adapts to different screen sizes.

### 🖼️ Gallery System

**SFW/NSFW Gallery Widgets**: Two beautifully designed gallery widgets with hover effects that open into categorized image collections. Each widget features:
- Animated cover images with overlay text
- 5x5 responsive grid display (adapts to 3x3 on mobile, 2x2 on small screens)
- Category-specific upload functionality for admins
- Full lightbox integration with keyboard navigation
- Individual delete controls for each image

**Performance-Optimized Display**: Clean, organized gallery presentation with smooth animations and glass morphism styling.

### 🎵 Media & Content

**Image & GIF Repositories**: Separate, dynamically loaded galleries for static images and animated GIFs with full category support.

**Dynamic Music Library**: A full-featured music player that automatically scans a folder for songs and their matching cover art. Includes:
- Auto-generated playlist from music folder
- Playback controls (play/pause, next, previous)
- Seekable progress bar with time display
- Album art display
- Click-to-play playlist functionality

**Story Editor & Repository**: An on-page editor to write and save stories, which are then displayed in a scrollable list in the sidebar with preview functionality.

**Homework/File Repository**: A section to upload and list any type of file (PDF, documents, CAD files) for easy access and download.

**Live Chat**: A real-time chatroom powered by Socket.IO for instant communication.

### 🔐 Admin & Back-End

**Admin Mode**: A comprehensive admin mode, activated by a URL query (`?admin=true`), that reveals content management controls including:
- Upload controls for categorized galleries (SFW/NSFW)
- Content deletion and management tools
- Profile customization options
- Database maintenance tools

**Persistent Database**: All content and settings are saved permanently to a MongoDB Atlas cloud database with category support.

**Content Management**: Admins can:
- Upload images to specific gallery categories (SFW/NSFW)
- Delete any image, GIF, story, or homework file
- Change the profile picture, banner, username, and YouTube link
- Upload new songs and cover art to the music library
- Manage categorized content organization

**Database Synchronization**: An admin tool to "Clean Orphaned Entries," which scans the database and removes any records that point to non-existent files.

## Tech Stack

- **Back-End**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time Communication**: Socket.IO
- **Front-End**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **File Handling**: Multer with category support
- **UI Interactions**: SortableJS
- **Smooth Scrolling**: Lenis

## Setup and Installation

To run this project locally, follow these steps:

### Prerequisites
- Node.js installed
- MongoDB Atlas account (free tier available)
- Git installed

### Installation Steps

1. **Clone the Repository**
```bash
git clone https://github.com/YourUsername/YourRepositoryName.git
cd YourRepositoryName
```

2. **Install Dependencies**
```bash
npm install
```

3. **Set Up Environment Variables**
   - Create a file named `.env` in the root of the project
   - Get your connection string from your MongoDB Atlas cluster
   - Add the connection string to your `.env` file (replace with your actual database user password):

```env
DATABASE_URL=mongodb+srv://YourUser:YourPassword@cluster0.xxxxx.mongodb.net/yourDatabaseName?retryWrites=true&w=majority
```

4. **Set Up Asset Directories**
   - Create the following directory structure in `/public/assets/`:
     - `/backgrounds/sfw/` - Add your SFW background images
     - `/backgrounds/nsfw/` - Add your NSFW background images  
     - `/gallery-covers/` - Add `sfw-cover.jpg` and `nsfw-cover.jpg` for gallery widget covers
     - `/music/` - Add your music files (.mp3) and matching cover art (.jpg/.png)

5. **Run the Server**
```bash
node server.js
```

The application will be running at `http://localhost:3000`.

## File Structure

```
/my-portfolio-app
│
├── /public
│   ├── /assets
│   │   ├── /backgrounds
│   │   │   ├── /sfw
│   │   │   └── /nsfw
│   │   ├── /gallery-covers
│   │   ├── /cursors
│   │   └── /music
│   ├── /uploads
│   ├── styles.css
│   └── script.js
├── .env                    # Your local secrets (not in repo)
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

## Usage

### Admin Mode
To access the content management features, add `?admin=true` to the end of the URL.

**Example**: `http://localhost:3000?admin=true`

This will reveal:
- Admin tools panel
- Upload controls for galleries
- Edit icons and delete/drag handles on content
- Category-specific gallery management

### Gallery Management
- **SFW Gallery**: Click the SFW widget to manage safe-for-work images
- **NSFW Gallery**: Click the NSFW widget to manage adult content
- **Upload**: Use the upload controls within each gallery modal (admin only)
- **Navigation**: Use arrow keys or on-screen controls in lightbox mode

### Music Library
To add songs to the library, place your `.mp3` files and their corresponding `.jpg` or `.png` cover art (with the exact same filename) into the `/public/assets/music` folder. The server will automatically detect them on the next page load.

## Deployment

This application is ready for deployment on services like Render, Vercel, or similar platforms.

### Render Deployment
1. Push the final code to a GitHub repository
2. Create a new "Web Service" on Render and connect it to your repository
3. Use the following settings:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. In the "Environment" tab, add a secret environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your full MongoDB Atlas connection string

Render will automatically deploy the application on every push to your main branch.

## Credits

**Development Assistance**: This project was built with the help of multiple AI assistants:
- **Claude Sonnet 4** (Anthropic) - Major feature development and code architecture
- **ChatGPT** (OpenAI) - Initial development assistance  
- **Gemini Pro 2.5** (Google) - Early development and problem-solving

**Assets**:
- **Cursors**: Credit to the artists of the cursor files used
- **Music**: Credit to the artists of the music files used  
- **Images**: Credit to the artists of the background images used

**Special Thanks**: To the open-source community for the libraries and tools that made this project possible.

## Contributing

This is a personal portfolio project, but feel free to fork it and adapt it for your own use. If you find bugs or have suggestions for improvements, please open an issue.

## License

This project is open source and available under the [MIT License](LICENSE).
