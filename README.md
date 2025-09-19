Twinship Repository
Welcome to the Twinship Repository, a full-stack personal portfolio and creative media application built with Node.js and MongoDB. This is a pet project made by someone with 0 prior code knowladge with the aid of Gemini
Pro 2.5!

Features
This app is packed with an array of tools for media handling. 

🎨 Front-End & UI
Glassmorphism UI: A modern "frosted glass" aesthetic for all panels and sections, providing a sense of depth.

Custom Animated Cursors: A full set of custom animated cursors for different interactions (default, link hover, text input, and loading states).

Light/Dark Theme: A persistent theme toggle that saves the user's preference.

Customizable Backgrounds: A user-facing control panel with two categories (SFW/NSFW) of selectable backgrounds that persist across sessions.

Image Lightbox: Click on any image or GIF in a gallery to view it in a full-screen overlay with arrow key navigation to browse the entire gallery.

Responsive Layout: A flexible two-column layout that adapts to different screen sizes.

🎵 Media & Content
Image & GIF Repositories: Separate, dynamically loaded galleries for static images and animated GIFs.

Performance-Optimized Gallery: The main image gallery displays a limited number of thumbnails for fast loading, with additional images accessible via a hover-activated, horizontally scrolling widget.

Dynamic Music Library: A full-featured music player that automatically scans a folder for songs and their matching cover art. Includes a playlist, playback controls (play/pause, next, previous), and a seekable progress bar.

Story Editor & Repository: An on-page editor to write and save stories, which are then displayed in a scrollable list in the sidebar.

Homework/File Repository: A section to upload and list any type of file (PDF, documents, CAD files) for easy access and download.

Live Chat: A real-time chatroom powered by Socket.IO.

🔐 Admin & Back-End
Admin Mode: A simple but effective admin mode, activated by a URL query (?admin=true), that reveals content management controls.

Persistent Database: All content and settings are saved permanently to a MongoDB Atlas cloud database.

Content Management: Admins can:

Delete any image, GIF, story, or homework file.

Reorder the main image gallery via drag-and-drop.

Change the profile picture, banner, username, and YouTube link.

Upload new songs and cover art to the music library.

Database Synchronization: An admin tool to "Clean Orphaned Entries," which scans the database and removes any records that point to non-existent files.

Tech Stack
Back-End: Node.js, Express.js

Database: MongoDB with Mongoose ODM

Real-time Communication: Socket.IO

Front-End: Vanilla JavaScript (ES6+), HTML5, CSS3

File Handling: Multer

Drag-and-Drop: SortableJS

Setup and Installation
To run this project locally, follow these steps:

1. Prerequisites

Node.js installed

Git installed
git clone https://github.com/YourUsername/YourRepositoryName.git
cd YourRepositoryName

3. Install Dependencies

Bash

npm install
4. Set Up Environment Variables

Create a file named .env in the root of the project.

Get your connection string from your MongoDB Atlas cluster.

Add the connection string to your .env file. Remember to replace <password> with your actual database user password.

DATABASE_URL=mongodb+srv://YourUser:YourPassword@cluster0.xxxxx.mongodb.net/yourDatabaseName?retryWrites=true&w=majority
5. Run the Server

Bash

node server.js
The application will be running at http://localhost:3000.

File Structure
The project is organized into a standard Node.js application structure.

/my-portfolio-app
|
|-- /public
|   |-- /assets
|   |   |-- /backgrounds
|   |   |   |-- /sfw
|   |   |   |-- /nsfw
|   |   |-- /cursors
|   |   |-- /music
|   |-- /uploads
|   |-- styles.css
|   |-- script.js
|
|-- .env                # (Your local secrets, not on GitHub)
|-- .gitignore
|-- db.json             # (Used by lowdb, now replaced by MongoDB)
|-- index.html
|-- package.json
|-- package-lock.json
|-- README.md
|-- server.js
Usage
Admin Mode
To access the content management features, add ?admin=true to the end of the URL.

Example: http://localhost:3000?admin=true

This will reveal the admin tools panel, edit icons, and delete/drag handles on content.

Music Library
To add songs to the library, simply place your .mp3 files and their corresponding .jpg or .png cover art (with the exact same filename) into the /public/uploads/music folder using the admin music uploader. The server will automatically detect them on the next page load.

Deployment
This application is ready for deployment on services like Render.

Push the final code to a GitHub repository.

Create a new "Web Service" on Render and connect it to your repository.

Use the following settings:

Build Command: npm install

Start Command: node server.js

In the "Environment" tab, add a secret environment variable with the Key DATABASE_URL and the Value being your full MongoDB Atlas connection string.

Render will automatically deploy the application on every push to your main branch.

Credits
Cursors: Credit to the artists of the cursor files used.

Music: Credit to the artists of the music files used.

Images: Credit to the artists of the background images used.
