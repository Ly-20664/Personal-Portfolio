// Theme toggle functionality
const themeToggle = document.querySelector('.theme-toggle');
const htmlElement = document.documentElement;

function updateThemeIcon(theme) {
    themeToggle.innerHTML = theme === 'dark' 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
}

function applyTheme(theme) {
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // Initialize EmailJS
    if (window.emailjs) {
        emailjs.init("_LM8I83-0fhkFg8Uq");
    }
});

// EmailJS Contact Form Handling
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading state
        const submitButton = contactForm.querySelector('.submit-button');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        // Get form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        
        // Define template parameters
        const templateParams = {
            from_name: name,
            from_email: email,
            message: message,
            to_name: "Justin Ly",  // Adding recipient name parameter
            reply_to: email,       // Adding reply_to parameter
        };

        // Send email using EmailJS
        emailjs.send("service_g2xtlc8", "template_iou95lh", templateParams)
        .then(
            function(response) {
                console.log("SUCCESS", response);
                alert('Thank you for your message! I will get back to you soon.');
                contactForm.reset();
            },
            function(error) {
                console.log("FAILED", error);
                alert('Sorry, there was an error sending your message. Please try again.');
            }
        ).finally(() => {
            // Reset button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        });
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Highlight active navigation link based on scroll position
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    function updateActiveLink() {
        let currentSection = null;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop - sectionHeight / 3) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink(); // Call initially to set the correct active link
});

// Add scroll-based animations
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Add some CSS for animations
const style = document.createElement('style');
style.textContent = `
    section {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    
    section.animate {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// Mobile navigation toggle (you can expand this later)
const navLinks = document.querySelector('.nav-links');
const logo = document.querySelector('.logo');

if (window.innerWidth <= 768) {
    logo.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Remove all Spotify authentication code
document.addEventListener('DOMContentLoaded', () => {
    // Keep existing theme toggle and other functionality
    const themeToggle = document.querySelector('.theme-toggle'); // Ensure correct selector
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);

    // Set the correct icon based on the saved theme
    themeToggle.innerHTML = savedTheme === 'dark' 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
});

// Check for authentication status
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const spotifyEmbedsContainer = document.getElementById('spotify-embeds');

    if (authStatus === 'error') {
        spotifyEmbedsContainer.innerHTML = `
            <div class="error-message">
                Failed to authenticate with Spotify. 
                <button onclick="window.location.href='/api/spotify/auth-url'">Try Again</button>
            </div>
        `;
    }

    // Clear auth params from URL
    if (authStatus) {
        window.history.replaceState({}, document.title, '/');
    }
});

// Modified loadRecentTracks function
async function loadRecentTracks() {
    const spotifyEmbedsContainer = document.getElementById('spotify-embeds');
    
    try {
        spotifyEmbedsContainer.innerHTML = '<div class="loading-message">Loading recent tracks...</div>';
        
        // Use the public endpoint that doesn't require authentication
        const response = await fetch('/api/spotify/public/recent-tracks');
        
        if (response.status === 429) {
            // Rate limiting - show friendly message with retry button
            const data = await response.json();
            const seconds = data.retryAfter || 30;
            spotifyEmbedsContainer.innerHTML = `
                <div class="error-message">
                    Too many requests. Please try again in ${seconds} seconds.
                    <button onclick="loadRecentTracks()" class="retry-button">Retry</button>
                </div>
            `;
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch tracks: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.items || data.items.length === 0) {
            throw new Error('No tracks found');
        }

        // Clear existing content
        spotifyEmbedsContainer.innerHTML = '';

        // Create card container
        const cardContainer = document.createElement('div');
        cardContainer.className = 'track-card-container';
        
        // Create navigation buttons
        const navigation = document.createElement('div');
        navigation.className = 'track-navigation';
        navigation.innerHTML = `
            <button class="nav-button prev-button"><i class="fas fa-chevron-left"></i></button>
            <button class="nav-button next-button"><i class="fas fa-chevron-right"></i></button>
        `;

        const recentTracks = data.items.slice(0, 7);
        recentTracks.forEach((item, index) => {
            const track = item.track;
            const card = document.createElement('div');
            card.className = `track-card ${index === 0 ? 'previous' : index === 1 ? 'active' : index === 2 ? 'next' : 'hidden'}`;
            
            const iframe = document.createElement('iframe');
            iframe.style.borderRadius = '12px';
            iframe.src = `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`;
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.frameBorder = '0';
            iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
            iframe.loading = 'lazy';
            
            card.appendChild(iframe);
            cardContainer.appendChild(card);
        });

        spotifyEmbedsContainer.appendChild(navigation);
        spotifyEmbedsContainer.appendChild(cardContainer);

        let currentIndex = 1;
        let isTransitioning = false;

        function updateCards(direction) {
            if (isTransitioning) return;
            isTransitioning = true;

            const cards = cardContainer.querySelectorAll('.track-card');
            currentIndex = (currentIndex + direction + recentTracks.length) % recentTracks.length;
            
            cards.forEach((card, index) => {
                const position = (index - currentIndex + recentTracks.length) % recentTracks.length;
                card.className = 'track-card';
                
                if (position === 0) {
                    card.className = 'track-card active';
                } else if (position === 1) {
                    card.className = 'track-card next';
                } else if (position === -1 || position === recentTracks.length - 1) {
                    card.className = 'track-card previous';
                } else {
                    card.className = 'track-card hidden';
                }
            });

            setTimeout(() => {
                isTransitioning = false;
            }, 600);
        }

        const prevButton = navigation.querySelector('.prev-button');
        const nextButton = navigation.querySelector('.next-button');

        prevButton.addEventListener('click', () => updateCards(-1));
        nextButton.addEventListener('click', () => updateCards(1));

        // Auto-advance every 30 seconds if no user interaction
        let autoAdvanceTimer = setInterval(() => updateCards(1), 30000);

        // Reset timer on user interaction
        [prevButton, nextButton].forEach(button => {
            button.addEventListener('click', () => {
                clearInterval(autoAdvanceTimer);
                autoAdvanceTimer = setInterval(() => updateCards(1), 30000);
            });
        });

    } catch (error) {
        console.error('Error loading recent tracks:', error);
        spotifyEmbedsContainer.innerHTML = `
            <div class="error-message">
                ${error.message || 'Error loading recent tracks'}
                <button onclick="loadRecentTracks()" class="retry-button">Retry</button>
            </div>
        `;
    }
}

// Load recent tracks when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadRecentTracks();
    
    // Refresh tracks every 5 minutes
    setInterval(loadRecentTracks, 5 * 60 * 1000);
});