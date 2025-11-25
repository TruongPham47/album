document.addEventListener('DOMContentLoaded', () => {
    console.log("Script đã tải và chạy với XOAY + KÉO/CHẠM + ZOOM + HOA RƠI + CHIA ẢNH CHẬM!");

    const gallery = document.querySelector('.photo-gallery');
    const photoCards = document.querySelectorAll('.photo-card');
    const numCards = photoCards.length;
    const radius = 300; // Bán kính vòng xoay 3D
    let rotationAngle = 0;
    let animationId = null;
    let isDragging = false;
    let startX = 0;
    let startRotation = 0;
    let galleryScale = 1;

    // Thiết lập thời gian MỚI cho hiệu ứng Chia Bài (ĐÃ LÀM CHẬM)
    const DEALING_TIME = 1200; // Thời gian bay của một thẻ (ms) - Nhanh hơn 800ms
    const DEALING_DELAY = 150; // Khoảng cách giữa các thẻ (ms) - Nhanh hơn 100ms

    // --- Cập nhật vị trí ảnh theo vòng tròn ---
    function updateGalleryTransform() {
        photoCards.forEach((card, index) => {
            // Tính toán vị trí 3D
            const angle = (index / numCards) * (2 * Math.PI) + rotationAngle * Math.PI / 180;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            const rotateY = angle * (180 / Math.PI) + 90;

            card.style.transform = `
                translateX(-50%) translateY(-50%)
                translate3d(${x}px, 0px, ${z}px)
                rotateY(${rotateY}deg)
                scale(${galleryScale})
            `;
            // Cài opacity = 1 cho các thẻ đã được chia
            if (card.style.opacity !== '0') { 
                card.style.opacity = 1; 
            }
        });
    }

    // --- Auto rotate ---
    function animate() {
        if (!isDragging) {
            rotationAngle += 0.15;
            updateGalleryTransform();
        }
        animationId = requestAnimationFrame(animate);
    }

    function stopAutoRotate() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function startAutoRotate() {
        if (!animationId) animate();
    }

    // --- CHỨC NĂNG CHIA ẢNH (Dealing Animation) ---
    function dealCards() {
        // 1. Đặt tất cả thẻ ở vị trí START
        photoCards.forEach(card => {
            card.style.opacity = 0;
            // Bắt đầu từ vị trí trung tâm (0, 0, 0) với scale nhỏ (chồng bài)
            card.style.transform = `translateX(-50%) translateY(-50%) translate3d(0px, 0px, 0px) rotateY(0deg) scale(0)`;
            // Cài đặt transition cho hiệu ứng bay ra (SỬ DỤNG DEALING_TIME MỚI)
            card.style.transition = `transform ${DEALING_TIME}ms ease-out, opacity ${DEALING_TIME * 0.5}ms ease-in`;
        });

        // 2. Kích hoạt hiệu ứng Chia Bài tuần tự
        photoCards.forEach((card, index) => {
            setTimeout(() => {
                // Tính toán vị trí 3D cuối cùng
                const angle = (index / numCards) * (2 * Math.PI) + rotationAngle * Math.PI / 180;
                const x = radius * Math.cos(angle);
                const z = radius * Math.sin(angle);
                const rotateY = angle * (180 / Math.PI) + 90;

                // Kích hoạt chuyển động (đi tới vị trí 3D)
                card.style.transform = `
                    translateX(-50%) translateY(-50%)
                    translate3d(${x}px, 0px, ${z}px)
                    rotateY(${rotateY}deg)
                    scale(${galleryScale})
                `;
                card.style.opacity = 1;

                // Sau khi thẻ cuối cùng được kích hoạt, đợi nó bay xong rồi bắt đầu xoay tự động
                if (index === numCards - 1) {
                    setTimeout(() => {
                        // Gỡ bỏ transition để thao tác kéo/zoom không bị delay
                        photoCards.forEach(c => {
                            c.style.transition = '';
                        });
                        startAutoRotate();
                    }, DEALING_TIME); 
                }

            }, index * DEALING_DELAY + 100); // Mỗi thẻ chia cách nhau 150ms (DEALING_DELAY MỚI)
        });
    }
    
    // Bắt đầu bằng việc chia bài (deal cards)
    dealCards();
    
    // ---------------------------------------------
    // --- Drag xoay (GIỮ NGUYÊN) ---
    gallery.addEventListener('mousedown', (e) => {
        isDragging = true;
        stopAutoRotate();
        startX = e.clientX;
        startRotation = rotationAngle;
        gallery.style.cursor = 'grabbing';
        e.preventDefault();
    });

    gallery.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            stopAutoRotate();
            startX = e.touches[0].clientX;
            startRotation = rotationAngle;
        }
    }, { passive: false });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        rotationAngle = startRotation - (deltaX / 3); 
        updateGalleryTransform();
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - startX;
        rotationAngle = startRotation - (deltaX / 3); 
        updateGalleryTransform();
    }, { passive: false });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            gallery.style.cursor = 'grab';
            startAutoRotate();
        }
    });

    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            startAutoRotate();
        }
    });

    // --- Zoom (GIỮ NGUYÊN) ---
    gallery.addEventListener('wheel', (e) => {
        e.preventDefault();
        galleryScale += e.deltaY < 0 ? 0.05 : -0.05; 
        galleryScale = Math.min(Math.max(galleryScale, 0.8), 1.5); 
        updateGalleryTransform();
    });

    let startDistance = 0;
    gallery.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            startDistance = Math.sqrt(dx*dx + dy*dy);
        }
    }, { passive: false });

    gallery.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const newDistance = Math.sqrt(dx*dx + dy*dy);
            if (startDistance) {
                const scaleChange = newDistance / startDistance;
                galleryScale *= scaleChange;
                galleryScale = Math.min(Math.max(galleryScale, 0.8), 1.5); 
                updateGalleryTransform();
                startDistance = newDistance;
            }
        }
    }, { passive: false });

    // --- Hiệu ứng hoa rơi (GIỮ NGUYÊN) ---
    const fallingContainer = document.querySelector('.falling-elements-container');
    const types = ['leaf', 'heart'];
    const colors = ['rgba(255,192,203,0.8)', 'rgba(255,105,180,0.9)', 'rgba(255,220,230,0.7)'];

    function createFallingElement() {
        const element = document.createElement('div');
        const type = types[Math.floor(Math.random() * types.length)];
        const size = Math.random() * 15 + 10;

        element.classList.add('falling-element', type);
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
        element.style.left = `${Math.random() * 100}vw`;
        element.style.animationDuration = `${Math.random() * 5 + 5}s`;
        element.style.animationDelay = `${Math.random() * -5}s`;
        element.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        fallingContainer.appendChild(element);
        element.addEventListener('animationend', () => element.remove());
    }

    setInterval(createFallingElement, 300);
});