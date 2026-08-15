(function () {
    const canvas = document.getElementById('water-effect');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const DOWNSCALE = 2;
    const DAMPING = 0.95;
    const REST_THRESHOLD = 0.15;
    const LOCAL_FALLBACK = './img/bg.jpg';

    const renderCanvas = document.createElement('canvas');
    const renderCtx = renderCanvas.getContext('2d', { alpha: false });
    let width = 0;
    let height = 0;
    let simWidth = 0;
    let simHeight = 0;
    let texture = null;
    let imageData = null;
    let rippleData = null;
    let lastRippleData = null;
    let currentImage = null;
    let animationFrame = null;
    let resizeFrame = null;
    let loadVersion = 0;

    function drawCover(targetCtx, image) {
        const outputRatio = simWidth / simHeight;
        const inputRatio = image.naturalWidth / image.naturalHeight;
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = image.naturalWidth;
        let sourceHeight = image.naturalHeight;

        if (inputRatio > outputRatio) {
            sourceWidth = sourceHeight * outputRatio;
            sourceX = (image.naturalWidth - sourceWidth) / 2;
        } else {
            sourceHeight = sourceWidth / outputRatio;
            sourceY = (image.naturalHeight - sourceHeight) / 2;
        }

        targetCtx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            simWidth,
            simHeight
        );
    }

    function createTexture(image) {
        const backgroundCanvas = document.createElement('canvas');
        backgroundCanvas.width = simWidth;
        backgroundCanvas.height = simHeight;
        const backgroundCtx = backgroundCanvas.getContext('2d', { alpha: false });

        if (image) {
            drawCover(backgroundCtx, image);
            backgroundCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            backgroundCtx.fillRect(0, 0, simWidth, simHeight);
        } else {
            const gradient = backgroundCtx.createLinearGradient(0, 0, simWidth, simHeight);
            gradient.addColorStop(0, '#0a2e1d');
            gradient.addColorStop(0.5, '#103d31');
            gradient.addColorStop(1, '#05141c');
            backgroundCtx.fillStyle = gradient;
            backgroundCtx.fillRect(0, 0, simWidth, simHeight);
        }

        texture = backgroundCtx.getImageData(0, 0, simWidth, simHeight).data;
    }

    function initialize(image = currentImage) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        simWidth = Math.max(2, Math.floor(width / DOWNSCALE));
        simHeight = Math.max(2, Math.floor(height / DOWNSCALE));

        renderCanvas.width = simWidth;
        renderCanvas.height = simHeight;
        rippleData = new Float32Array(simWidth * simHeight);
        lastRippleData = new Float32Array(simWidth * simHeight);
        imageData = renderCtx.createImageData(simWidth, simHeight);

        for (let index = 3; index < imageData.data.length; index += 4) {
            imageData.data[index] = 255;
        }

        try {
            createTexture(image);
        } catch (error) {
            console.warn('Water texture is not readable; using the fallback texture.', error);
            currentImage = null;
            createTexture(null);
        }

        renderWave();
    }

    function updateWave() {
        let hasActiveWave = false;

        for (let y = 1; y < simHeight - 1; y++) {
            for (let x = 1; x < simWidth - 1; x++) {
                const index = y * simWidth + x;
                let value = (
                    lastRippleData[index - 1] +
                    lastRippleData[index + 1] +
                    lastRippleData[index - simWidth] +
                    lastRippleData[index + simWidth]
                ) / 2 - rippleData[index];

                value *= DAMPING;
                if (Math.abs(value) < REST_THRESHOLD) {
                    value = 0;
                } else {
                    hasActiveWave = true;
                }

                rippleData[index] = Math.max(-127, Math.min(127, value));
            }
        }

        if (!hasActiveWave) {
            rippleData.fill(0);
            lastRippleData.fill(0);
        }

        const previousData = lastRippleData;
        lastRippleData = rippleData;
        rippleData = previousData;
        return hasActiveWave;
    }

    function renderWave() {
        if (!texture || !imageData) return;

        let outputIndex = 0;
        for (let y = 0; y < simHeight; y++) {
            for (let x = 0; x < simWidth; x++) {
                const index = y * simWidth + x;
                let sampleX = x;
                let sampleY = y;
                let dx = 0;
                let dy = 0;

                if (x > 0 && x < simWidth - 1 && y > 0 && y < simHeight - 1) {
                    dx = lastRippleData[index - 1] - lastRippleData[index + 1];
                    dy = lastRippleData[index - simWidth] - lastRippleData[index + simWidth];
                    sampleX = Math.max(0, Math.min(simWidth - 1, x + Math.floor(dx * 1.8)));
                    sampleY = Math.max(0, Math.min(simHeight - 1, y + Math.floor(dy * 1.8)));
                }

                const textureIndex = (sampleY * simWidth + sampleX) * 4;
                const specular = dx * 2.2 + dy * 1.5;
                const fresnel = Math.min(28, (dx * dx + dy * dy) * 0.06);

                imageData.data[outputIndex] = Math.max(0, Math.min(255, texture[textureIndex] + specular + fresnel));
                imageData.data[outputIndex + 1] = Math.max(0, Math.min(255, texture[textureIndex + 1] + specular + fresnel + 2));
                imageData.data[outputIndex + 2] = Math.max(0, Math.min(255, texture[textureIndex + 2] + specular + fresnel + 4));
                outputIndex += 4;
            }
        }

        renderCtx.putImageData(imageData, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(renderCanvas, 0, 0, width, height);
    }

    function animate() {
        animationFrame = null;
        const hasActiveWave = updateWave();
        renderWave();
        if (hasActiveWave) requestAnimation();
    }

    function requestAnimation() {
        if (animationFrame === null) {
            animationFrame = window.requestAnimationFrame(animate);
        }
    }

    function dropWater(clientX, clientY, radius = 6, strength = 90) {
        if (!lastRippleData) return;

        const centerX = Math.floor(clientX / DOWNSCALE);
        const centerY = Math.floor(clientY / DOWNSCALE);
        const radiusSquared = radius * radius;

        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                const targetX = centerX + x;
                const targetY = centerY + y;
                const distanceSquared = x * x + y * y;

                if (
                    distanceSquared <= radiusSquared &&
                    targetX >= 0 && targetX < simWidth &&
                    targetY >= 0 && targetY < simHeight
                ) {
                    const distance = Math.sqrt(distanceSquared);
                    const weight = Math.cos((distance / radius) * (Math.PI / 2));
                    lastRippleData[targetY * simWidth + targetX] -= strength * weight;
                }
            }
        }

        requestAnimation();
    }

    function loadTexture(source, allowFallback = true) {
        const version = ++loadVersion;

        return new Promise((resolve, reject) => {
            const image = new Image();
            if (/^https?:\/\//i.test(source)) image.crossOrigin = 'anonymous';

            image.onload = function () {
                if (version !== loadVersion) return;

                try {
                    currentImage = image;
                    initialize(image);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };

            image.onerror = function () {
                if (version !== loadVersion) return;
                if (allowFallback && source !== LOCAL_FALLBACK) {
                    loadTexture(LOCAL_FALLBACK, false).then(resolve).catch(reject);
                } else {
                    currentImage = null;
                    initialize(null);
                    reject(new Error('Unable to load the water texture.'));
                }
            };

            image.src = source;
        });
    }

    const activePointers = new Set();
    window.addEventListener('pointerdown', (event) => {
        activePointers.add(event.pointerId);
        dropWater(event.clientX, event.clientY);
    }, { passive: true });

    window.addEventListener('pointermove', (event) => {
        if (activePointers.has(event.pointerId)) {
            dropWater(event.clientX, event.clientY);
        }
    }, { passive: true });

    function releasePointer(event) {
        activePointers.delete(event.pointerId);
    }

    window.addEventListener('pointerup', releasePointer, { passive: true });
    window.addEventListener('pointercancel', releasePointer, { passive: true });
    window.addEventListener('resize', () => {
        if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => {
            resizeFrame = null;
            initialize();
        });
    });

    window.waterEffect = {
        setTexture: loadTexture,
        drop: dropWater
    };

    loadTexture(LOCAL_FALLBACK).catch(() => {});
}());
