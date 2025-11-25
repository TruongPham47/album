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
    let galleryScale = 1; // Biến scale cho chức năng zoom/pinch

    // Thiết lập thời gian MỚI cho hiệu ứng Chia Bài
    const DEALING_TIME = 2000; 
    const DEALING_DELAY = 300; 

    // --- Cập nhật vị trí ảnh theo vòng tròn (ĐÃ SỬA VÀ THÊM LẠI TRANSFORM 3D) ---
    function updateGalleryTransform() {
        photoCards.forEach((card, index) => {
            // Tính toán vị trí 3D
            const angle = (index / numCards) * (2 * Math.PI) + rotationAngle * Math.PI / 180;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            const rotateY = angle * (180 / Math.PI) + 90;

            // Đặt transform 3D và scale zoom (cardPulse sẽ tự động thêm scale nhịp đập)
            card.style.transform = `
                translateX(-50%) translateY(-50%)
                translate3d(${x}px, 0px, ${z}px)
                rotateY(${rotateY}deg)
                scale(${galleryScale}) /* Thêm lại scale tổng thể (zoom) */
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

    // --- CHỨC NĂNG CHIA ẢNH (Dealing Animation) (ĐÃ SỬA VÀ THÊM LẠI TRANSFORM 3D) ---
    function dealCards() {
        // 1. Đặt tất cả thẻ ở vị trí START
        photoCards.forEach(card => {
            card.style.opacity = 0;
            // Bắt đầu từ vị trí trung tâm (0, 0, 0) với scale nhỏ (chồng bài)
            card.style.transform = `translateX(-50%) translateY(-50%) translate3d(0px, 0px, 0px) rotateY(0deg) scale(0)`;
            // Cài đặt transition cho hiệu ứng bay ra
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

                // Kích hoạt chuyển động (đi tới vị trí 3D + scale zoom ban đầu)
                card.style.transform = `
                    translateX(-50%) translateY(-50%)
                    translate3d(${x}px, 0px, ${z}px)
                    rotateY(${rotateY}deg)
                    scale(${galleryScale}) /* Thêm lại scale tổng thể (zoom) */
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

            }, index * DEALING_DELAY + 100); 
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
            isDragging = false; // Tắt drag khi bắt đầu zoom
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

    function createFallingElement() {
        const el = document.createElement('div');

        const size = Math.random() * 15 + 10;

        el.classList.add('falling-element');

        if (Math.random() > 0.5) {
            el.classList.add('heart');
        } else {
            el.classList.add('leaf');
        }

        el.style.left = Math.random() * window.innerWidth + 'px';
        el.style.width = size + 'px';
        el.style.height = size + 'px';

        el.style.animationDuration = Math.random() * 5 + 6 + 's';

        // Màu
        const colors = ['#ff4d88', '#ff99bb', '#ffc0cb', '#fff'];
        el.style.background = colors[Math.floor(Math.random() * colors.length)];

        fallingContainer.appendChild(el);

        el.addEventListener('animationend', () => el.remove());
    }

    // Tần suất rơi
    setInterval(createFallingElement, 200);

    // --- XỬ LÝ NHẠC NỀN TỰ ĐỘNG PHÁT (GIỮ NGUYÊN) ---

    const backgroundMusic = document.getElementById('background-music');
    let isMusicStarted = false;

    // Hàm bắt đầu phát nhạc
    function startMusic() {
        if (!isMusicStarted) {
            backgroundMusic.volume = 0.5; 
            
            backgroundMusic.play().then(() => {
                console.log("Nhạc nền đã bắt đầu phát thành công.");
                isMusicStarted = true;
                
                // KÍCH HOẠT ANIMATION NHỊP ĐẬP
                photoCards.forEach(card => {
                    card.style.animationPlayState = 'running';
                });
                
                // Loại bỏ các sự kiện lắng nghe
                document.removeEventListener('click', startMusic);
                document.removeEventListener('touchend', startMusic);
                document.removeEventListener('mousemove', startMusic);

            }).catch(error => {
                console.warn("Chưa thể phát nhạc tự động. Vui lòng nhấp chuột hoặc chạm vào màn hình.");
            });
        }
    }

    // Bắt đầu lắng nghe TƯƠNG TÁC
    document.addEventListener('click', startMusic); 
    document.addEventListener('touchend', startMusic); 
    document.addEventListener('mousemove', startMusic);
});