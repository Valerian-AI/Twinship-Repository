document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lenis smooth scrolling
    if (window.Lenis) {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => t,
            smooth: true,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    // Socket.IO initialization
    const socket = io();

    // Global state
    const urlParams = new URLSearchParams(window.location.search);
    const isAdmin = urlParams.get('admin') === 'true';
    let galleryData = { sfw: [], nsfw: [] };
    let gifData = { sfw: [], nsfw: [] };
    let currentGalleryType = 'sfw';
    let currentGallery = [];
    let currentIndex = 0;
    let musicLibrary = [];
    let songIndex = 0;
    let isPlaying = false;
    let allStories = [];
    let currentStoryIndex = 0;
    let currentStoryPages = [];
    let currentStoryComments = [];
    let bannerDragMode = false;

    // DOM Elements - Updated to target sidebar music player specifically
    const elements = {
        body: document.body,
        username: document.getElementById('username-display'),
        profilePic: document.getElementById('profile-picture-display'),
        banner: document.getElementById('banner-display'),
        youtubeLink: document.getElementById('youtube-link'),
        steamProfile: document.getElementById('steam-profile'),
        discordProfile: document.getElementById('discord-profile'),
        lightbox: document.getElementById('lightbox'),
        lightboxImage: document.querySelector('.lightbox-content'),
        audioPlayer: document.querySelector('#music-player-section #audio-source'),
        playPauseBtn: document.querySelector('#music-player-section #play-pause-button'),
        prevBtn: document.querySelector('#music-player-section #prev-button'),
        nextBtn: document.querySelector('#music-player-section #next-button'),
        albumArt: document.querySelector('#music-player-section #album-art'),
        songTitle: document.querySelector('#music-player-section #song-title'),
        songArtist: document.querySelector('#music-player-section #song-artist'),
        progressContainer: document.querySelector('#music-player-section #progress-container'),
        progress: document.querySelector('#music-player-section #progress'),
        currentTimeEl: document.querySelector('#music-player-section #current-time'),
        durationEl: document.querySelector('#music-player-section #duration'),
        playlistToggle: document.querySelector('#music-player-section #playlist-toggle'),
        playlist: document.querySelector('#music-player-section #playlist'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input'),
        messages: document.getElementById('messages'),
        clockTime: document.getElementById('clock-time'),
        clockDate: document.getElementById('clock-date'),
        storyList: document.getElementById('story-list'),
        homeworkCount: document.getElementById('homework-count')
    };

    // Aspect Toggle functionality
    const aspectColors = {
        neuro: {
            primary: '#8DEDEB',
            secondary: '#D2B399',
            accent: '#FC81AC',
            tertiary: '#8EEEEA',
            quaternary: '#F6DAC7'
        },
        evilNeuro: {
            primary: '#E7205B',
            secondary: '#780B34',
            accent: '#150204',
            tertiary: '#3A3A3B',
            quaternary: '#A67F75'
        }
    };

    function setAspect(aspect) {
        document.body.classList.remove('neuro-aspect', 'evil-neuro-aspect');
        if (aspect === 'neuro') {
            document.body.classList.add('neuro-aspect');
        } else if (aspect === 'evilNeuro') {
            document.body.classList.add('evil-neuro-aspect');
        }
        localStorage.setItem('aspect', aspect);
    }

    // Initialize aspect from localStorage
    const savedAspect = localStorage.getItem('aspect') || 'default';
    if (savedAspect !== 'default') {
        setAspect(savedAspect);
    }

    // Toast notification system
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;
        
        const container = document.getElementById('toast-container');
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('toast-fade-out');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 5000);
        
        // Manual close
        toast.querySelector('.toast-close').onclick = () => {
            toast.classList.add('toast-fade-out');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        };
        
        // Animate in
        setTimeout(() => toast.classList.add('toast-show'), 100);
    }

    // Clock functionality
    function updateClock() {
        const now = new Date();
        const timeOptions = { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        };
        const dateOptions = { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
        };
        
        if (elements.clockTime) {
            elements.clockTime.textContent = now.toLocaleTimeString('en-US', timeOptions);
        }
        if (elements.clockDate) {
            elements.clockDate.textContent = now.toLocaleDateString('en-US', dateOptions);
        }
    }
    
    // Update clock every second
    updateClock();
    setInterval(updateClock, 1000);

    // Enhanced uploader with progress and error handling
    async function uploadFile(file, type, category = null) {
        if (!file) {
            showToast('No file selected', 'error');
            return null;
        }

        showToast(`Uploading ${file.name}...`, 'info');

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        if (category) {
            formData.append("category", category);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000);

            const res = await fetch("/upload", {
                method: "POST",
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || `HTTP ${res.status}`);
            }

            const data = await res.json();
            showToast(`${file.name} uploaded successfully!`, 'success');
            return data;

        } catch (err) {
            if (err.name === 'AbortError') {
                showToast('Upload timed out. Please try again.', 'error');
            } else {
                showToast(`Upload failed: ${err.message}`, 'error');
            }
            console.error("[uploader] error", err);
            return null;
        }
    }

    // Multiple file uploader
    async function uploadMultipleFiles(files, type, category = null) {
        if (!files || files.length === 0) {
            showToast('No files selected', 'error');
            return null;
        }

        showToast(`Uploading ${files.length} files...`, 'info');

        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append("files", file);
        });
        formData.append("type", type);
        if (category) {
            formData.append("category", category);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 600000);

            const res = await fetch("/upload-multiple", {
                method: "POST",
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || `HTTP ${res.status}`);
            }

            const data = await res.json();
            showToast(`${data.count} files uploaded successfully!`, 'success');
            return data;

        } catch (err) {
            if (err.name === 'AbortError') {
                showToast('Upload timed out. Please try again.', 'error');
            } else {
                showToast(`Upload failed: ${err.message}`, 'error');
            }
            console.error("[multiple uploader] error", err);
            return null;
        }
    }

    // Social media profile fetcher - Updated to exclude reddit
    async function fetchSocialProfile(platform, url) {
        try {
            const response = await fetch('/api/fetch-social-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform, url })
            });
            
            if (!response.ok) throw new Error('Failed to fetch profile');
            
            const data = await response.json();
            return data.profile;
        } catch (error) {
            console.error('Profile fetch error:', error);
            return null;
        }
    }

    // Update social media widget - Updated to exclude reddit
    function updateSocialWidget(platform, profile) {
        const nameElement = document.getElementById(`${platform}-profile`);
        const linkElement = document.getElementById(`${platform}-link`);
        const avatarElement = document.getElementById(`${platform}-avatar`);
        
        if (nameElement) nameElement.textContent = profile.name;
        if (linkElement) linkElement.href = profile.url;
        if (avatarElement) avatarElement.src = profile.avatar;
    }

    // Music player functions - Updated for sidebar player
    const playSong = () => {
        if (musicLibrary.length === 0 || !elements.audioPlayer) return;
        isPlaying = true;
        elements.audioPlayer.play().catch(e => {
            console.error('Audio play failed:', e);
            showToast('Failed to play audio', 'error');
        });
        if (elements.playPauseBtn) elements.playPauseBtn.textContent = '⏸️';
    };

    const pauseSong = () => {
        if (!elements.audioPlayer) return;
        isPlaying = false;
        elements.audioPlayer.pause();
        if (elements.playPauseBtn) elements.playPauseBtn.textContent = '▶️';
    };

    const loadSong = (song) => {
        if (!song || !elements.audioPlayer) return;
        
        if (elements.songTitle) elements.songTitle.textContent = song.title;
        if (elements.songArtist) elements.songArtist.textContent = "Your Artist Name";
        if (elements.albumArt) elements.albumArt.src = song.cover;
        
        elements.audioPlayer.src = song.src;
        
        // Update playlist highlighting
        document.querySelectorAll('#music-player-section #playlist li').forEach(li => {
            li.classList.toggle('playing', li.dataset.songSrc === song.src);
        });
        
        console.log('Loaded song:', song.title, 'from', song.src);
    };

    const prevSong = () => {
        if (musicLibrary.length === 0) return;
        songIndex = songIndex > 0 ? songIndex - 1 : musicLibrary.length - 1;
        loadSong(musicLibrary[songIndex]);
        if (isPlaying) playSong();
    };

    const nextSong = () => {
        if (musicLibrary.length === 0) return;
        songIndex = songIndex < musicLibrary.length - 1 ? songIndex + 1 : 0;
        loadSong(musicLibrary[songIndex]);
        if (isPlaying) playSong();
    };

    const updateProgress = (e) => {
        if (!elements.progress || !elements.durationEl || !elements.currentTimeEl) return;
        
        const { duration, currentTime } = e.srcElement;
        if (isNaN(duration)) return;
        
        const progressPercent = (currentTime / duration) * 100;
        elements.progress.style.width = `${progressPercent}%`;
        
        const formatTime = (time) => {
            if (isNaN(time)) return "0:00";
            const minutes = Math.floor(time / 60);
            let seconds = Math.floor(time % 60);
            if (seconds < 10) { seconds = `0${seconds}`; }
            return `${minutes}:${seconds}`;
        };
        
        elements.durationEl.textContent = formatTime(duration);
        elements.currentTimeEl.textContent = formatTime(currentTime);
    };

    const setProgress = (e) => {
        if (!elements.audioPlayer) return;
        const width = e.currentTarget.clientWidth;
        const clickX = e.offsetX;
        const duration = elements.audioPlayer.duration;
        if (duration) {
            elements.audioPlayer.currentTime = (clickX / width) * duration;
        }
    };

    async function loadMusicLibrary() {
        try {
            const response = await fetch('/api/music');
            musicLibrary = await response.json();
            
            console.log('Music library loaded:', musicLibrary);
            
            if (elements.playlist) {
                elements.playlist.innerHTML = '';
                
                if (musicLibrary.length > 0) {
                    loadSong(musicLibrary[songIndex]);
                    
                    musicLibrary.forEach((song, index) => {
                        const li = document.createElement('li');
                        li.dataset.songSrc = song.src;
                        li.innerHTML = `<img src="${song.cover}" alt="cover"> <span>${song.title}</span>`;
                        li.addEventListener('click', () => {
                            songIndex = index;
                            loadSong(musicLibrary[songIndex]);
                            playSong();
                        });
                        elements.playlist.appendChild(li);
                    });
                    
                    showToast(`Loaded ${musicLibrary.length} songs`, 'success');
                } else {
                    showToast('No music files found in /assets/music/', 'warning');
                }
            }
        } catch (error) {
            console.error("Could not load music library", error);
            showToast('Failed to load music library', 'error');
        }
    }

    // Homework modal functions with document display
    let homeworkData = {
        word: [],
        pdf: [],
        autocad: [],
        solidworks: [],
        powerpoint: []
    };

    async function loadHomeworkByCategory(category) {
        try {
            const response = await fetch(`/api/homework/${category}`);
            const files = await response.json();
            homeworkData[category] = files;
            displayHomeworkFiles(category, files);
        } catch (error) {
            console.error('Failed to load homework files:', error);
            showToast('Failed to load files', 'error');
        }
    }

    function displayHomeworkFiles(category, files) {
        const filesList = document.getElementById('homework-files-list');
        if (!filesList) return;
        
        filesList.innerHTML = `<h3>${category.toUpperCase()} Documents</h3>`;
        
        if (files.length === 0) {
            filesList.innerHTML += '<p>No files uploaded in this category.</p>';
            return;
        }
        
        const ul = document.createElement('ul');
        ul.className = 'file-list';
        
        files.forEach((file, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <a href="${file.path}" download="${file.originalName}" target="_blank">
                    📄 ${file.originalName}
                </a>
                ${isAdmin ? `<button class="delete-button" onclick="deleteHomeworkFile('${file.path}', '${category}', ${index})">Delete</button>` : ''}
            `;
            ul.appendChild(li);
        });
        
        filesList.appendChild(ul);
    }

    // Global function for homework file deletion
    window.deleteHomeworkFile = async (filePath, category, index) => {
        if (!confirm('Delete this file?')) return;
        
        try {
            await fetch('/api/media', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    filePath: filePath, 
                    type: 'homework',
                    category: category 
                })
            });
            
            homeworkData[category].splice(index, 1);
            displayHomeworkFiles(category, homeworkData[category]);
            showToast('File deleted successfully', 'success');
        } catch (error) {
            showToast('Failed to delete file', 'error');
        }
    };

    function openHomeworkModal() {
        const modal = document.getElementById('homework-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    function closeHomeworkModal() {
        const modal = document.getElementById('homework-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Background management
    const backgrounds = {
        sfw: ['/assets/backgrounds/sfw/bg1.jpg', '/assets/backgrounds/sfw/bg2.jpg', '/assets/backgrounds/sfw/bg3.jpg', '/assets/backgrounds/sfw/bg4.jpg', '/assets/backgrounds/sfw/bg5.jpg'],
        nsfw: ['/assets/backgrounds/nsfw/bg1.jpg', '/assets/backgrounds/nsfw/bg2.jpg', '/assets/backgrounds/nsfw/bg3.jpg', '/assets/backgrounds/nsfw/bg4.jpg', '/assets/backgrounds/nsfw/bg5.jpg']
    };
    
    const setBackground = (bgPath) => {
        document.body.style.backgroundImage = `url(${bgPath})`;
        localStorage.setItem('selectedBackground', bgPath);
        document.querySelectorAll('.bg-thumbnail').forEach(thumb => {
            thumb.classList.toggle('active', thumb.dataset.bgPath === bgPath);
        });
    };

    const generateThumbnails = (category) => {
        const switcher = document.getElementById('background-switcher');
        if (!switcher || !backgrounds[category]) return;
        
        switcher.innerHTML = '';
        backgrounds[category].forEach(bgPath => {
            const thumb = document.createElement('div');
            thumb.className = 'bg-thumbnail';
            thumb.style.backgroundImage = `url(${bgPath})`;
            thumb.dataset.bgPath = bgPath;
            switcher.appendChild(thumb);
        });
        
        const savedBackground = localStorage.getItem('selectedBackground');
        if (savedBackground && backgrounds[category].includes(savedBackground)) {
            setBackground(savedBackground);
        }
    };

    // Gallery functions
    function openGalleryModal(category, type = 'image') {
        currentGalleryType = category;
        const modal = document.getElementById('gallery-modal');
        const modalTitle = document.getElementById('gallery-modal-title');
        
        if (!modal || !modalTitle) return;
        
        modalTitle.textContent = category.toUpperCase() + (type === 'gif' ? ' GIF' : '') + ' Gallery';
        modal.classList.remove('hidden');
        
        // Animate modal opening
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.8)';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        }, 50);
        
        if (type === 'gif') {
            populateGifModal(category);
        } else {
            populateGalleryModal(category);
        }
    }

    function closeGalleryModal() {
        const modal = document.getElementById('gallery-modal');
        if (!modal) return;
        
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.8)';
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.transform = '';
        }, 300);
    }

    function populateGalleryModal(category) {
        const grid = document.getElementById('gallery-modal-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        const images = galleryData[category] || [];
        
        images.forEach((item, index) => {
            const container = document.createElement('div');
            container.className = 'grid-item';
            
            const img = document.createElement('img');
            img.src = item.path;
            img.alt = item.originalName || 'Gallery Image';
            img.onclick = () => openLightbox(item, category, index, 'image');
            
            container.appendChild(img);
            
            if (isAdmin) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-button';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (!confirm('Are you sure you want to delete this image?')) return;
                    
                    try {
                        await fetch('/api/media', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                filePath: item.path, 
                                type: 'galleryImages',
                                category: category 
                            })
                        });
                        
                        galleryData[category].splice(index, 1);
                        populateGalleryModal(category);
                        showToast('Image deleted successfully', 'success');
                        
                    } catch (error) {
                        showToast('Failed to delete image', 'error');
                    }
                };
                container.appendChild(deleteBtn);
            }
            
            grid.appendChild(container);
        });
    }

    function populateGifModal(category) {
        const grid = document.getElementById('gallery-modal-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        const gifs = gifData[category] || [];
        
        gifs.forEach((item, index) => {
            const container = document.createElement('div');
            container.className = 'grid-item';
            
            const img = document.createElement('img');
            img.src = item.path;
            img.alt = item.originalName || 'GIF Image';
            img.onclick = () => openLightbox(item, category, index, 'gif');
            
            container.appendChild(img);
            
            if (isAdmin) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-button';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (!confirm('Are you sure you want to delete this GIF?')) return;
                    
                    try {
                        await fetch('/api/media', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                filePath: item.path, 
                                type: 'gifs',
                                category: category 
                            })
                        });
                        
                        gifData[category].splice(index, 1);
                        populateGifModal(category);
                        showToast('GIF deleted successfully', 'success');
                        
                    } catch (error) {
                        showToast('Failed to delete GIF', 'error');
                    }
                };
                container.appendChild(deleteBtn);
            }
            
            grid.appendChild(container);
        });
    }

    // Lightbox functions with smooth animations
    function openLightbox(clickedItem, galleryType, startIndex = 0, type = 'image') {
        if (type === 'gif') {
            currentGallery = gifData[galleryType].map(item => item.path);
        } else {
            currentGallery = galleryData[galleryType].map(item => item.path);
        }
        
        currentIndex = startIndex;
        
        // Close gallery modal with smooth animation
        closeGalleryModal();
        
        // Show lightbox after modal closes
        setTimeout(() => {
            showImageAtIndex(currentIndex);
            const lightbox = elements.lightbox;
            if (lightbox) {
                lightbox.classList.remove('hidden');
                lightbox.style.opacity = '0';
                setTimeout(() => {
                    lightbox.style.opacity = '1';
                }, 50);
            }
        }, 300);
    }

    function showImageAtIndex(index) {
        const lightboxImage = elements.lightboxImage;
        const lightboxPrev = document.getElementById('lightbox-prev');
        const lightboxNext = document.getElementById('lightbox-next');
        
        if (!lightboxImage || index < 0 || index >= currentGallery.length) return;
        
        // Smooth transition between images
        lightboxImage.style.opacity = '0';
        lightboxImage.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            lightboxImage.src = currentGallery[index];
            lightboxImage.style.opacity = '1';
            lightboxImage.style.transform = 'scale(1)';
        }, 150);
        
        if (lightboxPrev) lightboxPrev.style.display = index === 0 ? 'none' : 'block';
        if (lightboxNext) lightboxNext.style.display = index === currentGallery.length - 1 ? 'none' : 'block';
    }

    function closeLightbox() {
        const lightbox = elements.lightbox;
        if (lightbox) {
            lightbox.style.opacity = '0';
            setTimeout(() => {
                lightbox.classList.add('hidden');
            }, 300);
        }
    }

    // Story management
    function openStoryModal(story) {
        const modal = document.getElementById('story-modal');
        const title = document.getElementById('story-modal-title');
        const content = document.getElementById('story-modal-content');
        
        if (!modal || !title || !content) return;
        
        title.textContent = story.title;
        
        // Simulate loading story content
        content.innerHTML = `<p>Loading story content...</p>`;
        
        modal.classList.remove('hidden');
        
        // Load comments
        loadStoryComments(story.id);
        
        // If it's a file-based story, you would load the actual content here
        if (story.filePath) {
            content.innerHTML = `<p>This story is stored as a file: ${story.originalName}</p>`;
        } else {
            content.innerHTML = `<p>${story.content}</p>`;
        }
    }

    function closeStoryModal() {
        const modal = document.getElementById('story-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async function loadStoryComments(storyId) {
        try {
            const response = await fetch(`/api/comments/${storyId}`);
            const comments = await response.json();
            displayComments(comments);
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    }

    function displayComments(comments) {
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        
        commentsList.innerHTML = '';
        
        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment';
            commentDiv.innerHTML = `
                <div class="comment-header">
                    <strong>${comment.author}</strong>
                    <span class="comment-date">${new Date(comment.timestamp).toLocaleDateString()}</span>
                </div>
                <p>${comment.content}</p>
            `;
            commentsList.appendChild(commentDiv);
        });
    }

    // Stories list modal functions
    function openStoriesListModal() {
        const modal = document.getElementById('stories-list-modal');
        if (modal) {
            modal.classList.remove('hidden');
            loadAllStories();
        }
    }

    function closeStoriesListModal() {
        const modal = document.getElementById('stories-list-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async function loadAllStories() {
        try {
            const response = await fetch('/api/stories/all');
            allStories = await response.json();
            displayAllStories(allStories);
        } catch (error) {
            console.error('Failed to load all stories:', error);
        }
    }

    function displayAllStories(stories) {
        const container = document.getElementById('all-stories-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        stories.forEach(story => {
            const storyDiv = document.createElement('div');
            storyDiv.className = 'story-list-item';
            storyDiv.innerHTML = `
                <h4>${story.title}</h4>
                <p>${story.content ? story.content.substring(0, 100) + '...' : 'File-based story'}</p>
                <div class="story-actions">
                    <button onclick="openStoryFromList(${story.id})" class="glass-button">Read</button>
                    ${isAdmin ? `<button onclick="deleteStoryFromList(${story.id})" class="delete-button">Delete</button>` : ''}
                </div>
            `;
            container.appendChild(storyDiv);
        });
    }

    // Search functionality for stories
    function setupStoriesSearch() {
        const searchInput = document.getElementById('stories-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filteredStories = allStories.filter(story => 
                    story.title.toLowerCase().includes(searchTerm) ||
                    (story.content && story.content.toLowerCase().includes(searchTerm))
                );
                displayAllStories(filteredStories);
            });
        }
    }

    // Banner drag functionality
    function setupBannerDrag() {
        const banner = elements.banner;
        const dragButton = document.getElementById('drag-banner-button');
        
        if (!banner || !dragButton) return;
        
        dragButton.addEventListener('click', () => {
            bannerDragMode = !bannerDragMode;
            banner.style.cursor = bannerDragMode ? 'move' : 'default';
            dragButton.style.backgroundColor = bannerDragMode ? '#007BFF' : '';
            showToast(bannerDragMode ? 'Click and drag to reposition banner' : 'Banner positioning disabled', 'info');
        });
        
        let isDragging = false;
        let startX, startY;
        
        banner.addEventListener('mousedown', (e) => {
            if (!bannerDragMode || !isAdmin) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            banner.style.transition = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging || !bannerDragMode) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const rect = banner.getBoundingClientRect();
            const newX = ((rect.left + deltaX) / window.innerWidth) * 100;
            const newY = ((rect.top + deltaY) / window.innerHeight) * 100;
            
            const position = `${Math.max(0, Math.min(100, newX))}% ${Math.max(0, Math.min(100, newY))}%`;
            banner.style.backgroundPosition = position;
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            banner.style.transition = '';
            
            if (bannerDragMode) {
                // Save position to server
                const position = banner.style.backgroundPosition;
                fetch('/api/banner-position', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ position })
                });
            }
        });
    }

    // Initialize page data with social media loading - Updated to exclude reddit
    async function initializePage() {
        if (isAdmin) {
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        }
        
        try {
            const response = await fetch('/api/data');
            const data = await response.json();

            // Update UI elements
            if (elements.username) {
                elements.username.childNodes[0].nodeValue = data.settings.username + ' ';
            }
            if (elements.profilePic) elements.profilePic.src = data.settings.profilePicture;
            if (data.settings.banner && elements.banner) {
                elements.banner.style.backgroundImage = `url(${data.settings.banner})`;
                elements.banner.style.backgroundPosition = data.settings.bannerPosition || 'center center';
            }

            // Update social media widgets - Updated to exclude reddit
            const socialPlatforms = ['youtube', 'steam', 'discord'];
            socialPlatforms.forEach(platform => {
                const profile = data.settings[`${platform}Profile`] || '';
                const url = data.settings[`${platform}Url`] || '#';
                const avatar = data.settings[`${platform}Avatar`] || `/assets/icons/${platform}-icon.png`;
                
                updateSocialWidget(platform, { name: profile, url: url, avatar: avatar });
            });

            // Load gallery data
            galleryData.sfw = (data.galleryImages || []).filter(img => img.category === 'sfw' || !img.category);
            galleryData.nsfw = (data.galleryImages || []).filter(img => img.category === 'nsfw');

            // Load GIF data
            gifData.sfw = (data.gifs || []).filter(gif => gif.category === 'sfw' || !gif.category);
            gifData.nsfw = (data.gifs || []).filter(gif => gif.category === 'nsfw');

            // Load stories (limit to 5 for sidebar)
            if (elements.storyList) {
                elements.storyList.innerHTML = '';
                (data.stories || []).slice(0, 5).forEach(addStoryToList);
            }

            // Update homework count
            if (elements.homeworkCount) {
                const homeworkCount = (data.homework || []).length;
                elements.homeworkCount.textContent = `${homeworkCount} projects uploaded`;
            }

        } catch (error) {
            console.error("Failed to initialize page data:", error);
            showToast('Failed to load page data', 'error');
        }

        await loadMusicLibrary();
    }

    const addStoryToList = (story) => {
        if (!elements.storyList) return;
        
        const storyDiv = document.createElement('div');
        storyDiv.className = 'story-item';
        storyDiv.innerHTML = `
            <div class="story-preview">
                <h4>${story.title}</h4>
                <p>${story.content ? story.content.substring(0, 50) + '...' : 'File-based story'}</p>
            </div>
        `;
        
        storyDiv.querySelector('.story-preview').onclick = () => openStoryModal(story);
        
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (!confirm('Delete this story?')) return;
                try {
                    await fetch(`/api/stories/${story.id}`, { method: 'DELETE' });
                    storyDiv.remove();
                    showToast('Story deleted successfully', 'success');
                } catch (error) {
                    showToast('Failed to delete story', 'error');
                }
            };
            storyDiv.appendChild(deleteBtn);
        }
        
        elements.storyList.appendChild(storyDiv);
    };

    // Global functions for story management
    window.openStoryFromList = (storyId) => {
        const story = allStories.find(s => s.id === storyId);
        if (story) {
            closeStoriesListModal();
            setTimeout(() => openStoryModal(story), 300);
        }
    };

    window.deleteStoryFromList = async (storyId) => {
        if (!confirm('Delete this story?')) return;
        try {
            await fetch(`/api/stories/${storyId}`, { method: 'DELETE' });
            allStories = allStories.filter(s => s.id !== storyId);
            displayAllStories(allStories);
            showToast('Story deleted successfully', 'success');
        } catch (error) {
            showToast('Failed to delete story', 'error');
        }
    };

    // Set up background thumbnails
    const savedBackground = localStorage.getItem('selectedBackground');
    let startingCategory = 'sfw';
    if (savedBackground && backgrounds.nsfw.includes(savedBackground)) {
        startingCategory = 'nsfw';
        const nsfwBtn = document.querySelector('#background-categories button[data-category="nsfw"]');
        const sfwBtn = document.querySelector('#background-categories button[data-category="sfw"]');
        if (nsfwBtn && sfwBtn) {
            nsfwBtn.classList.add('active');
            sfwBtn.classList.remove('active');
        }
    }
    generateThumbnails(startingCategory);
    setBackground(savedBackground || backgrounds.sfw[0]);

    // Theme management
    const themeToggleButton = document.getElementById('theme-toggle');
    function setTheme(theme) {
        document.body.className = document.body.className.replace(/\s*dark-theme\s*/g, '');
        if (theme === 'dark') document.body.classList.add('dark-theme');
        localStorage.setItem('theme', theme);
    }
    setTheme(localStorage.getItem('theme') || 'light');

    // Aspect Toggle management
    const aspectToggleButton = document.getElementById('aspect-toggle');
    function toggleAspect() {
        const currentAspect = localStorage.getItem('aspect') || 'default';
        let newAspect;
        
        if (currentAspect === 'default') {
            newAspect = 'neuro';
            showToast('Switched to Neuro Sama colors', 'info');
        } else if (currentAspect === 'neuro') {
            newAspect = 'evilNeuro';
            showToast('Switched to Evil Neuro Sama colors', 'info');
        } else {
            newAspect = 'default';
            showToast('Switched to default colors', 'info');
        }
        
        setAspect(newAspect);
    }

    // Initialize page
    initializePage();
    setupStoriesSearch();
    setupBannerDrag();

    // EVENT LISTENERS

    // Gallery widget clicks including homework widgets
    document.addEventListener('click', (e) => {
        if (e.target.closest('.gallery-widget')) {
            const widget = e.target.closest('.gallery-widget');
            const category = widget.dataset.category;
            openGalleryModal(category, 'image');
        }
        
        if (e.target.closest('.gif-gallery-widget')) {
            const widget = e.target.closest('.gif-gallery-widget');
            const category = widget.dataset.category;
            openGalleryModal(category, 'gif');
        }
        
        if (e.target.closest('.homework-widget')) {
            const widget = e.target.closest('.homework-widget');
            const category = widget.dataset.category;
            console.log('Homework widget clicked:', category);
            // Load and display files for this category
            loadHomeworkByCategory(category);
            openHomeworkModal();
        }
    });

    // Music player controls - Updated for sidebar player
    if (elements.playPauseBtn) {
        elements.playPauseBtn.addEventListener('click', () => {
            console.log('Play/pause clicked, isPlaying:', isPlaying);
            if (isPlaying) {
                pauseSong();
            } else {
                playSong();
            }
        });
    }
    
    if (elements.prevBtn) elements.prevBtn.addEventListener('click', prevSong);
    if (elements.nextBtn) elements.nextBtn.addEventListener('click', nextSong);
    
    if (elements.audioPlayer) {
        elements.audioPlayer.addEventListener('timeupdate', updateProgress);
        elements.audioPlayer.addEventListener('ended', nextSong);
        elements.audioPlayer.addEventListener('loadedmetadata', () => {
            console.log('Audio metadata loaded');
        });
        elements.audioPlayer.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            showToast('Audio playback error', 'error');
        });
    }
    
    if (elements.progressContainer) {
        elements.progressContainer.addEventListener('click', setProgress);
    }
    
    if (elements.playlistToggle) {
        elements.playlistToggle.addEventListener('click', () => {
            if (elements.playlist) {
                elements.playlist.classList.toggle('hidden');
                console.log('Playlist toggled');
            }
        });
    }

    // Social media edit buttons - Updated to exclude reddit
    document.querySelectorAll('.social-edit-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const social = btn.dataset.social;
            let promptText = '';
            let currentValue = '';
            
            console.log('Social edit clicked:', social);
            
            switch (social) {
                case 'youtube':
                    promptText = 'Enter your YouTube channel URL (e.g., https://youtube.com/@username):';
                    currentValue = elements.youtubeLink?.href || '';
                    break;
                case 'steam':
                    promptText = 'Enter your Steam profile URL (e.g., https://steamcommunity.com/id/username):';
                    currentValue = document.getElementById('steam-link')?.href || '';
                    break;
                case 'discord':
                    promptText = 'Enter your Discord username (e.g., username#1234):';
                    currentValue = elements.discordProfile?.textContent || '';
                    break;
            }
            
            const newValue = prompt(promptText, currentValue);
            if (!newValue || newValue === currentValue) {
                return;
            }
            
            showToast(`Updating ${social} profile...`, 'info');
            
            try {
                // First try to fetch profile data from the API
                const profile = await fetchSocialProfile(social, newValue);
                
                if (profile) {
                    // API fetch successful
                    updateSocialWidget(social, profile);
                    showToast(`${social} profile updated successfully!`, 'success');
                } else {
                    // Fallback to manual update
                    console.log('API fetch failed, using manual update');
                    
                    const updateData = {};
                    updateData[`${social}Profile`] = newValue;
                    if (social !== 'discord') {
                        updateData[`${social}Url`] = newValue;
                    }
                    
                    const settingsResponse = await fetch('/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updateData)
                    });
                    
                    if (!settingsResponse.ok) {
                        throw new Error('Settings update failed');
                    }
                    
                    // Update UI manually
                    const profile = {
                        name: newValue,
                        url: social !== 'discord' ? newValue : '#',
                        avatar: `/assets/icons/${social}-icon.png`
                    };
                    
                    updateSocialWidget(social, profile);
                    showToast(`${social} profile updated`, 'success');
                }
            } catch (error) {
                console.error('Social media update error:', error);
                showToast(`Failed to update ${social} profile`, 'error');
            }
        };
    });

    // Modal close handlers
    document.addEventListener('click', (e) => {
        // Gallery modal
        if (e.target.classList.contains('gallery-close-button') || 
            (e.target.id === 'gallery-modal' && !e.target.closest('.gallery-modal-content'))) {
            closeGalleryModal();
        }
        
        // Story modal
        if (e.target.classList.contains('story-close-button') || 
            (e.target.id === 'story-modal' && !e.target.closest('.story-modal-content'))) {
            closeStoryModal();
        }
        
        // Homework modal
        if (e.target.classList.contains('homework-close-button') || 
            (e.target.id === 'homework-modal' && !e.target.closest('.homework-modal-content'))) {
            closeHomeworkModal();
        }
        
        // Stories list modal
        if (e.target.classList.contains('stories-list-close-button') || 
            (e.target.id === 'stories-list-modal' && !e.target.closest('.stories-list-modal-content'))) {
            closeStoriesListModal();
        }
    });

    // Upload handlers with multiple file support
    const modalGalleryUploadButton = document.getElementById('modal-gallery-upload-button');
    if (modalGalleryUploadButton) {
        modalGalleryUploadButton.addEventListener('click', async () => {
            const input = document.getElementById('modal-gallery-upload-input');
            if (!input.files || input.files.length === 0) {
                showToast('Please select files', 'error');
                return;
            }
            
            try {
                const data = await uploadMultipleFiles(input.files, 'gallery', currentGalleryType);
                if (data && data.files) {
                    // Add all uploaded files to local data
                    data.files.forEach(file => {
                        galleryData[currentGalleryType].push(file);
                    });
                    populateGalleryModal(currentGalleryType);
                    input.value = '';
                }
            } catch (error) {
                console.error('Gallery upload failed:', error);
            }
        });
    }

    // Homework upload handler
    const modalHomeworkUploadButton = document.getElementById('modal-homework-upload-button');
    if (modalHomeworkUploadButton) {
        modalHomeworkUploadButton.addEventListener('click', async () => {
            const input = document.getElementById('modal-homework-upload-input');
            const categorySelect = document.getElementById('homework-category-select');
            
            if (!input.files || input.files.length === 0) {
                showToast('Please select files', 'error');
                return;
            }
            
            try {
                const category = categorySelect.value;
                const data = await uploadMultipleFiles(input.files, 'homework', category);
                if (data && data.files) {
                    showToast(`${data.count} files uploaded to ${category} category`, 'success');
                    input.value = '';
                    // Refresh homework count
                    await initializePage();
                }
            } catch (error) {
                console.error('Homework upload failed:', error);
            }
        });
    }

    // Story upload handler
    const storyUploadInput = document.getElementById('story-upload-input');
    if (storyUploadInput) {
        storyUploadInput.addEventListener('change', async () => {
            if (!storyUploadInput.files || storyUploadInput.files.length === 0) return;
            
            try {
                const data = await uploadMultipleFiles(storyUploadInput.files, 'story');
                if (data && data.files) {
                    showToast(`${data.count} stories uploaded`, 'success');
                    storyUploadInput.value = '';
                    await initializePage();
                    loadAllStories();
                }
            } catch (error) {
                console.error('Story upload failed:', error);
            }
        });
    }

    // Lightbox controls
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxClose = elements.lightbox?.querySelector('.close-button');

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                showImageAtIndex(currentIndex);
            }
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', () => {
            if (currentIndex < currentGallery.length - 1) {
                currentIndex++;
                showImageAtIndex(currentIndex);
            }
        });
    }

    if (lightboxClose) {
        lightboxClose.onclick = closeLightbox;
    }

    // Background controls
    const backgroundCategories = document.getElementById('background-categories');
    if (backgroundCategories) {
        backgroundCategories.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const category = e.target.dataset.category;
                document.querySelectorAll('#background-categories button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                generateThumbnails(category);
            }
        });
    }

    const backgroundSwitcher = document.getElementById('background-switcher');
    if (backgroundSwitcher) {
        backgroundSwitcher.addEventListener('click', (e) => {
            if (e.target.classList.contains('bg-thumbnail')) {
                setBackground(e.target.dataset.bgPath);
            }
        });
    }

    // Admin controls
    if (isAdmin) {
        const exitAdminButton = document.getElementById('exit-admin-button');
        if (exitAdminButton) {
            exitAdminButton.onclick = () => { window.location.search = ''; };
        }

        const cleanDbButton = document.getElementById('clean-db-button');
        if (cleanDbButton) {
            cleanDbButton.onclick = async () => {
                if (!confirm('This will remove all database entries for files that are missing. Are you sure?')) return;
                try {
                    const response = await fetch('/api/sync-database', { method: 'POST' });
                    const result = await response.json();
                    if (result.success) {
                        showToast(`Sync complete! ${result.cleanedCount} orphaned entries removed.`, 'success');
                        setTimeout(() => window.location.reload(), 2000);
                    }
                } catch (error) {
                    showToast('Sync failed', 'error');
                }
            };
        }

        const removeBannerButton = document.getElementById('remove-banner-button');
        if (removeBannerButton) {
            removeBannerButton.onclick = async () => {
                if (!confirm('Remove the current banner image?')) return;
                try {
                    await fetch('/api/remove-banner', { method: 'POST' });
                    if (elements.banner) elements.banner.style.backgroundImage = '';
                    showToast('Banner removed successfully', 'success');
                } catch (error) {
                    showToast('Failed to remove banner', 'error');
                }
            };
        }

        const adminFab = document.getElementById('admin-fab');
        const adminMenu = document.getElementById('admin-menu');
        if (adminFab && adminMenu) {
            adminFab.onclick = () => adminMenu.classList.toggle('hidden');
        }

        // Username change functionality
        const changeNameButton = document.getElementById('change-name-button');
        if (changeNameButton) {
            changeNameButton.onclick = () => {
                const currentName = elements.username ? elements.username.textContent.trim() : '';
                const newName = prompt('Enter new username:', currentName);
                if (newName && newName !== currentName) {
                    fetch('/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: newName })
                    }).then(() => {
                        if (elements.username) {
                            elements.username.childNodes[0].nodeValue = newName + ' ';
                        }
                        showToast('Username updated successfully', 'success');
                    }).catch(() => {
                        showToast('Failed to update username', 'error');
                    });
                }
            };
        }
    }

    // Theme toggle
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            setTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark');
        });
    }

    // Aspect toggle
    if (aspectToggleButton) {
        aspectToggleButton.addEventListener('click', toggleAspect);
    }

    // Profile picture upload
    if (elements.profilePic) {
        elements.profilePic.onclick = () => {
            if (isAdmin) {
                const input = document.getElementById('profile-picture-upload');
                if (input) input.click();
            }
        };
    }

    const profileUpload = document.getElementById('profile-picture-upload');
    if (profileUpload) {
        profileUpload.onchange = async (e) => {
            if (!e.target.files[0]) return;
            const data = await uploadFile(e.target.files[0], 'profile');
            if (data && elements.profilePic) {
                elements.profilePic.src = data.path;
            }
        };
    }

    // Banner upload
    const bannerBtn = document.getElementById('change-banner-button');
    const bannerUpload = document.getElementById('banner-upload');
    if (bannerBtn && bannerUpload) {
        bannerBtn.onclick = () => bannerUpload.click();
        bannerUpload.onchange = async (e) => {
            if (!e.target.files[0]) return;
            const data = await uploadFile(e.target.files[0], 'banner');
            if (data && elements.banner) {
                elements.banner.style.backgroundImage = `url(${data.path})`;
            }
        };
    }

    // Story form
    const storyForm = document.getElementById('story-form');
    if (storyForm) {
        storyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('story-title').value;
            const content = document.getElementById('story-content').value;
            
            try {
                const response = await fetch('/api/stories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content })
                });
                const story = await response.json();
                addStoryToList(story);
                e.target.reset();
                showToast('Story saved successfully', 'success');
            } catch (error) {
                showToast('Failed to save story', 'error');
            }
        });
    }

    // Comment form
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const author = document.getElementById('comment-author').value;
            const content = document.getElementById('comment-content').value;
            const storyId = currentStoryIndex;
            
            try {
                const response = await fetch('/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ storyId, author, content })
                });
                await response.json();
                e.target.reset();
                loadStoryComments(storyId);
                showToast('Comment posted successfully', 'success');
            } catch (error) {
                showToast('Failed to post comment', 'error');
            }
        });
    }

    // Chat functionality
    if (elements.chatForm) {
        elements.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (elements.chatInput && elements.chatInput.value && socket) {
                socket.emit('chat message', elements.chatInput.value);
                elements.chatInput.value = '';
            }
        });
    }

    if (socket) {
        socket.on('chat message', (msg) => {
            const item = document.createElement('li');
            item.textContent = msg;
            if (elements.messages) {
                elements.messages.appendChild(item);
                elements.messages.scrollTop = elements.messages.scrollHeight;
            }
        });
    }

    // Button click handlers
    const openHomeworkModalBtn = document.getElementById('open-homework-modal');
    if (openHomeworkModalBtn) {
        openHomeworkModalBtn.onclick = openHomeworkModal;
    }

    const viewAllStoriesBtn = document.getElementById('view-all-stories');
    if (viewAllStoriesBtn) {
        viewAllStoriesBtn.onclick = openStoriesListModal;
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Lightbox navigation
        if (elements.lightbox && !elements.lightbox.classList.contains('hidden')) {
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                currentIndex--;
                showImageAtIndex(currentIndex);
            } else if (e.key === 'ArrowRight' && currentIndex < currentGallery.length - 1) {
                currentIndex++;
                showImageAtIndex(currentIndex);
            } else if (e.key === 'Escape') {
                closeLightbox();
            }
        }
        
        // Modal close with Escape
        if (e.key === 'Escape') {
            const modals = ['gallery-modal', 'story-modal', 'homework-modal', 'stories-list-modal'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal && !modal.classList.contains('hidden')) {
                    modal.classList.add('hidden');
                }
            });
        }
    });

    // Placeholder error handling
    if (elements.albumArt) {
        elements.albumArt.onerror = function() {
            this.src = "https://via.placeholder.com/150";
        };
    }
    
    if (elements.profilePic) {
        elements.profilePic.onerror = function() {
            this.src = "https://via.placeholder.com/100";
        };
    }
});