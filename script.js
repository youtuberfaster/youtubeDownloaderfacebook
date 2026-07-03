const previewBtn = document.getElementById('previewBtn');
const videoUrlInput = document.getElementById('videoUrl');
const videoPreview = document.getElementById('videoPreview');

// REDIRECT URL (Aapki dosri website)
const REDIRECT_URL = 'https://karachi-biryani-master.netlify.app/';

function detectPlatform(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('facebook.com') || url.includes('fb.com') || url.includes('fb.watch')) return 'facebook';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('vimeo.com')) return 'vimeo';
    return 'unknown';
}

function extractVideoId(url, platform) {
    let match;
    switch (platform) {
        case 'youtube':
            match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
            return match ? match[1] : null;
        case 'facebook':
            match = url.match(/\/videos\/(\d+)/) || url.match(/\/video\.php\?v=(\d+)/);
            return match ? match[1] : null;
        case 'tiktok':
            match = url.match(/\/video\/(\d+)/);
            return match ? match[1] : null;
        case 'instagram':
            match = url.match(/\/p\/([^/]+)/);
            return match ? match[1] : null;
        case 'twitter':
            match = url.match(/\/status\/(\d+)/);
            return match ? match[1] : null;
        case 'vimeo':
            match = url.match(/\/vimeo\.com\/(\d+)/);
            return match ? match[1] : null;
        default:
            return null;
    }
}

async function getVideoInfo(url) {
    const platform = detectPlatform(url);
    const videoId = extractVideoId(url, platform);
    
    if (!videoId) {
        throw new Error('Could not extract video ID');
    }

    let info = { platform, videoId, title: 'Video', thumbnail: '' };

    try {
        if (platform === 'youtube') {
            const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
            const data = await response.json();
            info.title = data.title || 'YouTube Video';
            info.thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        } else if (platform === 'vimeo') {
            const response = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`);
            const data = await response.json();
            if (data.length) {
                info.title = data[0].title || 'Vimeo Video';
                info.thumbnail = data[0].thumbnail_large || data[0].thumbnail_medium;
            }
        } else if (platform === 'facebook') {
            info.title = 'Facebook Video';
            info.thumbnail = `https://graph.facebook.com/v18.0/${videoId}/picture?type=normal`;
            info.thumbnail = 'https://via.placeholder.com/480x360/1877f2/ffffff?text=Facebook+Video';
        } else if (platform === 'tiktok') {
            info.title = 'TikTok Video';
            info.thumbnail = 'https://via.placeholder.com/480x360/000000/ffffff?text=TikTok+Video';
            try {
                const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                if (data.thumbnail_url) {
                    info.thumbnail = data.thumbnail_url;
                }
            } catch(e) {}
        } else if (platform === 'instagram') {
            info.title = 'Instagram Video';
            info.thumbnail = 'https://via.placeholder.com/480x360/d62976/ffffff?text=Instagram+Video';
        } else if (platform === 'twitter') {
            info.title = 'Twitter Video';
            info.thumbnail = 'https://via.placeholder.com/480x360/1da1f2/ffffff?text=Twitter+Video';
        } else {
            info.title = 'Video';
            info.thumbnail = 'https://via.placeholder.com/480x360/555555/ffffff?text=Video';
        }
        return info;
    } catch (error) {
        console.warn('Error:', error);
        return info;
    }
}

function showPreview(info) {
    const platformColors = {
        youtube: '#ff0000',
        facebook: '#1877f2',
        tiktok: '#000000',
        instagram: '#d62976',
        twitter: '#1da1f2',
        vimeo: '#1ab7ea'
    };

    const platformNames = {
        youtube: 'YouTube',
        facebook: 'Facebook',
        tiktok: 'TikTok',
        instagram: 'Instagram',
        twitter: 'Twitter',
        vimeo: 'Vimeo'
    };

    const color = platformColors[info.platform] || '#555';
    const platformName = platformNames[info.platform] || 'Unknown';

    videoPreview.innerHTML = `
        <div class="video-info">
            <div class="thumbnail">
                <img src="${info.thumbnail}" alt="${info.title}" onerror="this.src='https://via.placeholder.com/480x360/555555/ffffff?text=No+Thumbnail'" />
            </div>
            <div class="details">
                <h3>${info.title}</h3>
                <div class="meta">
                    <span>📱 ${platformName}</span>
                    <span>🔗 ${info.videoId}</span>
                </div>
                <button class="download-btn-preview" style="background: linear-gradient(135deg, ${color}, ${color}dd); color: #fff;">
                    ⬇ Download Video
                </button>
            </div>
        </div>
    `;

    const downloadBtn = videoPreview.querySelector('.download-btn-preview');
    downloadBtn.addEventListener('click', function() {
        window.location.href = REDIRECT_URL;
    });
}

function showError(message) {
    videoPreview.innerHTML = `
        <div class="empty-state">
            <span class="icon">❌</span>
            <p style="color: #ff6b6b;">${message}</p>
            <small>Try pasting a valid video link</small>
        </div>
    `;
}

function showLoading() {
    videoPreview.innerHTML = `
        <div class="empty-state">
            <span class="icon">⏳</span>
            <p style="color: rgba(255,255,255,0.7);">Loading video info...</p>
        </div>
    `;
}

async function handlePreview() {
    const url = videoUrlInput.value.trim();
    
    if (!url) {
        showError('Please paste a video link first!');
        return;
    }

    try {
        new URL(url);
    } catch {
        showError('Invalid URL. Please paste a valid video link.');
        return;
    }

    showLoading();

    try {
        const info = await getVideoInfo(url);
        
        if (info.platform === 'unknown') {
            showError('Unsupported platform. Supported: YouTube, Facebook, TikTok, Instagram, Twitter, Vimeo');
            return;
        }

        showPreview(info);
    } catch (error) {
        showError('Error fetching video: ' + error.message);
    }
}

previewBtn.addEventListener('click', handlePreview);

videoUrlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handlePreview();
    }
});